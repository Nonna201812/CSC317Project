const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// POST a new transaction
router.post('/', transactionController.createTransaction);

// GET all transactions
router.get('/', transactionController.getTransactions);

// DELETE a transaction by ID
router.delete('/:id', transactionController.deleteTransaction);

// UPDATE a transaction by ID
router.put('/:id', transactionController.updateTransaction);

module.exports = router;
