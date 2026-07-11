const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  fullNameLabel: { type: String },

  // ── FIX #4: Delivery date ab khud pickup date se copy ho jaayega (pre-save me), ──
  // ── admin ko alag se delivery date choose nahi karna padega ──
  pickupDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },

  suitQuantity: { type: Number, default: 1 },

  // ── Type: array, dono select ho sakte hain, DEFAULT dono selected (FIX #5) ──
  // Flutter side: dono chips/checkbox "selected" state se start honge,
  // admin unclick karke jo nahi chahiye wo hata sakta hai.
  type: { type: [String], enum: ['Shirt', 'Trousers'], default: ['Shirt', 'Trousers'] },

  // ── Order Type (FIX #3): click karte hi frontend khud next page bhej dega, ──
  // yahan backend sirf value store karta hai, "auto-advance" Flutter navigator me hoga
  orderType: { type: String, enum: ['New Stitching', 'Alteration'], default: 'New Stitching' },

  // ── Cloth Label (naya, aapki list ke mutabiq) ──
  clothLabel: {
    type: String,
    enum: [
      'Air Forces', 'Military Academy', 'Missile Forces', 'Naval Forces',
      'National Guard', 'Security', 'Police', 'Fire Police', 'Other'
    ],
  },
  clothLabelOther: { type: String }, // jab "Other" select ho to free text

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

  // ── FIX #20: Payment type default "Online" ──
  paymentType: { type: String, enum: ['Cash', 'Online'], default: 'Online' },

  // ── FIX #26: payment status ab 3-step: advance -> payment_requested -> paid ──
  paymentStatus: {
    type: String,
    enum: ['advance_only', 'payment_requested', 'paid'],
    default: 'advance_only',
  },

  // ── Shirt Style Options (FIX #6–#15) — sab default values set hain ──
  napel: { type: String },
  pocketStyle: { type: String, enum: ['Box', 'No Box'], default: 'Box' },              // #6
  pocketCut: { type: String, enum: ['Cross', 'Sidha'], default: 'Cross' },             // #7
  mobilePocket: { type: String, enum: ['Yes', 'No'], default: 'Yes' },                 // #8
  pocketClosure: { type: String, enum: ['Velcro', 'Button'], default: 'Velcro' },      // #9
  frontStyle: {
    type: String,
    enum: ['Chain Velcro', 'Chain Button', 'Only Button'],
    default: 'Chain Velcro',                                                            // #10
  },
  nameEmbroidery: { type: String, enum: ['Yes', 'No'], default: 'Yes' },               // #11
  buttonSize: { type: String, enum: ['Big', 'Small'], default: 'Big' },                // #12
  cuffStyle: { type: String, enum: ['Velcro', 'Button'], default: 'Velcro' },          // #13
  pleats: { type: String, enum: ['Yes', 'No'], default: 'Yes' },                       // #14
  chestStyle: {
    type: String,
    enum: ['Velcro Complete', 'Wing Velcro', 'Left Velcro'],
    default: 'Velcro Complete',                                                        // #15
  },

  // ── Pant Style Options (FIX #16–18) ──
  // #16: "Hook" option hata diya, ab sirf Self Velcro hi valid + default
  pantWaistStyle: { type: String, enum: ['Self Velcro'], default: 'Self Velcro' },
  pantBottomStyle: { type: String, enum: ['Plain', 'Velcro'], default: 'Plain' },      // #17
  // #18: pant pocket sirf tab dikhega jab type me "Trousers" ho, default RK
  pantPocketStyle: {
    type: String,
    enum: ['Cross', 'Sidha', 'Plain', 'Center Box', 'Side Box', 'Pleated', 'No', 'LK', 'RK'],
    default: 'RK',
  },

  // ── Extra items (FIX #19): shop ke available items me se select karke add karna ──
  extraItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },       // snapshot of item type/name
    purchasePrice: { type: Number }, // admin/internal only — customer ko show nahi hoga
    sellPrice: { type: Number },     // manually set at time of sale, ye customer ko dikhta hai
    quantity: { type: Number, default: 1 },
  }],
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // ── FIX #1: phone strictly 10 digits ──
  phone: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^\d{10}$/.test(v),
      message: 'Phone number must be exactly 10 digits',
    },
  },

  // ── FIX #2: city defaults to Riyadh, pre-filled ──
  city: { type: String, default: 'Riyadh' },

  email: { type: String, trim: true, lowercase: true },
  measurements: [measurementSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // FIX #28
}, { timestamps: true });

// Auto-calc remaining + auto delivery date = pickup date (FIX #4)
measurementSchema.pre('save', function (next) {
  this.remaining = (this.price || 0) - (this.advance || 0);
  if (!this.deliveryDate) {
    this.deliveryDate = this.pickupDate || new Date();
  }
  next();
});

// Normalize phone to 10 digits (strip +country code, spaces, dashes) before validation
customerSchema.pre('validate', function (next) {
  if (this.phone) {
    let digits = this.phone.replace(/\D/g, '');
    if (digits.length > 10) digits = digits.slice(-10); // keep last 10 digits
    this.phone = digits;
  }
  if (!this.city || this.city.trim() === '') {
    this.city = 'Riyadh';
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
