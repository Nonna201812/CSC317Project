const mongoose = require('mongoose');

const BudgetLimitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    index: true
  },
  limit: {
    type: Number,
    required: [true, 'Limit is required'],
    min: [0.01, 'Limit must be a positive number']
  }
}, {
  timestamps: true
});

// Prevent duplicate budget limits per user-category pair
BudgetLimitSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('BudgetLimit', BudgetLimitSchema);
