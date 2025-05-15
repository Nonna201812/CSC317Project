/****
 * Locals middleware
 * Sets variables that will be available in all views
 */

exports.setLocals = (req, res, next) => {
  res.locals.user            = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.path            = req.path;
  res.locals.flashMessage    = req.session.flashMessage || null;
  delete req.session.flashMessage;
  next();
};
