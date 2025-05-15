const Transaction = require('../models/Transaction');
const BudgetLimit = require('../models/BudgetLimit');
const User = require('../models/User');
const sendBudgetAlert = require('../utils/mailer');
const mongoose = require('mongoose');


// Helper function for user session check
const checkAuth = (req, res, next) => {
    if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.userId = req.session.user.id;
    next();
};

// Helper function for category validation
const validateCategory = (category) => {
    return category?.trim() || null;
};

// Helper function for input validation
const validateTransactionInput = ({ description, amount, date, category, type }) => {
    if (!description || description.trim().length === 0 || description.length > 500) {
        throw new Error('Description is required and cannot exceed 500 characters');
    }
    if (!['income', 'expense'].includes(type)) {
        throw new Error('Invalid type. Must be either "income" or "expense"');
    }
    const validatedCategory = validateCategory(category);
    if (!validatedCategory) {
        throw new Error('Invalid category');
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
        throw new Error('Invalid date. Cannot be in the future');
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Amount must be a positive number');
    }
    return {
        description: description.trim(),
        amount: parsedAmount,
        date: parsedDate,
        category: validatedCategory,
        type: type.trim()
    };
};

// In-memory cache for budget limits (to reduce DB calls)
const budgetLimitCache = new Map();

// Helper function for budget limit checking
const checkBudgetLimit = async (userId, category, amount) => {
    const cacheKey = `${userId}:${category}`;
    let budgetLimit = budgetLimitCache.get(cacheKey);

    if (!budgetLimit) {
        const limitDoc = await BudgetLimit.findOne({ user: userId, category });
        if (limitDoc) {
            budgetLimit = limitDoc.limit;
            budgetLimitCache.set(cacheKey, budgetLimit);
            console.log(`✅ Budget limit cached: ${category} -> ${budgetLimit}`);
        }
    }

    if (!budgetLimit) return;

    const totalSpentAgg = await Transaction.aggregate([
        { $match: { user: userId, category } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentSpent = totalSpentAgg[0]?.total || 0;
    const newTotal = currentSpent + amount;

    if (newTotal > budgetLimit) {
        const user = await User.findById(userId).select('email username');
        if (user?.email) {
            try {
                await sendBudgetAlert(user.email, user.username);
                console.log(`✅ Budget alert sent to: ${user.email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send budget alert: ${emailError.message}`);
            }
        }
    }
};

// POST /auth/login
const postLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = password === user.password; // Replace with bcrypt.compare if using hashing
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.user = { id: user._id, email: user.email };
        res.status(200).json({ message: 'Login successful', user: req.session.user });
    } catch (err) {
        console.error("Login Error:", err);
        next(err);
    }
};

// CREATE a new transaction
const createTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const validatedData = validateTransactionInput(req.body);
            const transaction = new Transaction({
                ...validatedData,
                user: req.userId
            });
            const saved = await transaction.save();

            // Check budget limit breach asynchronously
            await checkBudgetLimit(req.userId, validatedData.category, validatedData.amount);

            res.status(201).json(saved);
        } catch (err) {
            console.error("Transaction Creation Error:", err);
            next(new Error('Failed to create transaction: ' + err.message));
        }
    }
];

// GET all transactions
const getTransactions = [
    checkAuth,
    async (req, res, next) => {
        try {
            const transactions = await Transaction.find({ user: req.userId }).sort('-date');
            res.json(transactions);
        } catch (err) {
            next(new Error('Failed to fetch transactions: ' + err.message));
        }
    }
];

// GET a single transaction by ID
const getTransactionById = [
    checkAuth,
    async (req, res, next) => {
        try {
            const tx = await Transaction.findOne({ _id: req.params.id, user: req.userId });
            if (!tx) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json(tx);
        } catch (err) {
            next(new Error('Failed to fetch transaction: ' + err.message));
        }
    }
];

// UPDATE a transaction
const updateTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const updates = {};
            if (req.body.description) updates.description = req.body.description.trim();
            if (req.body.amount) updates.amount = parseFloat(req.body.amount);
            if (req.body.date) updates.date = new Date(req.body.date);
            if (req.body.category) updates.category = validateCategory(req.body.category);
            if (req.body.type) updates.type = req.body.type.trim();

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No valid updates provided' });
            }

            const updated = await Transaction.findOneAndUpdate(
                { _id: req.params.id, user: req.userId },
                updates,
                { new: true, runValidators: true, context: 'query' }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.json(updated);
        } catch (err) {
            next(new Error('Failed to update transaction: ' + err.message));
        }
    }
];

// DELETE a transaction
const deleteTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
            if (!deleted) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            next(new Error('Failed to delete transaction: ' + err.message));
        }
    }
];

const setLimit = [
    checkAuth,
    async (req, res, next) => {
        try {
            const { category, limit } = req.body;
            const validatedCategory = validateCategory(category);
            if (!validatedCategory) {
                return res.status(400).json({ error: 'Invalid category' });
            }
            const parsedLimit = parseFloat(limit);
            if (isNaN(parsedLimit) || parsedLimit <= 0) {
                return res.status(400).json({ error: 'Limit must be a positive number' });
            }

            const saved = await BudgetLimit.findOneAndUpdate(
                { user: req.userId, category: validatedCategory },
                { $set: { limit: parsedLimit } },
                { new: true, upsert: true, runValidators: true }
            );

            // respond with just the new limit
            return res.status(200).json({ limit: saved.limit });
        } catch (err) {
            next(err);
        }
    }
];
const getLimit = [
    checkAuth,
    async (req, res, next) => {
        try {
            const { category } = req.query;
            if (!category) {
                return res.status(400).json({ error: 'Category is required' });
            }

            // Try cache first
            const cacheKey = `${req.userId}:${category}`;
            if (budgetLimitCache.has(cacheKey)) {
                return res.status(200).json({ limit: budgetLimitCache.get(cacheKey) });
            }

            // Fallback to DB
            const record = await BudgetLimit.findOne({
                user: req.userId,
                category
            });

            const limit = record ? record.limit : 0;
            // Populate cache for next time
            budgetLimitCache.set(cacheKey, limit);

            return res.status(200).json({ limit });
        } catch (err) {
            next(err);
        }
    }
];
// Export all handlers
module.exports = {
    postLogin,
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    setLimit,
    getLimit,
};
