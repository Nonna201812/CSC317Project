const { body, param } = require('express-validator');
const express = require('express');
const router = express.Router();
const {
    createTransaction,
    updateTransaction,
    getTransactions,
    deleteTransaction,
    setLimit,
    getLimit
} = require('../controllers/transactionController');
const validate = require('../middlewares/validate');
const { isAuthenticated } = require('../middlewares/auth');

// POST a new transaction
router.post(
    '/',
    isAuthenticated,
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
        body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
        body('type').trim().notEmpty().withMessage('Type is required').isIn(['income', 'expense']).withMessage('Type must be either "income" or "expense"')
    ],
    validate,
    createTransaction
);


// POST to set budget limit
router.post(
    '/set-limit',
    isAuthenticated,
    [
        body('limit').isFloat({ gt: 0 }).withMessage('Limit must be a positive number'),
        body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters')
    ],
    validate,
    setLimit
);

// GET current budget limit for a category
router.get(
    '/limit',
    isAuthenticated,
    getLimit
);

// GET all transactions
router.get('/', isAuthenticated, getTransactions);

// DELETE a transaction by ID
router.delete(
    '/:id',
    isAuthenticated,
    [param('id').isMongoId().withMessage('Invalid transaction ID')],
    validate,
    deleteTransaction
);

// UPDATE a transaction by ID
router.put(
    '/:id',
    isAuthenticated,
    [
        param('id').isMongoId().withMessage('Invalid transaction ID'),
        body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
        body('description').optional().trim().notEmpty().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('date').optional().isISO8601().withMessage('Date must be a valid ISO8601 format').custom((value) => {
            const parsedDate = new Date(value);
            if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
                throw new Error('Date cannot be in the future');
            }
            return true;
        }),
        body('category').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
        body('type').optional().trim().notEmpty().isIn(['income', 'expense']).withMessage('Type must be either "income" or "expense"')
    ],
    validate,
    updateTransaction
);

module.exports = router;
