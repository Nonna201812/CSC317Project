/**
 * User Controller
 * Handles logic for user-related pages and actions
 */
const User = require('../models/User');

// Helper to provide consistent locals for settings view
const baseSettingsLocals = (req, overrides = {}) => ({
  title: 'Settings',
  user: req.session.user,
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
    // Sync session username
    req.session.user.username = user.username;
    // Pull flash message from session if set
    const flashMessage = req.session.flashMessage;
    delete req.session.flashMessage;
    res.render('user/settings', baseSettingsLocals(req, { user, flashMessage }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user settings
 * Uses POST-Redirect-Get to avoid form resubmission
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    const { username } = req.body;
    const newUsername = username?.trim();
    if (newUsername && newUsername !== user.username) {
      if (newUsername.length > 20) {
        return res.status(400).render(
            'user/settings',
            baseSettingsLocals(req, {
              user,
              errors: [{ msg: 'Username cannot exceed 20 characters' }]
            })
        );
      }
      const existing = await User.findOne({ username: newUsername });
      if (existing && existing._id.toString() !== userId) {
        return res.status(400).render(
            'user/settings',
            baseSettingsLocals(req, {
              user,
              errors: [{ msg: 'Username is already taken' }]
            })
        );
      }
      user.username = newUsername;
      req.session.user.username = newUsername;
    }

    await user.save();
    // Set flash and redirect to GET for PRG pattern
    req.session.flashMessage = { type: 'success', text: 'Settings updated successfully' };
    return res.redirect('/user/settings');
  } catch (error) {
    return next(error);
  }
};
