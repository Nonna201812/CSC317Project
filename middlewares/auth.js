/**
 * Authentication middleware
 * Provides functions to protect routes that require authentication
 */

// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  // Check if user session exists
  if (req.session && req.session.user && req.session.user._id) {
    console.log(`[AUTH] Authenticated user: ${req.session.user._id}`);
    return next();
  }

  // Store the intended URL for redirection after login
  if (req.session) {
    req.session.returnTo = req.originalUrl;
    console.log(`[AUTH] Redirecting unauthenticated user to login from ${req.originalUrl}`);
  }

  res.redirect('/auth/login');
};

// Middleware to check if user is NOT authenticated
// Used for routes like login/register that should be inaccessible to logged-in users
exports.isNotAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user || !req.session.user._id) {
    console.log('[AUTH] User is not authenticated, allowing access to public route');
    return next();
  }

  console.log(`[AUTH] Authenticated user ${req.session.user._id} tried to access public route, redirecting to profile`);
  res.redirect('/user/profile');
};
