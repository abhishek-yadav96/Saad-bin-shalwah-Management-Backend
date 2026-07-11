const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  fullNameLabel: { type: String },

  pickupDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },

  suitQuantity: { type: Number, default: 1 },

  type: { type: [String], enum: ['Shirt', 'Trousers'], default: ['Shirt', 'Trousers'] },

  orderType: { type: String, enum: ['New Stitching', 'Alteration'], default: 'New Stitching' },

  clothLabel: {
    type: String,
    enum: [
      'Air Forces', 'Military Academy', 'Missile Forces', 'Naval Forces',
      'National Guard', 'Security', 'Police', 'Fire Police', 'Other'
    ],
  },
  clothLabelOther: { type: String },

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

  styleImage: { type: String },
  extraInformation: { type: String },

  price: { type: Number, default: 0 },
  advance: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  isPending: { type: Boolean, default: true },
  isDelivered: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  readyAt: { type: Date },

  paymentType: { type: String, enum: ['Cash', 'Online'], default: 'Online' },

  paymentStatus: {
    type: String,
    enum: ['advance_only', 'payment_requested', 'paid'],
    default: 'advance_only',
  },

  // ── Shirt Style Options ──
  napel: { type: String },
  pocketStyle: { type: String, enum: ['Box', 'No Box'], default: 'Box' },
  pocketCut: { type: String, enum: ['Cross', 'Sidha'], default: 'Cross' },
  mobilePocket: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
  pocketClosure: { type: String, enum: ['Velcro', 'Button'], default: 'Velcro' },
  frontStyle: {
    type: String,
    enum: ['Chain Velcro', 'Chain Button', 'Only Button'],
    default: 'Chain Velcro',
  },
  nameEmbroidery: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
  buttonSize: { type: String, enum: ['Big', 'Small'], default: 'Big' },
  cuffStyle: { type: String, enum: ['Velcro', 'Button'], default: 'Velcro' },
  pleats: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
  chestStyle: {
    type: String,
    enum: ['Velcro Complete', 'Wing Velcro', 'Left Velcro'],
    default: 'Velcro Complete',
  },

  // ── Pant Style Options (UPDATED) ──
  pantWaistStyle: { 
    type: String, 
    enum: ['Self Velcro', 'Hook'], 
    default: 'Self Velcro' 
  },
  pantBottomStyle: { type: String, enum: ['Plain', 'Velcro'], default: 'Plain' },
  pantPocketStyle: {
    type: String,
    enum: ['Cross', 'Sidha', 'Plain', 'Center Box', 'Side Box', 'Pleated', 'No', 'LK', 'RK', '2K'],
    default: 'RK',
  },

  extraItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    purchasePrice: { type: Number },
    sellPrice: { type: Number },
    quantity: { type: Number, default: 1 },
  }],
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },

  phone: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^\d{10}$/.test(v),
      message: 'Phone number must be exactly 10 digits',
    },
  },

  city: { type: String, default: 'Riyadh' },

  email: { type: String, trim: true, lowercase: true },
  measurements: [measurementSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

measurementSchema.pre('save', function (next) {
  this.remaining = (this.price || 0) - (this.advance || 0);
  if (!this.deliveryDate) {
    this.deliveryDate = this.pickupDate || new Date();
  }
  next();
});

customerSchema.pre('validate', function (next) {
  if (this.phone) {
    let digits = this.phone.replace(/\D/g, '');
    if (digits.length > 10) digits = digits.slice(-10);
    this.phone = digits;
  }
  if (!this.city || this.city.trim() === '') {
    this.city = 'Riyadh';
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);