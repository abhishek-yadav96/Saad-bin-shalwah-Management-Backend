const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const { protect, adminOnly } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Multer + Cloudinary config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tailor_shop/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// @GET /api/products
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, stockStatus, sort } = req.query;
    let query = { isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (stockStatus === 'out') query.stockQty = { $lte: 0 };
    else if (stockStatus === 'low') query.$expr = { $and: [{ $gt: ['$stockQty', 0] }, { $lte: ['$stockQty', '$minAlertQty'] }] };
    else if (stockStatus === 'in') query.stockQty = { $gt: 0 };

    let sortBy = { name: 1 };
    if (sort === 'price_asc') sortBy = { price: 1 };
    else if (sort === 'price_desc') sortBy = { price: -1 };
    else if (sort === 'stock_asc') sortBy = { stockQty: 1 };
    else if (sort === 'newest') sortBy = { createdAt: -1 };

    const products = await Product.find(query).sort(sortBy);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/categories — distinct categories for filter chips
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, categories: categories.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/low-stock
router.get('/low-stock', protect, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stockQty', '$minAlertQty'] }
    });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/:id/movements — inventory movement history for one product
router.get('/:id/movements', protect, adminOnly, async (req, res) => {
  try {
    const movements = await InventoryMovement.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, movements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/products — JSON body, or multipart with `image` file + JSON `data` field
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const body = JSON.parse(req.body.data || JSON.stringify(req.body));
    if (req.file) body.images = [req.file.path];
    const product = await Product.create(body);

    if (product.stockQty > 0) {
      if (product.variants && product.variants.length > 0) {
        await InventoryMovement.insertMany(product.variants.map((v) => ({
          product: product._id,
          productName: product.name,
          size: v.size,
          previousQty: 0,
          changeQty: v.stockQty,
          newQty: v.stockQty,
          reason: 'New product added',
          referenceType: 'product_added',
          createdBy: req.user._id,
        })));
      } else {
        await InventoryMovement.create({
          product: product._id,
          productName: product.name,
          previousQty: 0,
          changeQty: product.stockQty,
          newQty: product.stockQty,
          reason: 'New product added',
          referenceType: 'product_added',
          createdBy: req.user._id,
        });
      }
    }

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/products/:id
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const body = JSON.parse(req.body.data || JSON.stringify(req.body));
    if (req.file) body.images = [req.file.path];
    Object.assign(product, body);
    await product.save(); // runs pre-save hook: syncs stockQty from variants when present
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/products/:id/restock
router.put('/:id/restock', protect, adminOnly, async (req, res) => {
  try {
    const { quantity, size } = req.body;
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Enter a valid quantity' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let previousQty;
    if (size && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.size === size);
      if (!variant) return res.status(404).json({ success: false, message: `Size "${size}" not found` });
      previousQty = variant.stockQty || 0;
      variant.stockQty = previousQty + qty;
    } else {
      previousQty = product.stockQty || 0;
      product.stockQty = previousQty + qty;
    }
    await product.save();

    await InventoryMovement.create({
      product: product._id,
      productName: product.name,
      size: size || null,
      previousQty,
      changeQty: qty,
      newQty: previousQty + qty,
      reason: 'Restock',
      referenceType: 'restock',
      createdBy: req.user._id,
    });

    res.json({ success: true, product, message: `Restocked ${qty} units` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/products/:id/adjust — manual correction (+/-) with a reason, e.g. damage, miscount
router.put('/:id/adjust', protect, adminOnly, async (req, res) => {
  try {
    const { changeQty, size, reason } = req.body;
    const delta = parseInt(changeQty);
    if (!delta) return res.status(400).json({ success: false, message: 'Enter a non-zero adjustment quantity' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let previousQty;
    if (size && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.size === size);
      if (!variant) return res.status(404).json({ success: false, message: `Size "${size}" not found` });
      previousQty = variant.stockQty || 0;
      const newQty = previousQty + delta;
      if (newQty < 0) return res.status(400).json({ success: false, message: 'Adjustment would make stock negative' });
      variant.stockQty = newQty;
    } else {
      previousQty = product.stockQty || 0;
      const newQty = previousQty + delta;
      if (newQty < 0) return res.status(400).json({ success: false, message: 'Adjustment would make stock negative' });
      product.stockQty = newQty;
    }
    await product.save();

    await InventoryMovement.create({
      product: product._id,
      productName: product.name,
      size: size || null,
      previousQty,
      changeQty: delta,
      newQty: previousQty + delta,
      reason: reason || 'Manual adjustment',
      referenceType: 'manual_adjustment',
      createdBy: req.user._id,
    });

    res.json({ success: true, product, message: 'Stock adjusted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
