const mongoose = require('mongoose');

// ── Audit trail for every stock change — sale, return, restock, or a ──
// ── manual correction — so stock counts stay explainable after the fact. ──
const inventoryMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  size: { type: String }, // variant size, if applicable

  previousQty: { type: Number, required: true },
  changeQty: { type: Number, required: true },   // signed: +restock, -sale
  newQty: { type: Number, required: true },

  reason: { type: String },
  referenceType: {
    type: String,
    enum: ['product_added', 'sale', 'return', 'manual_adjustment', 'restock'],
    required: true,
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // Bill._id or Return._id when applicable

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
