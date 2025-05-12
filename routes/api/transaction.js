// Required Dependencies

const express = require('express');
const { body, validationResult } = require('express-validator');
const BudgetLimit = require('../../models/BudgetLimit');
const Transaction = require('../../models/Transaction');
const sendBudgetAlert = require('../../utils/mailer');

const router = express.Router();

// Helper function for checking budget limits
async function checkBudgetLimit(userId, category, amount) {
    const budget = await BudgetLimit.findOne({ user: userId, category });
    if (budget && amount > budget.limit) {
        await sendBudgetAlert(userId, category, amount, budget.limit);
        return `Alert: You have exceeded the budget limit for ${category}!`;
    }
    return null;
}

// Middleware to handle validation errors
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Create a new transaction
router.post('/api/transactions', [
    body('description').notEmpty().withMessage('Description is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
    validateRequest,
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { description, amount, category } = req.body;
        const transaction = new Transaction({ description, amount, category, user: req.user._id });
        await transaction.save();
        const alertMessage = await checkBudgetLimit(req.user._id, category, amount);
        res.status(201).json({ message: 'Transaction created', alert: alertMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all transactions for a user
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id });
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
