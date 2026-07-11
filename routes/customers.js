const express = require('express');
const router = express.Router();
const multer = require('multer');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill'); // ← ADD THIS
const { protect } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Multer + Cloudinary config for style images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tailor_shop/styles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helper: null/undefined-valued optional fields ko measurement se hata do.
// Mongoose ke liye "field missing" aur "field = null" alag cheezein hain —
// enum fields me `null` explicitly bhejne se validation fail ho jata hai
// (jaisa Pocket Style, Mobile Pocket, Pant Waist Style, etc. me ho raha tha).
// Isliye har measurement object se null/undefined keys clean kar dete hain. ──
function cleanMeasurement(m) {
  const cleaned = { ...m };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === null || cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

// @GET /api/customers
// @GET /api/customers
router.get('/', protect, async (req, res) => {
  try {
    const { search, filter, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (search) {
      // ── NEW: Search by Order Number (ORD-XXXX) ──
      const isOrderNumber = search.toString().match(/^ORD-\d+$/i);
      if (isOrderNumber) {
        const bills = await Bill.find({ 
          orderNumber: { $regex: search, $options: 'i' } 
        });
        const customerIds = bills.map(b => b.customer);
        if (customerIds.length > 0) {
          query._id = { $in: customerIds };
        } else {
          query['measurements.fullNameLabel'] = { $regex: search, $options: 'i' };
        }
      } else {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
    }
    
    if (filter === 'pending') {
      query['measurements.isPending'] = true;
    } else if (filter === 'delivered') {
      query['measurements.isDelivered'] = true;
    } else if (filter === 'ready') {
      query['measurements.isReady'] = true;
      query['measurements.isDelivered'] = { $ne: true };
    }
    
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');
    res.json({ success: true, customers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/customers
router.post('/', protect, upload.single('styleImage'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || JSON.stringify(req.body));
    if (req.file) {
      if (data.measurements && data.measurements[0]) {
        data.measurements[0].styleImage = req.file.path;
      }
    }
    if (data.measurements) {
      data.measurements = data.measurements.map(m => cleanMeasurement({
        ...m,
        remaining: (m.price || 0) - (m.advance || 0),
        isPending: ((m.price || 0) - (m.advance || 0)) > 0
      }));
    }
    data.createdBy = req.user._id;
    const customer = await Customer.create(data);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/customers/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'name');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/customers/:id
router.put('/:id', protect, upload.single('styleImage'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || JSON.stringify(req.body));
    if (req.file && data.measurements && data.measurements[0]) {
      data.measurements[0].styleImage = req.file.path;
    }
    if (data.measurements) {
      data.measurements = data.measurements.map(m => cleanMeasurement({
        ...m,
        remaining: (m.price || 0) - (m.advance || 0),
        isPending: ((m.price || 0) - (m.advance || 0)) > 0
      }));
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/customers/:id/measurements
// ── NEW: adds a FRESH order (measurement) onto an EXISTING customer without
// touching any of their previous orders. This is what powers "+ Naya Order"
// on the customer detail screen — same customer comes back after a few days
// for a new kapda/order, and their full history stays intact. ──
router.post('/:id/measurements', protect, upload.single('styleImage'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || JSON.stringify(req.body));
    let measurement = data.measurement || {};

    if (req.file) {
      measurement.styleImage = req.file.path;
    }

    measurement = cleanMeasurement({
      ...measurement,
      remaining: (measurement.price || 0) - (measurement.advance || 0),
      isPending: ((measurement.price || 0) - (measurement.advance || 0)) > 0,
    });

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.measurements.push(measurement);
    await customer.save();

    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/customers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/customers/:id/measurement/:mId/ready
router.put('/:id/measurement/:mId/ready', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    const measurement = customer.measurements.id(req.params.mId);
    measurement.isReady = true;
    measurement.readyAt = new Date();
    await customer.save();
    res.json({ success: true, message: 'Marked as ready' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/customers/:id/measurement/:mId/deliver
router.put('/:id/measurement/:mId/deliver', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    const measurement = customer.measurements.id(req.params.mId);
    measurement.isDelivered = true;
    measurement.isPending = false;
    await customer.save();
    res.json({ success: true, message: 'Marked as delivered' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/customers/:id/measurement/:mId/paid
router.put('/:id/measurement/:mId/paid', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    const measurement = customer.measurements.id(req.params.mId);
    measurement.advance = measurement.price;
    measurement.remaining = 0;
    measurement.isPending = false;
    await customer.save();
    res.json({ success: true, message: 'Marked as paid' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;