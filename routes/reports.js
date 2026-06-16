const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const moment = require('moment');

// @GET /api/reports/daily
router.get('/daily', protect, adminOnly, async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = moment(date).startOf('day').toDate();
    const end = moment(date).endOf('day').toDate();
    
    const bills = await Bill.find({ billDate: { $gte: start, $lte: end } });
    const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
    const totalCollected = bills.reduce((sum, b) => sum + b.advancePaid, 0);
    const totalPending = bills.reduce((sum, b) => sum + b.remaining, 0);
    
    res.json({
      success: true,
      report: {
        date: moment(date).format('DD MMM YYYY'),
        billsCount: bills.length,
        totalRevenue,
        totalCollected,
        totalPending,
        bills
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/reports/monthly
router.get('/monthly', protect, adminOnly, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const results = [];
    
    for (let month = 0; month < 12; month++) {
      const start = moment({ year, month }).startOf('month').toDate();
      const end = moment({ year, month }).endOf('month').toDate();
      const bills = await Bill.find({ billDate: { $gte: start, $lte: end } });
      results.push({
        month: moment({ year, month }).format('MMM YYYY'),
        billsCount: bills.length,
        revenue: bills.reduce((sum, b) => sum + b.total, 0),
        collected: bills.reduce((sum, b) => sum + b.advancePaid, 0),
        pending: bills.reduce((sum, b) => sum + b.remaining, 0)
      });
    }
    
    res.json({ success: true, year, report: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/reports/range?startDate=&endDate=
router.get('/range', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = moment(startDate).startOf('day').toDate();
    const end = moment(endDate).endOf('day').toDate();
    
    const bills = await Bill.find({ billDate: { $gte: start, $lte: end } })
      .populate('customer', 'name phone');
    
    res.json({
      success: true,
      report: {
        startDate: moment(start).format('DD MMM YYYY'),
        endDate: moment(end).format('DD MMM YYYY'),
        billsCount: bills.length,
        totalRevenue: bills.reduce((sum, b) => sum + b.total, 0),
        totalCollected: bills.reduce((sum, b) => sum + b.advancePaid, 0),
        totalPending: bills.reduce((sum, b) => sum + b.remaining, 0),
        bills
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/reports/pending
router.get('/pending', protect, adminOnly, async (req, res) => {
  try {
    const bills = await Bill.find({ status: { $in: ['pending', 'partial'] } })
      .populate('customer', 'name phone city')
      .sort({ billDate: -1 });
    
    const totalPending = bills.reduce((sum, b) => sum + b.remaining, 0);
    res.json({ success: true, bills, totalPending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/reports/products
router.get('/products', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter(p => p.stockQty <= p.minAlertQty);
    
    // Get product sales from bills
    const bills = await Bill.find({});
    const productSales = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        if (item.itemType === 'product' && item.productId) {
          const id = item.productId.toString();
          if (!productSales[id]) productSales[id] = { quantity: 0, revenue: 0 };
          productSales[id].quantity += item.quantity;
          productSales[id].revenue += item.total;
        }
      });
    });
    
    res.json({ success: true, products, lowStock, productSales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;