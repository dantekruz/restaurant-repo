const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { adminAuth } = require('../middleware/auth');

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create table (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { tableNumber, name, chairs } = req.body;
    const table = await Table.create({ tableNumber, name, chairs });
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update table status (admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete table (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
