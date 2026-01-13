const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '/uploads/default-item.jpg' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerEmail: { type: String, required: true },
  sellerName: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  sold: { type: Boolean, default: false }, // ✨ NEW: Track if item is sold
  soldDate: { type: Date }, // ✨ NEW: Track when it was sold
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);