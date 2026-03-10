const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  name: { type: String },
  chairs: { type: Number, default: 3 },
  status: { type: String, enum: ['available', 'reserved', 'occupied'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
