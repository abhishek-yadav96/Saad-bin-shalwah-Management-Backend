const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g. "Belt", "Shoes"
  category: { type: String, required: true },

  // ── FIX #19: purchase price internal, sell price default suggestion ──
  purchasePrice: { type: Number, required: true, default: 0 }, // admin only, never shown to customer
  price: { type: Number, required: true },                      // default/suggested sell price

  stockQty: { type: Number, default: 0 },
  minAlertQty: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.virtual('isLowStock').get(function () {
  return this.stockQty <= this.minAlertQty;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
