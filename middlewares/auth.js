/**
 * Authentication middleware
 * Provides functions to protect routes that require authentication
 */

exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.userId = req.session.user.id;
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

exports.isNotAuthenticated = (req, res, next) => {
  return req.session.user ? res.redirect('/user/profile') : next();
};
