const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [3, 'Description must be at least 3 characters'],
        maxlength: [255, 'Description cannot exceed 255 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be a positive number'],
        validate: {
            validator: (value) => !isNaN(value) && isFinite(value),
            message: 'Amount must be a valid number'
        }
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: () => new Date()
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        minlength: [2, 'Category must be at least 2 characters'],
        maxlength: [50, 'Category cannot exceed 50 characters']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for better performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

// Custom method for formatted amount
transactionSchema.methods.formatAmount = function () {
    return `$${this.amount.toFixed(2)}`;
};

module.exports = mongoose.model('Transaction', transactionSchema);
