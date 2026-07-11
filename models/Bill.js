const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  itemType: { type: String, enum: ['stitching', 'product'], default: 'stitching' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true, default: 1 },

  // purchasePrice kabhi bhi bill ke customer-facing render (pdfGenerator) me nahi jaayega
  purchasePrice: { type: Number, default: 0 },
  price: { type: Number, required: true },   // sell price — customer ko dikhta hai
  total: { type: Number },
});

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },

  // ── FIX #21: order number — jo actual order/measurement se link hai ──
  orderNumber: { type: String, index: true },

  // ── FIX #24: bill ka "set" — 4 copies ek sath print, ek group id se linked ──
  billGroupId: { type: String, index: true },
  copyLabel: {
    type: String,
    enum: ['Customer Copy', 'Shop Copy', 'Tailor/Cutting Copy', 'Delivery Copy'],
  },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },

  // ── FIX #24: cutting ke liye shirt/trouser measurement snapshot bill par ──
  measurementSnapshot: { type: mongoose.Schema.Types.Mixed },

  // ── FIX #29: quick-sale bill (bina stitching ke, seedha item bech diya) ──
  isQuickSale: { type: Boolean, default: false },

  items: [billItemSchema],
  subtotal: { type: Number, default: 0 },
  vatPercent: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  billDate: { type: Date, default: Date.now },

  // ── FIX #26: status flow now: pending -> partial(advance) -> payment_requested -> paid ──
  status: {
    type: String,
    enum: ['pending', 'partial', 'payment_requested', 'paid'],
    default: 'pending',
  },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },

  paymentType: { type: String, enum: ['Cash', 'Online'], default: 'Online' }, // FIX #20

  qrCode: { type: String },
  emailSent: { type: Boolean, default: false },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // FIX #28
}, { timestamps: true });

billSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((sum, item) => {
    item.total = item.quantity * item.price;
    return sum + item.total;
  }, 0);
  this.vatAmount = (this.subtotal * this.vatPercent) / 100;
  this.total = this.subtotal + this.vatAmount;
  this.remaining = this.total - this.advancePaid;

  // ── FIX #25 + #26: advance-first flow ──
  if (this.status !== 'payment_requested' && this.status !== 'paid') {
    if (this.remaining <= 0 && this.total > 0) this.status = 'paid';
    else if (this.advancePaid > 0) this.status = 'partial';
    else this.status = 'pending';
  }
  next();
});

// Helper: profit/loss per bill (purchasePrice never exposed to customer views)
billSchema.methods.calcProfit = function () {
  return this.items.reduce((sum, item) => {
    const cost = (item.purchasePrice || 0) * item.quantity;
    return sum + (item.total - cost);
  }, 0);
};

module.exports = mongoose.model('Bill', billSchema);
