const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Return = require('../models/Return');
const InventoryMovement = require('../models/InventoryMovement');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/returns
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.billNumber = { $regex: search, $options: 'i' };
    const total = await Return.countDocuments(query);
    const returns = await Return.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');
    res.json({ success: true, returns, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/returns/:id
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const ret = await Return.findById(req.params.id).populate('bill');
    if (!ret) return res.status(404).json({ success: false, message: 'Return not found' });
    res.json({ success: true, return: ret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/returns — body: { billId, items: [{ productId, size, quantity, reason }] }
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { billId, items } = req.body;
    if (!billId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Select the bill and at least one item to return' });
    }

    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Original bill not found' });

    const returnItems = [];
    const movements = [];
    let totalRefund = 0;

    for (const ri of items) {
      const qty = parseInt(ri.quantity);
      if (!qty || qty <= 0) continue;

      const billItem = bill.items.find(
        (i) => i.itemType === 'product' &&
          `${i.productId}` === `${ri.productId}` &&
          (i.size || null) === (ri.size || null)
      );
      if (!billItem) {
        return res.status(400).json({ success: false, message: `Item not found on bill #${bill.billNumber}` });
      }
      const alreadyReturned = billItem.returnedQty || 0;
      const remaining = billItem.quantity - alreadyReturned;
      if (qty > remaining) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${qty} of "${billItem.description}" — only ${remaining} eligible for return`,
        });
      }

      billItem.returnedQty = alreadyReturned + qty;
      const refundAmount = billItem.price * qty;
      totalRefund += refundAmount;

      returnItems.push({
        productId: billItem.productId,
        description: billItem.description,
        size: billItem.size || null,
        quantity: qty,
        price: billItem.price,
        refundAmount,
        reason: ri.reason || '',
      });

      // ── Put the stock back ──
      if (billItem.productId) {
        const product = await Product.findById(billItem.productId);
        if (product) {
          let previousQty;
          if (billItem.size && product.variants?.length > 0) {
            const variant = product.variants.find((v) => v.size === billItem.size);
            previousQty = variant ? (variant.stockQty || 0) : 0;
            if (variant) variant.stockQty = previousQty + qty;
          } else {
            previousQty = product.stockQty || 0;
            product.stockQty = previousQty + qty;
          }
          await product.save();
          movements.push({
            product: product._id,
            productName: product.name,
            size: billItem.size || null,
            previousQty,
            changeQty: qty,
            newQty: previousQty + qty,
            reason: 'Product return',
            referenceType: 'return',
            createdBy: req.user._id,
          });
        }
      }
    }

    if (returnItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing valid to return' });
    }

    await bill.save();
    if (movements.length > 0) await InventoryMovement.insertMany(movements);

    const ret = await Return.create({
      bill: bill._id,
      billNumber: bill.billNumber,
      items: returnItems,
      totalRefund,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, return: ret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
