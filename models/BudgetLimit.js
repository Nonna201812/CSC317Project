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
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
    index: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0.01
  }
}, { timestamps: true });

BudgetLimitSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('BudgetLimit', BudgetLimitSchema);
