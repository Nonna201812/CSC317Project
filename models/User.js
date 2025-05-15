/**
 * User model
 * Defines the schema for users in our application
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: v => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v),
      message: 'Password must include uppercase, lowercase, and a number'
    }
  }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
