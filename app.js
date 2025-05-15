// app.js
require('dotenv').config();

const express    = require('express');
const path       = require('path');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose   = require('mongoose');
const csurf      = require('csurf');

// Route imports
const indexRoutes       = require('./routes/index');
const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/user');
const transactionRoutes = require('./routes/transaction');  // singular filename
const budgetRoutes      = require('./routes/budget');

// Middleware imports
const { setLocals }  = require('./middlewares/locals');
const handleErrors   = require('./middlewares/error-handler');

const app = express();

// Connect to MongoDB
async function connectDB(uri) {
  if (!uri) {
    console.warn('No MONGODB_URI—skipping DB connect');
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
    process.exit(1);
  }
}
connectDB(process.env.MONGODB_URI);

// Static files & parsers
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is required');
  process.exit(1);
}
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI
    ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
    : undefined,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
};
app.use(session(sessionConfig));

// CSRF protection
app.use(csurf());

// Expose session + flash + user to all views
app.use(setLocals);

// Mount routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/budget', budgetRoutes);

// Global error handler
app.use(handleErrors);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
