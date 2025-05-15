const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.headers.accept?.includes('json')) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Assume HTML form error
    return res.status(400).render('error', {
      title: 'Validation Error',
      errors: errors.array(),
      formData: req.body,
      csrfToken: req.csrfToken()
    });
  }
  next();
};
