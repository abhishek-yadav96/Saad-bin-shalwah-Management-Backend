const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stockQty: { type: Number, default: 0 },
  minAlertQty: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.virtual('isLowStock').get(function() {
  return this.stockQty <= this.minAlertQty;
});

module.exports = mongoose.model('Product', productSchema);