const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/inventory/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const totalProducts = products.length;
    const totalStockUnits = products.reduce((sum, p) => sum + (p.stockQty || 0), 0);
    const lowStockProducts = products.filter((p) => p.stockQty > 0 && p.stockQty <= p.minAlertQty);
    const outOfStockProducts = products.filter((p) => p.stockQty <= 0);

    res.json({
      success: true,
      summary: {
        totalProducts,
        totalStockUnits,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockProducts,
        outOfStockProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/inventory/movements — audit trail across all products
router.get('/movements', protect, adminOnly, async (req, res) => {
  try {
    const { productId, referenceType, page = 1, limit = 50 } = req.query;
    const query = {};
    if (productId) query.product = productId;
    if (referenceType) query.referenceType = referenceType;

    const total = await InventoryMovement.countDocuments(query);
    const movements = await InventoryMovement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');

    res.json({ success: true, movements, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
