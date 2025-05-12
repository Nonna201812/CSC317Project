// routes/api/budgets.js

// Required Dependencies
const express = require('express');
const { body, validationResult } = require('express-validator');
const BudgetLimit = require('../../models/BudgetLimit');
const sendBudgetAlert = require('../../utils/mailer');
const { isAuthenticated } = require('../../middlewares/auth');

const router = express.Router();

// Create or update a budget limit (using transaction for atomic operations)
router.post('/', isAuthenticated, [
    body('category').notEmpty().withMessage('Category is required'),
    body('limit').isNumeric().withMessage('Limit must be a number').custom(value => {
        if (value <= 0) {
            throw new Error('Limit must be a positive number');
        }
        return true;
    }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const session = await BudgetLimit.startSession();
    session.startTransaction();

    try {
        const { category, limit } = req.body;
        const userId = req.user._id;

        // Find existing budget limit for this category
        const existingLimit = await BudgetLimit.findOne({ user: userId, category }).session(session);
        if (existingLimit) {
            existingLimit.limit = limit;
            await existingLimit.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ message: 'Budget limit updated' });
        }

        // Create a new budget limit
        const newLimit = new BudgetLimit({ user: userId, category, limit });
        await newLimit.save({ session });
        await session.commitTransaction();

        res.status(201).json({ message: 'Budget limit created' });
    } catch (err) {
        await session.abortTransaction();
        console.error('[Budget Error]', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    } finally {
        session.endSession();
    }
});

// Get all budget limits for a user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const budgets = await BudgetLimit.find({ user: userId }).sort({ category: 1 });
        res.json(budgets);
    } catch (err) {
        console.error('[Budget Fetch Error]', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

module.exports = router;
