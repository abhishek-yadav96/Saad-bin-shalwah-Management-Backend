const mongoose = require('mongoose');

// ── Size/variant stock — e.g. Belt in S/M/L, each with its own stock ──
const productVariantSchema = new mongoose.Schema({
  size: { type: String, required: true },   // e.g. "S", "M", "L", "32", "Free Size"
  color: { type: String },                  // optional, e.g. "Black"
  stockQty: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g. "Belt", "Shoes"
  description: { type: String },
  category: { type: String, required: true },
  subcategory: { type: String },
  brand: { type: String },
  sku: { type: String, trim: true },
  barcode: { type: String, trim: true },
  images: [{ type: String }],

  // ── FIX #19: purchase price internal, sell price default suggestion ──
  purchasePrice: { type: Number, required: true, default: 0 }, // admin only, never shown to customer
  price: { type: Number, required: true },                      // default/suggested sell price
  discountPercent: { type: Number, default: 0 },                 // e.g. 10 = 10% off `price`

  // ── No-variant products use stockQty directly. Products with sizes ──
  // ── (belts, ready-made clothes) use `variants`; stockQty is then kept ──
  // ── in sync as the sum of all variant stock (see pre-save hook). ──
  stockQty: { type: Number, default: 0 },
  variants: [productVariantSchema],

  minAlertQty: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.stockQty = this.variants.reduce((sum, v) => sum + (v.stockQty || 0), 0);
  }
  next();
});

productSchema.virtual('isLowStock').get(function () {
  return this.stockQty > 0 && this.stockQty <= this.minAlertQty;
});

productSchema.virtual('isOutOfStock').get(function () {
  return this.stockQty <= 0;
});

productSchema.virtual('sellingPrice').get(function () {
  if (!this.discountPercent) return this.price;
  return +(this.price * (1 - this.discountPercent / 100)).toFixed(2);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
