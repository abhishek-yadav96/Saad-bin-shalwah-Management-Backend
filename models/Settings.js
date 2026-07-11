const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'Saad bin Shalwah' },
  shopLogo: { type: String },
  shopAddress: { type: String, default: 'Shop, UAE' },
  shopPhone: { type: String, default: '+971 50 123 4567' },
  shopEmail: { type: String },
  vatPercent: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },
  
  // ── Bill Number Settings ──
  billNumberFormat: { type: String, enum: ['manual', 'auto'], default: 'auto' },
  billNumberCounter: { type: Number, default: 1000 },
  billNumberPrefix: { type: String, default: 'ORD' },
  
  // ── ORDER NUMBER COUNTER (For 4 copies) ──
  orderNumberCounter: { type: Number, default: 1000 },
  
  // ── Email Settings ──
  smtpHost: { type: String, default: 'smtp.gmail.com' },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String },
  smtpPass: { type: String },
  
  // ── Footer ──
  thankYouMessage: { type: String, default: 'Thank you for your business! We look forward to serving you again.' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);