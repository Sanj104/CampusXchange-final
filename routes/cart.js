const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');


router.post('/add-to-cart', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const user = await User.findById(req.session.userId);
    const itemExists = user.cart.some(cartItem => 
      cartItem.itemId.toString() === itemId
    );
    if (itemExists) {
      return res.status(400).json({ error: 'Item already in cart' });
    }
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    user.cart.push({
      itemId: item._id,
      itemName: item.itemName,
      department: item.department,
      semester: item.semester,
      price: item.price,
      image: item.image
    });
    await user.save();
    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding to cart' });
  }
});

router.get('/cart', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const cartItems = user.cart;
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    res.render('cart', { cartItems, total });
  } catch (error) {
    res.status(500).send('Error loading cart');
  }
});

router.post('/remove-from-cart', requireAuth, async (req, res) => {
  try {
    const { index } = req.body;
    const user = await User.findById(req.session.userId);
    if (index >= 0 && index < user.cart.length) {
      user.cart.splice(index, 1);
      await user.save();
    }
    res.redirect('/cart');
  } catch (error) {
    res.status(500).send('Error removing item');
  }
});

router.get('/checkout', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.cart.length === 0) {
      return res.redirect('/cart');
    }
    const totalPrice = user.cart.reduce((sum, item) => sum + item.price, 0);
    const itemsWithDetails = await Promise.all(
      user.cart.map(async (cartItem) => {
        const item = await Item.findById(cartItem.itemId);
        return {
          itemId: cartItem.itemId,
          itemName: cartItem.itemName,
          department: cartItem.department,
          semester: cartItem.semester,
          price: cartItem.price,
          sellerEmail: item ? item.sellerEmail : '',
          sellerName: item ? item.sellerName : ''
        };
      })
    );
    const order = new Order({
      buyer: user._id,
      buyerEmail: user.email,
      buyerName: user.name,
      items: itemsWithDetails,
      totalPrice
    });
    await order.save();
    user.cart = [];
    await user.save();
    res.render('checkout', { order });
  } catch (error) {
    res.status(500).send('Error processing checkout');
  }
});




module.exports = router;