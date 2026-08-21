const express = require('express');
const router = express.Router();
const moment = require('moment');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// ── Shared helper: profit/revenue/units breakdown for a set of quick-sale bills ──
function summarize(bills) {
  let revenue = 0, profit = 0, loss = 0, unitsSold = 0;
  const productWise = {}; // productId -> { name, qty, revenue, profit }
  const paymentWise = {}; // method -> { count, revenue }

  for (const bill of bills) {
    const method = bill.paymentType || 'Other';
    if (!paymentWise[method]) paymentWise[method] = { count: 0, revenue: 0 };
    paymentWise[method].count += 1;

    let billRevenue = 0;

    // ── Profit/loss computed per line item (not per bill), net of any returns ──
    // ── already recorded against that item — a bill can mix a profitable item ──
    // ── with one sold at a loss, and a partial return should reduce both. ──
    for (const item of bill.items) {
      if (item.itemType !== 'product') continue;
      const effectiveQty = item.quantity - (item.returnedQty || 0);
      if (effectiveQty <= 0) continue;

      const effectiveTotal = item.price * effectiveQty;
      const itemProfit = effectiveTotal - (item.purchasePrice || 0) * effectiveQty;

      unitsSold += effectiveQty;
      billRevenue += effectiveTotal;
      if (itemProfit >= 0) profit += itemProfit;
      else loss += Math.abs(itemProfit);

      const id = item.productId ? item.productId.toString() : item.description;
      if (!productWise[id]) productWise[id] = { name: item.description, qty: 0, revenue: 0, profit: 0 };
      productWise[id].qty += effectiveQty;
      productWise[id].revenue += effectiveTotal;
      productWise[id].profit += itemProfit;
    }

    revenue += billRevenue;
    paymentWise[method].revenue += billRevenue;
  }

  return {
    revenue,
    profit,
    loss,
    unitsSold,
    billsCount: bills.length,
    productWise: Object.entries(productWise).map(([productId, v]) => ({ productId, ...v })),
    paymentWise: Object.entries(paymentWise).map(([method, v]) => ({ method, ...v })),
  };
}

// @GET /api/quicksale/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const weekStart = moment().subtract(6, 'days').startOf('day').toDate();
    const monthStart = moment().startOf('month').toDate();

    const [todayBills, weekBills, monthBills, allBills, products, recentSales] = await Promise.all([
      Bill.find({ isQuickSale: true, billDate: { $gte: todayStart, $lte: todayEnd } }),
      Bill.find({ isQuickSale: true, billDate: { $gte: weekStart } }),
      Bill.find({ isQuickSale: true, billDate: { $gte: monthStart } }),
      Bill.find({ isQuickSale: true }),
      Product.find({ isActive: true }),
      Bill.find({ isQuickSale: true }).sort({ createdAt: -1 }).limit(8),
    ]);

    const today = summarize(todayBills);
    const week = summarize(weekBills);
    const month = summarize(monthBills);
    const all = summarize(allBills);

    const bestSellers = all.productWise
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        todaySales: today.revenue,
        todayProfit: today.profit,
        weekSales: week.revenue,
        monthSales: month.revenue,
        totalSales: all.billsCount,
        totalRevenue: all.revenue,
        totalProfit: all.profit,
        totalLoss: all.loss,
        totalProducts: products.length,
        totalProductsSold: all.unitsSold,
        totalAvailableStock: products.reduce((s, p) => s + (p.stockQty || 0), 0),
        lowStockCount: products.filter((p) => p.stockQty > 0 && p.stockQty <= p.minAlertQty).length,
        outOfStockCount: products.filter((p) => p.stockQty <= 0).length,
        recentSales,
        bestSellers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/quicksale/reports?range=daily|weekly|monthly|custom&startDate&endDate
router.get('/reports', protect, adminOnly, async (req, res) => {
  try {
    const { range = 'daily', startDate, endDate } = req.query;
    let start, end;
    if (range === 'weekly') {
      start = moment().subtract(6, 'days').startOf('day').toDate();
      end = moment().endOf('day').toDate();
    } else if (range === 'monthly') {
      start = moment().startOf('month').toDate();
      end = moment().endOf('day').toDate();
    } else if (range === 'custom' && startDate && endDate) {
      start = moment(startDate).startOf('day').toDate();
      end = moment(endDate).endOf('day').toDate();
    } else {
      start = moment().startOf('day').toDate();
      end = moment().endOf('day').toDate();
    }

    const bills = await Bill.find({ isQuickSale: true, billDate: { $gte: start, $lte: end } })
      .populate('customer', 'name phone');

    const summary = summarize(bills);

    // ── Category-wise breakdown — category lives on Product, not the bill item ──
    const productIds = [...new Set(
      bills.flatMap((b) => b.items)
        .filter((i) => i.itemType === 'product' && i.productId)
        .map((i) => i.productId.toString())
    )];
    const productsById = {};
    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }, 'category');
      products.forEach((p) => { productsById[p._id.toString()] = p.category; });
    }
    const categoryWise = {};
    for (const bill of bills) {
      for (const item of bill.items) {
        if (item.itemType !== 'product') continue;
        const category = (item.productId && productsById[item.productId.toString()]) || 'Uncategorized';
        if (!categoryWise[category]) categoryWise[category] = { category, qty: 0, revenue: 0 };
        categoryWise[category].qty += item.quantity;
        categoryWise[category].revenue += item.total || 0;
      }
    }

    res.json({
      success: true,
      range,
      startDate: moment(start).format('DD MMM YYYY'),
      endDate: moment(end).format('DD MMM YYYY'),
      report: { ...summary, categoryWise: Object.values(categoryWise) },
      bills,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
