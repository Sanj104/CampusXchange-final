const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// GET all items (only unsold)
// GET all items (only unsold)
// GET all items (show both sold and unsold)
router.get('/', async (req, res) => {
  try {
    const sortBy = req.query.sort;
    
    let sortOption = { createdAt: -1 };
    if (sortBy === 'likes') sortOption = { likesCount: -1 };
    else if (sortBy === 'price-low') sortOption = { price: 1 };
    else if (sortBy === 'price-high') sortOption = { price: -1 };
    
    // ✨ Show ALL items (both sold and unsold)
    const items = await Item.find().sort(sortOption);
    
    console.log('📦 Total items:', items.length);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching items' });
  }
});

// Filter items (show both sold and unsold)
router.get('/filter', async (req, res) => {
  try {
    const { department, semester, sort } = req.query;
    
    // ✨ Don't filter by sold status
    let query = {};
    if (department) query.department = department;
    if (semester) query.semester = semester;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'likes') sortOption = { likesCount: -1 };
    else if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    
    const items = await Item.find(query).sort(sortOption);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error filtering items' });
  }
});
// Filter items (only unsold, with sorting support)
router.get('/filter', async (req, res) => {
  try {
    const { department, semester, sort } = req.query;
    
    // ✨ Always filter out sold items
    let query = { sold: false };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    
    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'likes') sortOption = { likesCount: -1 };
    else if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    
    const items = await Item.find(query).sort(sortOption);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error filtering items' });
  }
});

// ✨ GET route to display the add item form
router.get('/add', requireAuth, (req, res) => {
  res.render('add-item');
});

// POST route to submit the add item form
router.post('/add', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { itemName, department, semester, price } = req.body;
    const user = await User.findById(req.session.userId);
    const item = new Item({
      itemName,
      department,
      semester,
      price: parseFloat(price),
      image: req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder.jpg',
      seller: user._id,
      sellerEmail: user.email,
      sellerName: user.name,
      sold: false // ✨ NEW: Set sold to false by default
    });
    await item.save();
    res.json({ success: true, message: 'Item added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding item' });
  }
});

// 🔍 SEARCH ITEMS
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i'); // case-insensitive

    const items = await Item.find({
      sold: false,
      $or: [
        { itemName: regex },
        { department: regex },
        { semester: regex },
        { sellerName: regex }
      ]
    }).sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});


module.exports = router;