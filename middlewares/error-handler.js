module.exports = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const msg    = err.message || 'Something went wrong';

  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(status).json({ success: false, message: msg });
  }

  res.status(status).render('error', {
    title: 'Error',
    message: msg,
    error: process.env.NODE_ENV === 'development' ? err : {},
    path: req.path
  });
};
