const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  fullNameLabel: { type: String },
  deliveryDate: { type: Date },
  suitQuantity: { type: Number, default: 1 },
  type: { type: String, enum: ['Shirt'] }, // Only Shirt

  // Measurements (in inches)
  length: Number,
  shoulder: Number,
  arm: Number,
  armHole: Number,
  neck: Number,
  chest: Number,
  waist: Number,
  surround: Number,
  pantLength: Number,
  pantWaist: Number,
  ankle: Number,
  wrist: Number,
  plate: Number,

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
  napel: { type: String }, // 2.1/4, 2.1/2, 3.1/4, 4.1/2, 5, 5.1/2, 6, 6.1/2, 7, 7.1/2
  pocketStyle: { type: String, enum: ['Box', 'No Box'] },
  pocketCut: { type: String, enum: ['Cross', 'Straight'] },
  mobilePocket: { type: Boolean, default: false },
  pocketClosure: { type: String, enum: ['Loop', 'Button'] },
  frontStyle: { type: String, enum: ['Zip-Loop', 'Zip-Button', 'Button Only'] },
  nameEmbroidery: { type: Boolean, default: false },
  buttonSize: { type: String, enum: ['Big', 'Small'] },
  cuffStyle: { type: String, enum: ['Loop', 'Button'] },
  pleats: { type: Boolean, default: false },
  chestStyle: { type: String, enum: ['Loop Complete', 'Wing Loop', 'Left Loop'] },

  // ── Pant Style Options (Client ke hisaab se) ──
  pantWaistStyle: { type: String, enum: ['Self Loop', 'Hook'] },
  pantBottomStyle: { type: String, enum: ['Plain', 'Loop'] },
  pantPocketStyle: {
    type: String,
    enum: ['Cross', 'Straight', 'Plain', 'Center Box', 'Side Box', 'Pleated', 'No Pocket'],
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