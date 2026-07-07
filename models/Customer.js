const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  fullNameLabel: { type: String },
  deliveryDate: { type: Date },
  suitQuantity: { type: Number, default: 1 },

  // ── FIX: ab array hai, taake Shirt + Trousers dono ek saath save ho sakein ──
  type: [{ type: String, enum: ['Shirt', 'Trousers'] }],

  // ── Order Type ──
  orderType: { type: String, enum: ['New Stitching', 'Alteration'], default: 'New Stitching' },

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
  waist: Number,
  hip: Number,
  thigh: Number,
  knee: Number,
  bottom: Number,
  round: Number,

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

  // ── Shirt Style Options ──
  napel: { type: String },
  pocketStyle: { type: String, enum: ['Box', 'No Box'] },
  pocketCut: { type: String, enum: ['Cross', 'Sidha'] },
  mobilePocket: { type: String, enum: ['Yes', 'No'] },
  pocketClosure: { type: String, enum: ['Velcro', 'Button'] },
  frontStyle: { type: String, enum: ['Chain Velcro', 'Chain Button', 'Only Button'] },
  nameEmbroidery: { type: String, enum: ['Yes', 'No'] },
  buttonSize: { type: String, enum: ['Big', 'Small'] },
  cuffStyle: { type: String, enum: ['Velcro', 'Button'] },
  pleats: { type: String, enum: ['Yes', 'No'] },
  chestStyle: { type: String, enum: ['Velcro Complete', 'Wing Velcro', 'Left Velcro'] },

  // ── Pant Style Options ──
  pantWaistStyle: { type: String, enum: ['Self Velcro', 'Hook'] },
  pantBottomStyle: { type: String, enum: ['Plain', 'Velcro'] },
  pantPocketStyle: {
    type: String,
    enum: ['Cross', 'Sidha', 'Plain', 'Center Box', 'Side Box', 'Pleated', 'No', 'LK', 'RK'],
  },
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String },
  email: { type: String, trim: true, lowercase: true }, // ── NEW ──
  measurements: [measurementSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-calculate remaining
measurementSchema.pre('save', function(next) {
  this.remaining = (this.price || 0) - (this.advance || 0);
  next();
});

module.exports = mongoose.model('Customer', customerSchema);