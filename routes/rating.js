const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { requireAuth } = require('../middleware/auth');

// Like/Unlike an item
router.post('/like/:itemId', requireAuth, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.userId;

    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user already liked this item
    const alreadyLiked = item.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike: Remove user from likes array
      item.likes = item.likes.filter(id => id.toString() !== userId.toString());
      item.likesCount = item.likes.length;
      await item.save();
      
      return res.json({ 
        success: true, 
        liked: false, 
        likesCount: item.likesCount,
        message: 'Item unliked' 
      });
    } else {
      // Like: Add user to likes array
      item.likes.push(userId);
      item.likesCount = item.likes.length;
      await item.save();
      
      return res.json({ 
        success: true, 
        liked: true, 
        likesCount: item.likesCount,
        message: 'Item liked' 
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Error processing like' });
  }
});

// Check if user liked an item
router.get('/check-like/:itemId', requireAuth, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.userId;

    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const liked = item.likes.includes(userId);
    
    res.json({ 
      liked, 
      likesCount: item.likesCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking like status' });
  }
});

module.exports = router;