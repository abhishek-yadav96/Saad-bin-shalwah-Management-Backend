const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  fullNameLabel: { type: String },
  deliveryDate: { type: Date },
  suitQuantity: { type: Number, default: 1 },
  type: { type: String, enum: ['Shirt', 'Trousers'] },

  // ── Shirt Measurements ──
  length: Number,
  chest: Number,
  middle: Number,
  shoulder: Number,
  arm: Number,
  kback: Number,
  neck: Number,
  head: Number,

  // ── Trousers Measurements ──
  pantLength: Number,
  belt: Number,
  seat: Number,
  thigh: Number,
  legStitching: Number,
  alteration: Number,

  // Style image
  styleImage: { type: String },
  extraInformation: { type: String },

  // Pricing
  price: { type: Number, default: 0 },
  advance: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  isPending: { type: Boolean, default: true },
  isDelivered: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  readyAt: { type: Date },

  // Payment Type
  paymentType: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },

  // ── Shirt Style Options (Client ke hisaab se) ──
  napel: { type: String },
  pocketStyle: { type: String, enum: ['Box', 'No Box'] },
  pocketCut: { type: String, enum: ['Cross', 'Sidha'] },
  mobilePocket: { type: String, enum: ['Yes', 'No'] },
  pocketClosure: { type: String, enum: ['Loop', 'Button'] },
  frontStyle: { type: String, enum: ['Chain Loop', 'Chain Button', 'Only Button'] },
  nameEmbroidery: { type: String, enum: ['Yes', 'No'] },
  buttonSize: { type: String, enum: ['Big', 'Small'] },
  cuffStyle: { type: String, enum: ['Loop', 'Button'] },
  pleats: { type: String, enum: ['Yes', 'No'] },
  chestStyle: { type: String, enum: ['Loop Complete', 'Wing Loop', 'Left Loop'] },

  // ── Pant Style Options ──
  pantWaistStyle: { type: String, enum: ['Self Loop', 'Hook'] },
  pantBottomStyle: { type: String, enum: ['Plain', 'Loop'] },
  pantPocketStyle: {
    type: String,
    enum: ['Cross', 'Sidha', 'Plain', 'Center Box', 'Side Box', 'Pleated', 'No'],
  },
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String },
  measurements: [measurementSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-calculate remaining
measurementSchema.pre('save', function(next) {
  this.remaining = (this.price || 0) - (this.advance || 0);
  next();
});

module.exports = mongoose.model('Customer', customerSchema);