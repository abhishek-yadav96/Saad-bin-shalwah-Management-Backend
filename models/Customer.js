const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  fullNameLabel: { type: String },
  deliveryDate: { type: Date },
  suitQuantity: { type: Number, default: 1 },
  type: { type: String, enum: ['Waistcoat', 'Shirt', 'Kurta', 'Been', 'Collar'] },

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

  // Checkboxes
  doubleSewing: { type: Boolean, default: false },
  zip: { type: Boolean, default: false },
  stud: { type: Boolean, default: false },
  frontPocket: { type: Boolean, default: false },
  net: { type: Boolean, default: false },

  // Radio options
  surroundType: { type: String, enum: ['Round', 'Square'] },
  shalwarType: { type: String, enum: ['Simple', 'Trouser'] },
  buttons: { type: String, enum: ['Simple', 'Stylish'] },
  sidePocket: { type: String, enum: ['One', 'Two', 'No Pocket'] },

  // Style image
  styleImage: { type: String },
  extraInformation: { type: String },

  // Pricing
  price: { type: Number, default: 0 },
  advance: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  isPending: { type: Boolean, default: true },
  isDelivered: { type: Boolean, default: false },

  // ── NEW: Kapda ready status (taiyar ho gaya, deliver hone se pehle) ──
  isReady: { type: Boolean, default: false },
  readyAt: { type: Date },

  // Shirt style options
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

  // Pant style options
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