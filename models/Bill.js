const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  itemType: { type: String, enum: ['stitching', 'product'], default: 'stitching' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  total: { type: Number },
});

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [billItemSchema],
  subtotal: { type: Number, default: 0 },
  vatPercent: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  billDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  qrCode: { type: String },
  emailSent: { type: Boolean, default: false },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-calculate totals before save
billSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => {
    item.total = item.quantity * item.price;
    return sum + item.total;
  }, 0);
  this.vatAmount = (this.subtotal * this.vatPercent) / 100;
  this.total = this.subtotal + this.vatAmount;
  this.remaining = this.total - this.advancePaid;
  if (this.remaining <= 0) this.status = 'paid';
  else if (this.advancePaid > 0) this.status = 'partial';
  else this.status = 'pending';
  next();
});

module.exports = mongoose.model('Bill', billSchema);