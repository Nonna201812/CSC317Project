// controllers/transactionController.js
// ───────────────────────────────────
// Disable TS type‑checking in this JS file
// so Mongoose methods don’t throw “expected 3 args” errors in your editor.
// If you’d rather keep TS on, remove this line and install
// `npm install --save-dev @types/mongoose`
// @ts-nocheck

const Transaction  = require('../models/Transaction');
const BudgetLimit  = require('../models/BudgetLimit');
const User         = require('../models/User');
const sendBudgetAlert = require('../utils/mailer');

// Middleware to ensure the user is logged in
const checkAuth = (req, res, next) => {
    if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

const validateCategory = (cat) => cat?.trim() || null;
const budgetLimitCache = new Map();

// ─ CREATE ──────────────────────────────────────────────────────────────────────
const createTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const { description, amount, date, category } = req.body;
            if (!description?.trim() || description.length > 500) {
                return res.status(400).json({ error: 'Invalid description' });
            }
            const validatedCategory = validateCategory(category);
            if (!validatedCategory) {
                return res.status(400).json({ error: 'Invalid category' });
            }
            const parsedDate = new Date(date);
            if (isNaN(parsedDate) || parsedDate > new Date()) {
                return res.status(400).json({ error: 'Invalid date' });
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be positive' });
            }

            const tx = new Transaction({
                description: description.trim(),
                amount:      parsedAmount,
                date:        parsedDate,
                category:    validatedCategory,
                user:        req.session.user.id
            });
            const saved = await tx.save();

            // check budget limit
            const cacheKey = `${req.session.user.id}:${validatedCategory}`;
            let limit = budgetLimitCache.get(cacheKey);
            if (limit == null) {
                const doc = await BudgetLimit
                    .findOne({ user: req.session.user.id, category: validatedCategory })
                    .exec();
                if (doc) {
                    limit = doc.limit;
                    budgetLimitCache.set(cacheKey, limit);
                }
            }
            if (limit != null) {
                const agg = await Transaction
                    .aggregate([
                        { $match: { user: tx.user, category: validatedCategory } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ])
                    .exec();
                if (agg[0]?.total >= limit) {
                    const usr = await User
                        .findById(req.session.user.id)
                        .select('email username')
                        .exec();
                    if (usr?.email) {
                        await sendBudgetAlert(usr.email, usr.username);
                    }
                }
            }

            res.status(201).json(saved);
        } catch (err) {
            next(new Error('Failed to create transaction: ' + err.message));
        }
    }
];

// ─ READ ALL ────────────────────────────────────────────────────────────────────
const getTransactions = [
    checkAuth,
    async (req, res, next) => {
        try {
            const list = await Transaction
                .find({ user: req.session.user.id })
                .sort('-date')
                .exec();
            res.json(list);
        } catch (err) {
            next(new Error('Failed to fetch transactions: ' + err.message));
        }
    }
];

// ─ READ ONE ────────────────────────────────────────────────────────────────────
const getTransactionById = [
    checkAuth,
    async (req, res, next) => {
        try {
            const one = await Transaction
                .findOne({ _id: req.params.id, user: req.session.user.id })
                .exec();
            if (!one) return res.status(404).json({ error: 'Not found' });
            res.json(one);
        } catch (err) {
            next(new Error('Failed to fetch transaction: ' + err.message));
        }
    }
];

// ─ UPDATE ──────────────────────────────────────────────────────────────────────
const updateTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const updates = {};
            const { description, amount, date, category } = req.body;
            if (description !== undefined) {
                if (!description.trim() || description.length > 500) {
                    return res.status(400).json({ error: 'Invalid description' });
                }
                updates.description = description.trim();
            }
            if (amount !== undefined) {
                const val = parseFloat(amount);
                if (isNaN(val) || val <= 0) {
                    return res.status(400).json({ error: 'Amount must be positive' });
                }
                updates.amount = val;
            }
            if (date !== undefined) {
                const d = new Date(date);
                if (isNaN(d) || d > new Date()) {
                    return res.status(400).json({ error: 'Invalid date' });
                }
                updates.date = d;
            }
            if (category !== undefined) {
                const cat = validateCategory(category);
                if (!cat) {
                    return res.status(400).json({ error: 'Invalid category' });
                }
                updates.category = cat;
            }
            if (!Object.keys(updates).length) {
                return res.status(400).json({ error: 'No valid updates' });
            }

            const updated = await Transaction
                .findOneAndUpdate(
                    { _id: req.params.id, user: req.session.user.id },
                    updates,
                    { new: true, runValidators: true, context: 'query' }
                )
                .exec();
            if (!updated) return res.status(404).json({ error: 'Not found' });
            res.json(updated);
        } catch (err) {
            next(new Error('Failed to update transaction: ' + err.message));
        }
    }
];

// ─ DELETE ──────────────────────────────────────────────────────────────────────
const deleteTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const removed = await Transaction
                .findOneAndDelete(
                    { _id: req.params.id, user: req.session.user.id },
                    {}                // ← satisfy TS signature: filter + options
                )
                .exec();
            if (!removed) return res.status(404).json({ error: 'Not found' });
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            next(new Error('Failed to delete transaction: ' + err.message));
        }
    }
];

// ─ SET/UPDATE BUDGET LIMIT ────────────────────────────────────────────────────
const setLimit = [
    checkAuth,
    async (req, res, next) => {
        try {
            const { category, limit } = req.body;
            const cat = validateCategory(category);
            if (!cat) return res.status(400).json({ error: 'Invalid category' });
            const num = parseFloat(limit);
            if (isNaN(num) || num <= 0) {
                return res.status(400).json({ error: 'Limit must be positive' });
            }
            const saved = await BudgetLimit
                .findOneAndUpdate(
                    { user: req.session.user.id, category: cat },
                    { limit: num },
                    { new: true, upsert: true, runValidators: true, context: 'query' }
                )
                .exec();

            budgetLimitCache.set(`${req.session.user.id}:${cat}`, num);
            res.status(201).json(saved);
        } catch (err) {
            next(new Error('Failed to set budget limit: ' + err.message));
        }
    }
];

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    setLimit
};
