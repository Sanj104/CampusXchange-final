const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { requireAdmin } = require('../middleware/auth');

// Admin Dashboard Page
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const stats = {
      totalUsers,
      totalItems,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    };

    res.render('admin/dashboard', { stats, user: req.user });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

// Manage Users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { users, user: req.user });
  } catch (error) {
    res.status(500).send('Error loading users');
  }
});

// Delete User
router.post('/users/delete/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (userId === req.session.userId.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user's items
    await Item.deleteMany({ seller: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
});

// Make User Admin
router.post('/users/make-admin/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: 'admin' });
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).send('Error updating user');
  }
});

// Remove Admin Rights
router.post('/users/remove-admin/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from removing their own admin rights
    if (userId === req.session.userId.toString()) {
      return res.status(400).json({ error: 'Cannot remove your own admin rights' });
    }

    await User.findByIdAndUpdate(userId, { role: 'user' });
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).send('Error updating user');
  }
});

// Manage Items
router.get('/items', requireAdmin, async (req, res) => {
  try {
    const items = await Item.find().populate('seller', 'name email').sort({ createdAt: -1 });
    res.render('admin/items', { items, user: req.user });
  } catch (error) {
    res.status(500).send('Error loading items');
  }
});

// Delete Item
router.post('/items/delete/:id', requireAdmin, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.redirect('/admin/items');
  } catch (error) {
    res.status(500).send('Error deleting item');
  }
});

// Manage Orders
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });
    res.render('admin/orders', { orders, user: req.user });
  } catch (error) {
    res.status(500).send('Error loading orders');
  }
});

// View Order Details
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer', 'name email');
    res.render('admin/order-details', { order, user: req.user });
  } catch (error) {
    res.status(500).send('Error loading order');
  }
});

// Delete Order
router.post('/orders/delete/:id', requireAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect('/admin/orders');
  } catch (error) {
    res.status(500).send('Error deleting order');
  }
});

module.exports = router;