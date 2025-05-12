const Transaction = require('../models/Transaction');
const BudgetLimit = require('../models/BudgetLimit');
const nodemailer = require('nodemailer');
const User = require('../models/User'); 

// CREATE a new transaction
exports.createTransaction = async (req, res, next) => {
    try {
        const data = {
        ...req.body,
        user: req.session.user.id
    };
        const transaction = new Transaction(data);
        const saved = await transaction.save();
        res.status(201).json(saved);
    } catch (err) {
        next(err);
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
//SET or UPDATE a budget limit for a user and category
exports.setLimit = async (req, res) => {
  try {
    const { category, limit } = req.body;

    const data = {
      user: req.session.user.id,
      category,
      limit
    };

    let existing = await BudgetLimit.findOne({ user: data.user, category: data.category });

    let saved;
    if (existing) {
      existing.limit = limit;
      saved = await existing.save();
    } else {
      const newLimit = new BudgetLimit(data);
      saved = await newLimit.save();
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
