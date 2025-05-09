<<<<<<< HEAD
const { body, param } = require('express-validator');
=======
const { body , param } = require('express-validator');
>>>>>>> 788a1e98b8ddacd305a83649150bb015ee39c3e2
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
<<<<<<< HEAD
    transactionController.createTransaction
);

// POST to set budget limit (keep your original endpoint)
router.post(
    '/set-limit',
    [
        body('limit').isFloat({ gt: 0 }).withMessage('Limit must be a positive number')
    ],
    validate,
    transactionController.setLimit
);
=======
    transactionController.createTransaction);
>>>>>>> 788a1e98b8ddacd305a83649150bb015ee39c3e2

// GET all transactions
router.get('/', transactionController.getTransactions);

// DELETE a transaction by ID
router.delete(
    '/:id',
<<<<<<< HEAD
    [param('id').isMongoId().withMessage('Invalid transaction ID')],
    validate,
    transactionController.deleteTransaction
);
=======
        [ param('id').isMongoId().withMessage('Invalid transaction ID') ],
        validate,
    transactionController.deleteTransaction);
>>>>>>> 788a1e98b8ddacd305a83649150bb015ee39c3e2

// UPDATE a transaction by ID
router.put(
    '/:id',
    [
<<<<<<< HEAD
        param('id').isMongoId().withMessage('Invalid transaction ID'),
=======
        param('id')
            .isMongoId().withMessage('Invalid transaction ID'),
>>>>>>> 788a1e98b8ddacd305a83649150bb015ee39c3e2
        body('amount').optional().isFloat({ gt: 0 }),
        body('description').optional().notEmpty(),
        body('date').optional().isISO8601(),
        body('category').optional().trim().notEmpty()
    ],
    validate,
<<<<<<< HEAD
    transactionController.updateTransaction
);

module.exports = router;

=======
    transactionController.updateTransaction);

module.exports = router;
>>>>>>> 788a1e98b8ddacd305a83649150bb015ee39c3e2
