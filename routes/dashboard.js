const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const moment = require('moment');

// @GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const monthStart = moment().startOf('month').toDate();

    const [
      totalCustomers,
      todayBills,
      monthBills,
      pendingBills,
      lowStockProducts,
      recentBills
    ] = await Promise.all([
      Customer.countDocuments(),
      Bill.find({ billDate: { $gte: today, $lte: todayEnd } }),
      Bill.find({ billDate: { $gte: monthStart } }),
      Bill.find({ status: { $in: ['pending', 'partial'] } }).countDocuments(),
      Product.find({ isActive: true, $expr: { $lte: ['$stockQty', '$minAlertQty'] } }),
      Bill.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'name phone')
    ]);

    const todaySales = todayBills.reduce((sum, b) => sum + b.advancePaid, 0);
    const monthRevenue = monthBills.reduce((sum, b) => sum + b.total, 0);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        pendingOrders: pendingBills,
        todaySales,
        monthRevenue,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentBills
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;