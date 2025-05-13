const Transaction = require('../models/Transaction');
const BudgetLimit = require('../models/BudgetLimit');
const User = require('../models/User');
const sendBudgetAlert = require('../utils/mailer');

// Helper function for user session check
const checkAuth = (req, res, next) => {
    if (!req.session?.user?.id) {
        res.status(401).json({ error: 'Unauthorized' });
        return; // Avoid returning the void next() call
    }
    next();
};

// Helper function for category validation
const validateCategory = (category) => {
    return category?.trim() || null;
};

// In-memory cache for budget limits (to reduce DB calls)
const budgetLimitCache = new Map();

// CREATE a new transaction
exports.createTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const { description, amount, date, category } = req.body;

            // Enhanced validation
            if (!description?.trim() || description.length > 500) {
                res.status(400).json({ error: 'Invalid description' });
                return;
            }

            const validatedCategory = validateCategory(category);
            if (!validatedCategory) {
                res.status(400).json({ error: 'Invalid category' });
                return;
            }

            // Validate date format before parsing
            if (!/\d{4}-\d{2}-\d{2}/.test(date)) {
                res.status(400).json({ error: 'Date must be in the format YYYY-MM-DD' });
                return;
            }
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                res.status(400).json({ error: 'Invalid date' });
                return;
            }

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                res.status(400).json({ error: 'Amount must be a positive number' });
                return;
            }

            const transaction = new Transaction({
                description: description.trim(),
                amount: parsedAmount,
                date: parsedDate,
                category: validatedCategory,
                user: req.session.user.id
            });

            const saved = await transaction.save();

            // Check for budget limit breach (using cache)
            const cacheKey = `${req.session.user.id}:${validatedCategory}`;
            let budgetLimit = budgetLimitCache.get(cacheKey);

            if (!budgetLimit) {
                const limitDoc = await BudgetLimit.findOne({
                    user: req.session.user.id,
                    category: validatedCategory
                });
                if (limitDoc) {
                    budgetLimit = limitDoc.limit;
                    budgetLimitCache.set(cacheKey, budgetLimit);
                }
            }

            if (budgetLimit) {
                const totalSpent = await Transaction.aggregate([
                    { $match: { user: transaction.user, category: validatedCategory } },
                    { $group: { _id: null, total: { $sum: '$amount' } } },
                    { $project: { total: 1 } }
                ]).hint({ user: 1, category: 1 });

                if (totalSpent[0]?.total >= budgetLimit) {
                    const user = await User.findById(req.session.user.id);
                    if (user && user.email) {
                        await sendBudgetAlert(user.email, user.username);
                        console.log('✅ Budget alert sent to:', user.email);
                    }
                }
            }

            res.status(201).json(saved);
        } catch (err) {
            next(new Error('Failed to create transaction: ' + err.message));
        }
    }
];

// UPDATE a transaction
exports.updateTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const updates = {};
            const { description, amount, date, category } = req.body;

            if (description !== undefined) {
                if (!description.trim() || description.length > 500) {
                    res.status(400).json({ error: 'Invalid description' });
                    return;
                }
                updates.description = description.trim();
            }

            if (amount !== undefined) {
                const parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                    res.status(400).json({ error: 'Amount must be a positive number' });
                    return;
                }
                updates.amount = parsedAmount;
            }

            if (date !== undefined) {
                const parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                    res.status(400).json({ error: 'Invalid date' });
                    return;
                }
                updates.date = parsedDate;
            }

            if (category !== undefined) {
                const validatedCategory = validateCategory(category);
                if (!validatedCategory) {
                    res.status(400).json({ error: 'Invalid category' });
                    return;
                }
                updates.category = validatedCategory;
            }

            if (Object.keys(updates).length === 0) {
                res.status(400).json({ error: 'No valid updates provided' });
                return;
            }

            const updated = await Transaction.findOneAndUpdate(
                { _id: req.params.id, user: req.session.user.id },
                updates,
                { new: true, runValidators: true }
            );

            if (!updated) {
                res.status(404).json({ error: 'Transaction not found' });
                return;
            }

            res.json(updated);
        } catch (err) {
            next(new Error('Failed to update transaction: ' + err.message));
        }
    }
];
