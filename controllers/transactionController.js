const Transaction = require('../models/Transaction');

// Get all transactions for a user
exports.getTransactions = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).send('Unauthorized');
        }

        const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
        res.render('transactions/index', { transactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
    }
};

// Get transaction for edit
exports.getTransactionForEdit = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).send('Unauthorized');
        }

        const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        res.render('transactions/edit', { transaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transaction for edit', details: err.message });
    }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).send('Unauthorized');
        }

        const { description, amount, date, category } = req.body;
        const transaction = new Transaction({
            description,
            amount: parseFloat(amount),
            date: date || new Date(),
            category,
            user: req.user._id
        });

        await transaction.save();
        res.redirect('/transactions');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create transaction', details: err.message });
    }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).send('Unauthorized');
        }

        const { description, amount, date, category } = req.body;
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { description, amount: parseFloat(amount), date, category },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        res.redirect('/transactions');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update transaction', details: err.message });
    }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).send('Unauthorized');
        }

        const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        res.redirect('/transactions');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete transaction', details: err.message });
    }
};
