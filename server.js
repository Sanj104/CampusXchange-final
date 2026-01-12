const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const dbconnect = require('./config/db');
const adminRoutes = require('./routes/admin');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const cartRoutes = require('./routes/cart');
const ratingRoutes = require('./routes/rating');


const app = express();

// MongoDB Connection
// MongoDB Connection (FIXED)
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusxchange')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'campusxchange-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(async (req, res, next) => {
  res.locals.user = req.session.userId || null;
  if (req.session.userId) {
    try {
      const User = require('./models/User');
      const user = await User.findById(req.session.userId);
      res.locals.isAdmin = user && user.role === 'admin';
    } catch (error) {
      res.locals.isAdmin = false;
    }
  } else {
    res.locals.isAdmin = false;
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/', cartRoutes);
app.use('/admin', adminRoutes);
app.use('/rating', ratingRoutes);


// Home route
app.get('/', (req, res) => {
  res.render('index');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
module.exports = app;