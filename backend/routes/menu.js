const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MenuItem = require('../models/MenuItem');
const { adminAuth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get all menu items (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category, available: true } : { available: true };
    const items = await MenuItem.find(filter);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add menu item (admin)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, avgPrepTime } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const item = await MenuItem.create({ name, description, price: Number(price), category, image, avgPrepTime: Number(avgPrepTime) });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update menu item (admin)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete menu item (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
