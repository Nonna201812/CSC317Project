/**
 * User Controller
 * Handles logic for user-related pages and actions
 */
const User = require('../models/User');

// Helper to provide consistent locals for settings view
const baseSettingsLocals = (req, overrides = {}) => ({
  title: 'Settings',
  user: req.session.user,
  csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : '',
  errors: [],
  flashMessage: null,
  ...overrides
});

/**
 * Display user profile page
 */
exports.getProfile = (req, res) => {
  res.render('user/profile', {
    title: 'Profile',
    user: req.session.user
  });
};

/**
 * Display user settings page
 */
exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('user/settings', baseSettingsLocals(req, { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user settings
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const newUsername = req.body.username?.trim();
    if (newUsername && newUsername !== user.username) {
      const existing = await User.findOne({ username: newUsername });
      if (existing && existing._id.toString() !== userId) {
        return res.status(400).render(
            'user/settings',
            baseSettingsLocals(req, {
              user: req.session.user,
              errors: [{ msg: 'Username is already taken' }]
            })
        );
      }
      user.username = newUsername;
      req.session.user.username = newUsername;
    }

    await user.save();
    res.render(
        'user/settings',
        baseSettingsLocals(req, {
          user: req.session.user,
          flashMessage: { type: 'success', text: 'Settings updated successfully' }
        })
    );
  } catch (error) {
    next(error);
  }
};
