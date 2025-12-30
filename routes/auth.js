const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const redirectIfAuthenticated = authMiddleware.redirectIfAuthenticated;


console.log('redirectIfAuthenticated =', redirectIfAuthenticated);


router.get('/signup', redirectIfAuthenticated, (req, res) => {
  res.render('signup');
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password
    });

    await user.save();

    req.session.userId = user._id;
    res.json({ success: true });

  } catch (error) {
  console.error('SIGNUP ERROR:', error);
  res.status(500).json({ error: error.message });
}

});


router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user._id;
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ success: true });
  });
});

router.get('/status', (req, res) => {
  res.json({ authenticated: !!req.session.userId });
});

module.exports = router;