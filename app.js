require('dotenv').config();
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
const budgetRoutes = require('./routes/budget');

// Import custom middleware
const { setLocals } = require('./middlewares/locals');
const handleErrors = require('./middlewares/error-handler');

// Initialize Express
const app = express();

// Connect to MongoDB
async function connectDB(uri) {
  if (!uri) {
    console.warn('No MongoDB URI found—skipping DB connect');
    return;
  }
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('🔗 MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connect error:', err);
  }
}
connectDB(process.env.MONGODB_URI);

// Body parsing & static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration (secure)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
};

// Attach MongoDB-backed session store (if available)
if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native',
    touchAfter: 60,
    collectionName: 'sessions_clean'
  });
}

// Initialize session middleware
app.use(session(sessionConfig));

// Attach custom locals to all views
app.use(setLocals);

// Mount routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/', budgetRoutes);

// Global error handler (must be last)
app.use(handleErrors);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


