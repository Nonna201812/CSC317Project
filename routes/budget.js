/**
 * Budget routes
 * Handles the main budget planner page
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

// GET /budget - Budget planner page
router.get('/budget', isAuthenticated, (req, res) => {
    res.render('budget', {
        title: 'Budget Planner',
        user: req.session.user,
        isAuthenticated: !!req.session.user
    });
});
router.post('/budget', isAuthenticated, setLimit); //remove this line if it causes issues
module.exports = router;
