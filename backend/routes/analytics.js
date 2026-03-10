const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const { adminAuth } = require('../middleware/auth');

router.get('/', adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalClients = await User.countDocuments({ role: 'user' });
    const totalTables = await Table.countDocuments();
    const revenueData = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Orders by type
    const dineIn = await Order.countDocuments({ orderType: 'Dine In' });
    const takeAway = await Order.countDocuments({ orderType: 'Take Away' });
    const served = await Order.countDocuments({ status: 'Served' });

    // Weekly revenue
    const weeklyRevenue = await Order.aggregate([
      { $group: { _id: { $dayOfWeek: '$createdAt' }, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    // Table statuses
    const tables = await Table.find().sort({ tableNumber: 1 });

    res.json({ totalOrders, totalClients, totalTables, totalRevenue, dineIn, takeAway, served, weeklyRevenue, tables });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
