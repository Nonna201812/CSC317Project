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

// CREATE a new transaction
const createTransaction = [
    checkAuth,
    async (req, res, next) => {
        try {
            const { description, amount, date, category, type } = req.body;

            // Validate inputs
            if (!description?.trim() || description.length > 500) {
                return res.status(400).json({ error: 'Invalid description' });
            }
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ error: 'Invalid type' });
            }
            const validatedCategory = validateCategory(category);
            if (!validatedCategory) {
                return res.status(400).json({ error: 'Invalid category' });
            }
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                return res.status(400).json({ error: 'Invalid date' });
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
                user: req.session.user.id
            });
            const saved = await transaction.save();

            // Check for budget limit breach
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
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);
                if (totalSpent[0]?.total >= budgetLimit) {
                    const user = await User.findById(req.session.user.id).select('email username');
                    if (user?.email) {
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

module.exports = {
    createTransaction
};
