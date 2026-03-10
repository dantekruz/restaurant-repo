const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String,
  quantity: { type: Number, default: 1 },
  price: Number,
  size: String,
  cookingInstructions: String
});

const orderSchema = new mongoose.Schema({
  orderNumber:      { type: Number },
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName:         String,
  userPhone:        String,
  table:            { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  tableNumber:      Number,
  items:            [orderItemSchema],
  orderType:        { type: String, enum: ['Dine In', 'Take Away'], default: 'Dine In' },
  status: {
    type: String,
    enum: ['Processing', 'Ready', 'Served', 'Out for Delivery', 'Delivered', 'Received'],
    default: 'Processing'
  },
  itemTotal:        Number,
  deliveryCharge:   { type: Number, default: 0 },
  taxes:            Number,
  grandTotal:       Number,
  address:          String,
  prepTime:         { type: Number, default: 15 },
  deliveryTime:     { type: Number, default: 12 },
  estimatedReadyAt: { type: Date }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastOrder = await mongoose.model('Order').findOne().sort({ orderNumber: -1 });
    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 100;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);