const { body, param } = require('express-validator');
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const validate = require('../middlewares/validate');

// POST a new transaction
router.post(
    '/',
    [
        body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
        body('date').isISO8601().withMessage('Date must be a valid ISO8601 format').custom((value) => {
            const parsedDate = new Date(value);
            if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                throw new Error('Date cannot be in the future');
            }
            return true;
        }),
        body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters')
    ],
    validate,
    transactionController.createTransaction
);

// POST to set budget limit
router.post(
    '/set-limit',
    [
        body('limit').isFloat({ gt: 0.01 }).withMessage('Limit must be a positive number greater than 0.01'),
        body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters')
    ],
    validate,
    transactionController.setLimit
);

// GET all transactions
router.get('/', transactionController.getTransactions);

// DELETE a transaction by ID
router.delete(
    '/:id',
    [param('id').isMongoId().withMessage('Invalid transaction ID')],
    validate,
    transactionController.deleteTransaction
);

// UPDATE a transaction by ID
router.put(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid transaction ID'),
        body('amount').optional().isFloat({ gt: 0.01 }).withMessage('Amount must be a positive number greater than 0.01'),
        body('description').optional().trim().notEmpty().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('date').optional().isISO8601().withMessage('Date must be a valid ISO8601 format').custom((value) => {
            const parsedDate = new Date(value);
            if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                throw new Error('Date cannot be in the future');
            }
            return true;
        }),
        body('category').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters')
    ],
    validate,
    transactionController.updateTransaction
);

module.exports = router;
