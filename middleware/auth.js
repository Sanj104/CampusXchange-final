const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please login to continue' });
  }
  next();
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please login to continue' });
  }
  try {
    const User = require('../models/User');
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { requireAuth, redirectIfAuthenticated, requireAdmin };