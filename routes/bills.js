const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const { generatePDF } = require('../utils/pdfGenerator');
const { sendBillEmail } = require('../utils/emailService');

// ── Helpers ──
const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
};

const getNextBillNumber = async (settings) => {
  if (settings.billNumberFormat === 'auto') {
    const counter = settings.billNumberCounter || 1000;
    settings.billNumberCounter = counter + 1;
    await settings.save();
    return `${settings.billNumberPrefix}${counter}`;
  }
  return null;
};

const generateOrderNumber = async () => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { orderNumberCounter: 1 } },
    { new: true, upsert: true }
  );
  const prefix = settings.billNumberPrefix || 'ORD';
  return `${prefix}-${settings.orderNumberCounter}`;
};

// @GET /api/bills
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { billNumber: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate + 'T23:59:59');
    }
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('customer', 'name phone city')
      .populate('createdBy', 'name');
    res.json({ success: true, bills, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/bills
router.post('/', protect, async (req, res) => {
  try {
    const settings = await getSettings();
    const billData = { ...req.body };

    // ── Validation ──
    // Quick Sale: customer optional, Normal: customer required
    if (!billData.isQuickSale && !billData.customer) {
      return res.status(400).json({
        success: false,
        message: 'Please select a customer before creating the bill',
      });
    }
    
    if (!Array.isArray(billData.items) || billData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one bill item',
      });
    }
    
    const hasEmptyDescription = billData.items.some(
      (i) => !i.description || `${i.description}`.trim() === ''
    );
    if (hasEmptyDescription) {
      return res.status(400).json({
        success: false,
        message: 'Fill description for all bill items',
      });
    }

    // ── Auto bill number ──
    if (!billData.billNumber || billData.billNumber === 'auto') {
      billData.billNumber = await getNextBillNumber(settings);
    }
    
    const exists = await Bill.findOne({ billNumber: billData.billNumber });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Bill #${billData.billNumber} already exists`,
      });
    }

    if (billData.vatPercent === undefined || billData.vatPercent === null) {
      billData.vatPercent = settings.vatPercent || 0;
    }
    billData.createdBy = req.user._id;

    // ── Generate Order Number ──
    const orderNumber = await generateOrderNumber();
    billData.orderNumber = orderNumber;

    // ── Generate QR Code ──
    const backendUrl = process.env.BACKEND_URL || 'https://saad-bin-shalwah-management-backend.vercel.app';
    const qrCode = await QRCode.toDataURL(`${backendUrl}/bill/${Date.now()}`);
    billData.qrCode = qrCode;
    billData.qrUrl = `${backendUrl}/bill/${Date.now()}`;

    // ── Create MAIN bill ──
    const mainBill = await Bill.create(billData);

    // ── Update main bill with correct QR URL ──
    const actualUrl = `${backendUrl}/bill/${mainBill._id}`;
    const actualQR = await QRCode.toDataURL(actualUrl);
    mainBill.qrCode = actualQR;
    mainBill.qrUrl = actualUrl;
    await mainBill.save();

    // ── Deduct stock for products ──
    for (const item of mainBill.items) {
      if (item.itemType === 'product' && item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQty: -item.quantity }
        });
      }
    }

    let allBills = [mainBill];

    // ── FIX: 4 copies for normal orders ──
    if (!billData.isQuickSale) {
      const copies = [
        { copyLabel: 'Customer Copy' },
        { copyLabel: 'Shop Copy' },
        { copyLabel: 'Tailor/Cutting Copy' },
        { copyLabel: 'Delivery Copy' }
      ];

      for (const copy of copies) {
        const copyData = {
          ...billData,
          copyLabel: copy.copyLabel,
          billGroupId: mainBill._id,
          orderNumber: orderNumber,
          measurementSnapshot: billData.measurementSnapshot,
          billNumber: `${mainBill.billNumber}-${copy.copyLabel.charAt(0)}`,
        };
        
        const copyQr = await QRCode.toDataURL(`${backendUrl}/bill/${Date.now()}`);
        copyData.qrCode = copyQr;
        copyData.qrUrl = `${backendUrl}/bill/${Date.now()}`;
        
        const newBill = await Bill.create(copyData);
        
        const copyActualUrl = `${backendUrl}/bill/${newBill._id}`;
        const copyActualQR = await QRCode.toDataURL(copyActualUrl);
        newBill.qrCode = copyActualQR;
        newBill.qrUrl = copyActualUrl;
        await newBill.save();
        
        allBills.push(newBill);
      }
    }

    // ── Email ──
    const customerEmailInput = billData.customerEmail && `${billData.customerEmail}`.trim() !== ''
      ? billData.customerEmail.trim()
      : null;
    delete billData.customerEmail;

    let emailSent = false;
    if (customerEmailInput) {
      try {
        const populatedBill = await Bill.findById(mainBill._id).populate('customer');
        const pdfBuffer = await generatePDF(populatedBill, {
          shopName: settings.shopName,
          shopAddress: settings.shopAddress,
          shopPhone: settings.shopPhone,
          shopEmail: settings.shopEmail,
          currency: settings.currency || 'SAR',
          thankYouMessage: settings.thankYouMessage
        });
        populatedBill.customerEmail = customerEmailInput;
        const result = await sendBillEmail(populatedBill, pdfBuffer, settings);
        if (result && result.success !== false) {
          mainBill.emailSent = true;
          await mainBill.save();
          emailSent = true;
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr.message);
      }
    }

    res.status(201).json({ 
      success: true, 
      bill: mainBill, 
      bills: allBills, 
      orderNumber,
      emailSent 
    });
    
  } catch (err) {
    if (err.name === 'ValidationError') {
      const firstError = Object.values(err.errors)[0]?.message || err.message;
      return res.status(400).json({ success: false, message: firstError });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/bills/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name phone city')
      .populate('createdBy', 'name');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/bills/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/bills/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/bills/:id/send-email
router.post('/:id/send-email', protect, async (req, res) => {
  try {
    const settings = await getSettings();
    const bill = await Bill.findById(req.params.id).populate('customer');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const customerEmail = req.body.email || (bill.customer && bill.customer.email);
    if (!customerEmail) return res.status(400).json({ success: false, message: 'No email address provided' });

    const pdfBuffer = await generatePDF(bill, {
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      shopPhone: settings.shopPhone,
      shopEmail: settings.shopEmail,
      currency: settings.currency || 'AED',
      thankYouMessage: settings.thankYouMessage
    });

    bill.customerEmail = customerEmail;
    const result = await sendBillEmail(bill, pdfBuffer, settings);
    if (result.success) {
      bill.emailSent = true;
      await bill.save();
      res.json({ success: true, message: 'Bill email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Email failed: ' + result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/bills/:id/pdf
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const settings = await getSettings();
    const bill = await Bill.findById(req.params.id).populate('customer');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const pdfBuffer = await generatePDF(bill, {
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      shopPhone: settings.shopPhone,
      shopEmail: settings.shopEmail,
      currency: settings.currency || 'AED',
      thankYouMessage: settings.thankYouMessage
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bill_${bill.billNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;