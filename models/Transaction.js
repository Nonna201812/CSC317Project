<<<<<<< HEAD
const Transaction = require('../models/Transaction');

// CREATE a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        const saved = await transaction.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET all transactions
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE a transaction by ID
exports.deleteTransaction = async (req, res) => {
    try {
        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE a transaction by ID
exports.updateTransaction = async (req, res) => {
    try {
        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
=======
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
>>>>>>> 788a1e98b8ddacd305a83649150bb015ee39c3e2
