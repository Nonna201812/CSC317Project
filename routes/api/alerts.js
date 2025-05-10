// Required Dependencies
const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const sendBudgetAlert = require('../utils/mailer');

const router = express.Router();

// Grouped Routes for Alerts
const setupAlertRoutes = (app) => {
    // Send a manual budget alert (for testing purposes)
    app.post('/api/alerts', [
        body('category').notEmpty().withMessage('Category is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
    ], async (req, res) => {
        // Validate request before database operations
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            // Check if the user is authenticated
            if (!req.user || !req.user._id) {
                return res.status(401).json({ error: 'Unauthorized access' });
            }

            const { category, amount } = req.body;
            // Send a manual alert without checking the limit (for testing)
            await sendBudgetAlert(req.user._id, category, amount, 0);
            res.status(200).json({ message: 'Budget alert sent' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });
};

module.exports = setupAlertRoutes;
