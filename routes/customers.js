const express = require('express');
const router = express.Router();
const multer = require('multer');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Multer + Cloudinary config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tailor_shop/styles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helper: Clean null/undefined values ──
function cleanMeasurement(m) {
  const cleaned = { ...m };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === null || cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

// ── Helper: Generate Order Number ──
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}${random}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/customers - FULL SEARCH SUPPORT
// ═══════════════════════════════════════════════════════════════════════════
router.get('/', protect, async (req, res) => {
  try {
    const { 
      search = '', 
      filter = 'all', 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let searchQuery = {};
    
    // ── BUILD SEARCH QUERY ──
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      
      // Check if it's a number (could be phone or order number)
      const isNumeric = /^\d+$/.test(searchTerm);
      const isOrderFormat = /^ORD-\d+$/i.test(searchTerm);
      
      if (isNumeric) {
        // Search by phone OR measurement index
        searchQuery = {
          $or: [
            { phone: { $regex: searchTerm, $options: 'i' } },
            // Search in measurements by index (if user searches "1" for first order)
            { 'measurements._id': searchTerm },
            { 'measurements.fullNameLabel': { $regex: searchTerm, $options: 'i' } }
          ]
        };
      } else if (isOrderFormat) {
        // Search by order number in measurements (store in extraInformation or generate)
        searchQuery = {
          $or: [
            { 'measurements.extraInformation': { $regex: searchTerm, $options: 'i' } },
            { 'measurements.fullNameLabel': { $regex: searchTerm, $options: 'i' } }
          ]
        };
      } else {
        // Normal text search
        searchQuery = {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { phone: { $regex: searchTerm, $options: 'i' } },
            { city: { $regex: searchTerm, $options: 'i' } },
            { 'measurements.fullNameLabel': { $regex: searchTerm, $options: 'i' } },
            { 'measurements.orderType': { $regex: searchTerm, $options: 'i' } },
            { 'measurements.type': { $regex: searchTerm, $options: 'i' } }
          ]
        };
      }
    }
    
    // ── FILTER QUERY ──
    let filterQuery = {};
    if (filter === 'pending') {
      filterQuery = {
        'measurements.isPending': true,
        'measurements.isDelivered': { $ne: true }
      };
    } else if (filter === 'delivered') {
      filterQuery = {
        'measurements.isDelivered': true
      };
    } else if (filter === 'ready') {
      filterQuery = {
        'measurements.isReady': true,
        'measurements.isDelivered': { $ne: true }
      };
    }
    
    // ── COMBINE QUERIES ──
    const finalQuery = {
      ...searchQuery,
      ...filterQuery
    };
    
    // ── GET CUSTOMERS ──
    const customers = await Customer.find(finalQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name')
      .lean();
    
    // ── Add order numbers to measurements for display ──
    customers.forEach(customer => {
      if (customer.measurements) {
        customer.measurements.forEach((m, index) => {
          // Generate order number if not present
          if (!m.orderNumber) {
            m.orderNumber = `ORD-${(index + 1).toString().padStart(4, '0')}`;
          }
        });
      }
    });
    
    const total = await Customer.countDocuments(finalQuery);
    const pages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      customers,
      total,
      pages,
      page: parseInt(page),
      limit: limitNum
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/customers
// ═══════════════════════════════════════════════════════════════════════════
router.post('/', protect, upload.single('styleImage'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || JSON.stringify(req.body));
    
    if (req.file && data.measurements && data.measurements[0]) {
      data.measurements[0].styleImage = req.file.path;
    }
    
    if (data.measurements) {
      data.measurements = data.measurements.map((m, index) => {
        const cleaned = cleanMeasurement({
          ...m,
          remaining: (m.price || 0) - (m.advance || 0),
          isPending: ((m.price || 0) - (m.advance || 0)) > 0,
          // Generate order number
          orderNumber: m.orderNumber || generateOrderNumber()
        });
        return cleaned;
      });
    }
    
    data.createdBy = req.user._id;
    const customer = await Customer.create(data);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/customers/:id
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    // Add order numbers to measurements
    if (customer.measurements) {
      customer.measurements.forEach((m, index) => {
        if (!m.orderNumber) {
          m.orderNumber = `ORD-${(index + 1).toString().padStart(4, '0')}`;
        }
      });
    }
    
    res.json({ success: true, customer });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/customers/:id
// ═══════════════════════════════════════════════════════════════════════════
router.put('/:id', protect, upload.single('styleImage'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || JSON.stringify(req.body));
    
    if (req.file && data.measurements && data.measurements[0]) {
      data.measurements[0].styleImage = req.file.path;
    }
    
    if (data.measurements) {
      data.measurements = data.measurements.map((m, index) => {
        const cleaned = cleanMeasurement({
          ...m,
          remaining: (m.price || 0) - (m.advance || 0),
          isPending: ((m.price || 0) - (m.advance || 0)) > 0,
          orderNumber: m.orderNumber || `ORD-${(index + 1).toString().padStart(4, '0')}`
        });
        return cleaned;
      });
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, 
      data, 
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({ success: true, customer });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/customers/:id/measurements - NEW ORDER
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/measurements', protect, upload.single('styleImage'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || JSON.stringify(req.body));
    let measurement = data.measurement || {};

    if (req.file) {
      measurement.styleImage = req.file.path;
    }

    // Get customer to count existing measurements
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const orderNumber = `ORD-${(customer.measurements.length + 1).toString().padStart(4, '0')}`;
    
    measurement = cleanMeasurement({
      ...measurement,
      remaining: (measurement.price || 0) - (measurement.advance || 0),
      isPending: ((measurement.price || 0) - (measurement.advance || 0)) > 0,
      orderNumber: measurement.orderNumber || orderNumber
    });

    customer.measurements.push(measurement);
    await customer.save();

    res.status(201).json({ 
      success: true, 
      customer,
      measurement: measurement 
    });
  } catch (err) {
    console.error('Add measurement error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/customers/:id
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/:id', protect, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true, 
      message: 'Customer deleted' 
    });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/customers/:id/measurement/:mId/ready
// ═══════════════════════════════════════════════════════════════════════════
router.put('/:id/measurement/:mId/ready', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    const measurement = customer.measurements.id(req.params.mId);
    if (!measurement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Measurement not found' 
      });
    }
    measurement.isReady = true;
    measurement.readyAt = new Date();
    await customer.save();
    res.json({ success: true, message: 'Marked as ready' });
  } catch (err) {
    console.error('Mark ready error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/customers/:id/measurement/:mId/deliver
// ═══════════════════════════════════════════════════════════════════════════
router.put('/:id/measurement/:mId/deliver', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    const measurement = customer.measurements.id(req.params.mId);
    if (!measurement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Measurement not found' 
      });
    }
    measurement.isDelivered = true;
    measurement.isPending = false;
    await customer.save();
    res.json({ success: true, message: 'Marked as delivered' });
  } catch (err) {
    console.error('Mark delivered error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/customers/:id/measurement/:mId/paid
// ═══════════════════════════════════════════════════════════════════════════
router.put('/:id/measurement/:mId/paid', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    const measurement = customer.measurements.id(req.params.mId);
    if (!measurement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Measurement not found' 
      });
    }
    measurement.advance = measurement.price;
    measurement.remaining = 0;
    measurement.isPending = false;
    await customer.save();
    res.json({ success: true, message: 'Marked as paid' });
  } catch (err) {
    console.error('Mark paid error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;