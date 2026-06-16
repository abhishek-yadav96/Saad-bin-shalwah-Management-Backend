const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'Al Noor Saad bin shalwah' },
  shopLogo: { type: String },
  shopAddress: { type: String, default: 'Shop, UAE' },
  shopPhone: { type: String },
  shopEmail: { type: String },
  vatPercent: { type: Number, default: 0 },
  currency: { type: String, default: 'AED' },
  billNumberFormat: { type: String, enum: ['manual', 'auto'], default: 'auto' },
  billNumberCounter: { type: Number, default: 1000 },
  billNumberPrefix: { type: String, default: '' },
  smtpHost: { type: String, default: 'smtp.gmail.com' },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String },
  smtpPass: { type: String },
  thankYouMessage: { type: String, default: 'Thank you for your business! We look forward to serving you again.' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);