const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

// ADD TO CART
router.post('/add-to-cart', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    // Find the item first to get seller info
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // ✨ NEW: Check if item is already sold
    if (item.sold) {
      return res.status(400).json({ error: 'This item is already sold' });
    }

    // Find user
    const user = await User.findById(req.session.userId);
    
    // Check if item already in cart
    const itemExists = user.cart.some(cartItem => 
      cartItem.itemId.toString() === itemId
    );
    
    if (itemExists) {
      return res.status(400).json({ error: 'Item already in cart' });
    }

    // Prevent buying own items
    if (item.seller && item.seller.toString() === req.session.userId.toString()) {
      return res.status(400).json({ error: 'You cannot buy your own item' });
    }

    // Add item to cart WITH seller information
    user.cart.push({
      itemId: item._id,
      itemName: item.itemName,
      department: item.department,
      semester: item.semester,
      price: item.price,
      image: item.image,
      seller: item.seller,
      sellerEmail: item.sellerEmail,
      sellerName: item.sellerName
    });
    
    await user.save();
    res.json({ success: true, message: 'Item added to cart' });
    
  } catch (error) {
    console.error('ADD TO CART ERROR:', error);
    res.status(500).json({ error: 'Error adding to cart' });
  }
});


// VIEW CART
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const cartItems = user.cart;
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    res.render('cart', { 
      cartItems, 
      total,
      isAdmin: user.isAdmin || false
    });
  } catch (error) {
    console.error('CART ERROR:', error);
    res.status(500).send('Error loading cart');
  }
});

// REMOVE FROM CART
router.post('/remove-from-cart', requireAuth, async (req, res) => {
  try {
    const { index } = req.body;
    const user = await User.findById(req.session.userId);
    
    if (index >= 0 && index < user.cart.length) {
      user.cart.splice(parseInt(index), 1);
      await user.save();
    }
    
    res.redirect('/cart');
  } catch (error) {
    console.error('REMOVE FROM CART ERROR:', error);
    res.status(500).send('Error removing item');
  }
});


// CHECKOUT - FIXED FOR EMAILJS
router.get('/checkout', requireAuth, async (req, res) => {
  try {
    console.log('=== CHECKOUT START ===');
    
    const user = await User.findById(req.session.userId);
    console.log('User cart length:', user.cart.length);
    
    if (user.cart.length === 0) {
      console.log('Cart empty, redirecting...');
      return res.redirect('/cart');
    }

    const totalPrice = user.cart.reduce((sum, item) => sum + item.price, 0);
    console.log('Total price:', totalPrice);

    // Fetch complete item details including seller info
    const itemsWithDetails = await Promise.all(
      user.cart.map(async (cartItem) => {
        const item = await Item.findById(cartItem.itemId);
        return {
          itemId: cartItem.itemId,
          itemName: cartItem.itemName,
          department: cartItem.department,
          semester: cartItem.semester,
          price: cartItem.price,
          sellerEmail: item ? item.sellerEmail : (cartItem.sellerEmail || ''),
          sellerName: item ? item.sellerName : (cartItem.sellerName || 'Unknown')
        };
      })
    );

    console.log('Items with seller details:', itemsWithDetails);

    // Create order
    const order = new Order({
      buyer: user._id,
      buyerEmail: user.email,
      buyerName: user.name,
      items: itemsWithDetails,
      totalPrice
    });

    await order.save();
    console.log('Order saved:', order._id);

    // ✨ Mark items as sold instead of deleting them
    const itemIds = itemsWithDetails.map(item => item.itemId);
    await Item.updateMany(
      { _id: { $in: itemIds } },
      { 
        $set: { 
          sold: true,
          soldDate: new Date()
        } 
      }
    );
    console.log('✅ Items marked as sold');

    // Prepare seller data for EmailJS
    const sellerData = itemsWithDetails.map(item => ({
      sellerEmail: item.sellerEmail,
      sellerName: item.sellerName,
      itemName: item.itemName,
      price: item.price,
      buyerName: user.name,
      buyerEmail: user.email
    }));

    console.log('Seller data for EmailJS:', sellerData);

    // Clear cart
    user.cart = [];
    await user.save();
    console.log('Cart cleared');

    // Render checkout page with all necessary data
    res.render('checkout', {
      order: order,
      sellerDataJSON: JSON.stringify(sellerData)
    });

    console.log('=== CHECKOUT END ===');
    
  } catch (error) {
    console.error('CHECKOUT ERROR:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send('Error processing checkout');
  }
});

module.exports = router;