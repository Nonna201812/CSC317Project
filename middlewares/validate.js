// routes/transaction.js

const express    = require('express');
const { body, param } = require('express-validator');
const txController     = require('../controllers/transactionController');
const validate         = require('../middlewares/validate');  // <-- updated
const router           = express.Router();

// Create a new transaction
router.post(
  '/',
  txController.checkAuth,
  [
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('amount')
      .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('date')
      .isISO8601().withMessage('Date must be valid')
      .custom(v => {
        const d = new Date(v);
        if (isNaN(d.getTime()) || d > new Date()) {
          throw new Error('Date cannot be in the future');
        }
        return true;
      }),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
    body('type')
      .trim()
      .notEmpty().withMessage('Type is required')
      .isIn(['income', 'expense']).withMessage('Type must be either "income" or "expense"')
  ],
  validate,
  txController.createTransaction
);

// Set or update budget limit
router.post(
  '/limit',
  txController.checkAuth,
  [
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
    body('limit')
      .isFloat({ gt: 0 }).withMessage('Limit must be a positive number')
  ],
  validate,
  txController.setLimit
);

// Get all transactions
router.get(
  '/',
  txController.checkAuth,
  txController.getTransactions
);

// Get a single transaction by ID
router.get(
  '/:id',
  txController.checkAuth,
  [ param('id').isMongoId().withMessage('Invalid transaction ID') ],
  validate,
  txController.getTransactionById   // matches controller export
);

// Update a transaction by ID
router.put(
  '/:id',
  txController.checkAuth,
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('date').optional()
      .isISO8601().withMessage('Date must be valid')
      .custom(v => {
        const d = new Date(v);
        if (isNaN(d.getTime()) || d > new Date()) {
          throw new Error('Date cannot be in the future');
        }
        return true;
      }),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
    body('type').optional().trim().isIn(['income', 'expense']).withMessage('Type must be either "income" or "expense"')
  ],
  validate,
  txController.updateTransaction
);

// Delete a transaction by ID
router.delete(
  '/:id',
  txController.checkAuth,
  [ param('id').isMongoId().withMessage('Invalid transaction ID') ],
  validate,
  txController.deleteTransaction
);

module.exports = router;
