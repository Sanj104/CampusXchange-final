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

router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching items' });
  }
});

router.get('/filter', async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department && department !== '') {
      filter.department = department;
    }
    if (semester && semester !== '') {
      filter.semester = semester;
    }
    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error filtering items' });
  }
});

router.get('/add', requireAuth, (req, res) => {
  res.render('add-item');
});

router.post('/add', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { itemName, department, semester, price } = req.body;
    const user = await User.findById(req.session.userId);
    const item = new Item({
      itemName,
      department,
      semester,
      price: parseFloat(price),
      image: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-item.jpg',
      seller: user._id,
      sellerEmail: user.email,
      sellerName: user.name
    });
    await item.save();
    res.json({ success: true, message: 'Item added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding item' });
  }
});

module.exports = router;