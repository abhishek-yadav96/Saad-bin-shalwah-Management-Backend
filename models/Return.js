const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: { type: String, required: true },
  size: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // refunded per-unit amount, snapshot from the original bill item
  refundAmount: { type: Number, required: true },
  reason: { type: String },
}, { _id: false });

const returnSchema = new mongoose.Schema({
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  billNumber: { type: String, required: true },
  items: [returnItemSchema],
  totalRefund: { type: Number, required: true, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);
