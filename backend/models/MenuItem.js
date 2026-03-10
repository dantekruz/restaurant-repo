const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true, enum: ['Burger', 'Pizza', 'Drink', 'French fries', 'Veggies'] },
  image: { type: String },
  avgPrepTime: { type: Number, default: 15 },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
