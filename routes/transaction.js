const { body, param } = require('express-validator');
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const validate = require('../middlewares/validate');

// POST a new transaction
router.post(
    '/',
    [
        body('description').notEmpty().withMessage('Description is required'),
        body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
        body('date').isISO8601().withMessage('Date must be valid'),
    ],
    validate,
    transactionController.createTransaction
);

// POST to set budget limit (keep your original endpoint)
router.post(
    '/set-limit',
    [
        body('limit').isFloat({ gt: 0 }).withMessage('Limit must be a positive number'),
        body('category').notEmpty().withMessage('Category is required')
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
        body('amount').optional().isFloat({ gt: 0 }),
        body('description').optional().notEmpty(),
        body('date').optional().isISO8601(),
        body('category').optional().trim().notEmpty()
    ],
    validate,
    transactionController.updateTransaction
);

module.exports = router;
