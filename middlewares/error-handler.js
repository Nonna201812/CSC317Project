module.exports = (err, req, res,next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  // JSON for API/AJAX
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }

  // EJS render for normal pages
  return res.status(statusCode).render('error', {
    title: 'Error',
    message,
    error: process.env.NODE_ENV === 'development' ? err : {},
    path: req.path || '/',
    isAuthenticated: !!req.session?.user,
    helpers: {
      isActiveRoute: (path, route) => path === route,
      currentYear: () => new Date().getFullYear(),
      formatDate: date => date ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) : ''
    }
  });
};
