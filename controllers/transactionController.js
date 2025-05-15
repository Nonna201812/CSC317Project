const Transaction = require('../models/Transaction');
const BudgetLimit = require('../models/BudgetLimit');
const User = require('../models/User');
const sendBudgetAlert = require('../utils/mailer');

// Helper function for user session check
const checkAuth = (req, res, next) => {
    if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Helper function for category validation
const validateCategory = (category) => {
    return category?.trim() || null;
};

// In-memory cache for budget limits (to reduce DB calls)
const budgetLimitCache = new Map();

// POST /auth/login
exports.postLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password (assuming you have a password hashing mechanism)
        const isMatch = password === user.password;  // Replace with bcrypt.compare if using bcrypt
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set the session
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
            const { description, amount, date, category, type } = req.body;

            // Validate inputs
            if (!description?.trim() || description.length > 500) {
                return res.status(400).json({ error: 'Description is required and cannot exceed 500 characters' });
            }
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ error: 'Invalid type. Must be either "income" or "expense"' });
            }
            const validatedCategory = validateCategory(category);
            if (!validatedCategory) {
                return res.status(400).json({ error: 'Invalid category' });
            }
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                return res.status(400).json({ error: 'Invalid date. Cannot be in the future' });
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number' });
            }

            // Create and save the transaction
            const transaction = new Transaction({
                description: description.trim(),
                amount: parsedAmount,
                date: parsedDate,
                category: validatedCategory,
                type: type.trim(),
                user: req.userId
            });
            const saved = await transaction.save();

            // Check for budget limit breach
            const cacheKey = `${req.userId}:${validatedCategory}`;
            let budgetLimit = budgetLimitCache.get(cacheKey);
            if (!budgetLimit) {
                const limitDoc = await BudgetLimit.findOne({
                    user: req.userId,
                    category: validatedCategory
                });
                if (limitDoc) {
                    budgetLimit = limitDoc.limit;
                    budgetLimitCache.set(cacheKey, budgetLimit);
                }
            }

            // Check if the budget limit is breached
            if (budgetLimit) {
                const totalSpent = await Transaction.aggregate([
                    { $match: { user: transaction.user, category: validatedCategory } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);

                if (totalSpent.length > 0 && totalSpent[0].total >= budgetLimit) {
                    const user = await User.findById(req.userId).select('email username');
                    if (user?.email) {
                        await sendBudgetAlert(user.email, user.username);
                        console.log('✅ Budget alert sent to:', user.email);
                    }
                }
            }

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
            const transactions = await Transaction.find({ user: req.session.user.id }).sort('-date');
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
            const tx = await Transaction.findOne({
                _id: req.params.id,
                user: req.session.user.id
            });
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
            const { description, amount, date, category, type } = req.body;
            const updates = {};

            if (description) updates.description = description.trim();
            if (amount) updates.amount = parseFloat(amount);
            if (date) updates.date = new Date(date);
            if (category) updates.category = validateCategory(category);
            if (type) updates.type = type.trim();

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No valid updates provided' });
            }

            const updated = await Transaction.findOneAndUpdate(
                { _id: req.params.id, user: req.session.user.id },
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
            const deleted = await Transaction.findOneAndDelete({
                _id: req.params.id,
                user: req.session.user.id
            });
            if (!deleted) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            next(new Error('Failed to delete transaction: ' + err.message));
        }
    }
];

// SET or UPDATE a budget limit
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
                { user: req.session.user.id, category: validatedCategory },
                { limit: parsedLimit },
                { new: true, upsert: true, runValidators: true, context: 'query' }
            );
            budgetLimitCache.set(`${req.session.user.id}:${validatedCategory}`, parsedLimit);
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