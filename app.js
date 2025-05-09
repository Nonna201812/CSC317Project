/**
 * Main application entry point
 * This file sets up our Express server, middleware, and routes
 */

// Load environment variables from .env file
require('dotenv').config();

// Core dependencies
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const transactionRoutes = require('./routes/transaction');

// Import custom middleware
const { setLocals } = require('./middlewares/locals');
const handleErrors = require('./middlewares/error-handler');

const app = express();

// Connect to MongoDB (with resilience on failure)
if (process.env.MONGODB_URI) {
  mongoose.set('autoIndex', false);
  mongoose.set('autoCreate', false);
  const mongooseOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  };

  mongoose
      .connect(process.env.MONGODB_URI, mongooseOptions)
      .then(() => console.log('MongoDB connected successfully'))
      .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Continuing without MongoDB. Some features may not work.');
      });
} else {
  console.log('No MONGODB_URI found. Continuing without database connection.');
}

// Body parsing & static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global template helpers
app.locals.helpers = {
  isActiveRoute: (path, route) => path === route,
  currentYear: () => new Date().getFullYear(),
  formatDate: date => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
};

if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native',
    touchAfter: 60,
    crypto: { secret: false },
    collectionName: 'sessions',
    stringify: false
  });
}

app.use(session(sessionConfig));

// CSRF protection disabled (temporarily)
console.log('CSRF protection is currently disabled');
app.use((req, res, next) => {
  res.locals.csrfToken = 'csrf-protection-disabled';
  next();
});

// Attach custom locals to all views
app.use(setLocals);

// Mount routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/api/transactions', transactionRoutes);

// Global error handler (must be last)
app.use(handleErrors);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});