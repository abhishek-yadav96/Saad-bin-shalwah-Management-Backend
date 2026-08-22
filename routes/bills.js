const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const InventoryMovement = require('../models/InventoryMovement');
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
    const { search, status, startDate, endDate, page = 1, limit = 20, billGroupId, copyLabel } = req.query;
    let query = {};
    const andConditions = [];
    // ── Fetch sibling copies of a bill (e.g. to reprint just the Tailor/Cutting Copy) ──
    if (billGroupId) {
      andConditions.push({ $or: [{ billGroupId }, { _id: billGroupId }] });
    } else {
      // ── Default listing (Sale History etc.) must show one row per order,
      // never the legacy auto-generated Customer/Shop/Tailor/Delivery
      // Copy documents (each carries billGroupId) — those are internal
      // artifacts of an old copy-count flow, not separate orders. ──
      query.billGroupId = { $exists: false };
    }
    if (copyLabel) query.copyLabel = copyLabel;
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      andConditions.push({
        $or: [
          { customerName: { $regex: escapedSearch, $options: 'i' } },
          { billNumber: { $regex: escapedSearch, $options: 'i' } },
          { orderNumber: { $regex: escapedSearch, $options: 'i' } },
          { customerPhone: { $regex: escapedSearch, $options: 'i' } }
        ]
      });
    }
    if (andConditions.length) query.$and = andConditions;
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

    // ── Delivery Date is mandatory for a real order (not for Quick Sale,
    // which has no garment/delivery) — enforced server-side too, since the
    // app's own validation can't be trusted as the only gate. ──
    if (!billData.isQuickSale && !billData.deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please select Delivery Date before generating the bill.',
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

    // ── Quick Sale bill = the only copy, so it IS the Customer Copy ──
    if (billData.isQuickSale) {
      billData.copyLabel = 'Customer Copy';
    }

    // ── Generate Order Number ──
    const orderNumber = await generateOrderNumber();
    billData.orderNumber = orderNumber;

    // ── Generate QR Code ──
    const backendUrl = process.env.BACKEND_URL || 'https://saad-bin-shalwah-management-backend.vercel.app';
    const qrCode = await QRCode.toDataURL(`${backendUrl}/bill/${Date.now()}`);
    billData.qrCode = qrCode;
    billData.qrUrl = `${backendUrl}/bill/${Date.now()}`;

    // ── Deduct stock for products BEFORE creating the bill — each deduction ──
    // ── is atomic and guarded by available quantity, so a sale can never ──
    // ── oversell a product or a specific size. ──
    const deductedMovements = []; // { productId, productName, size, quantity, previousQty, newQty }
    const rollbackStock = async () => {
      for (const m of deductedMovements) {
        if (m.size) {
          await Product.updateOne(
            { _id: m.productId, 'variants.size': m.size },
            { $inc: { 'variants.$.stockQty': m.quantity, stockQty: m.quantity } }
          );
        } else {
          await Product.findByIdAndUpdate(m.productId, { $inc: { stockQty: m.quantity } });
        }
      }
    };

    for (const item of billData.items) {
      if (item.itemType !== 'product' || !item.productId) continue;
      const qty = item.quantity || 0;
      let updated;
      if (item.size) {
        updated = await Product.findOneAndUpdate(
          { _id: item.productId, 'variants.size': item.size, 'variants.stockQty': { $gte: qty } },
          { $inc: { 'variants.$.stockQty': -qty, stockQty: -qty } },
          { new: false }
        );
      } else {
        updated = await Product.findOneAndUpdate(
          { _id: item.productId, stockQty: { $gte: qty } },
          { $inc: { stockQty: -qty } },
          { new: false }
        );
      }
      if (!updated) {
        await rollbackStock();
        const product = await Product.findById(item.productId);
        const available = item.size
          ? (product?.variants?.find((v) => v.size === item.size)?.stockQty ?? 0)
          : (product?.stockQty ?? 0);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.description}"${item.size ? ` (${item.size})` : ''} — only ${available} available`,
        });
      }
      const previousQty = item.size
        ? (updated.variants.find((v) => v.size === item.size)?.stockQty ?? 0)
        : updated.stockQty;
      deductedMovements.push({
        productId: item.productId,
        productName: updated.name,
        size: item.size || null,
        quantity: qty,
        previousQty,
        newQty: previousQty - qty,
      });
    }

    // ── Create MAIN bill (roll back stock if this fails) ──
    let mainBill;
    try {
      mainBill = await Bill.create(billData);
    } catch (createErr) {
      await rollbackStock();
      throw createErr;
    }

    // ── Update main bill with correct QR URL ──
    const actualUrl = `${backendUrl}/bill/${mainBill._id}`;
    const actualQR = await QRCode.toDataURL(actualUrl);
    mainBill.qrCode = actualQR;
    mainBill.qrUrl = actualUrl;
    await mainBill.save();

    // ── Record inventory movements for the deducted stock ──
    if (deductedMovements.length > 0) {
      await InventoryMovement.insertMany(deductedMovements.map((m) => ({
        product: m.productId,
        productName: m.productName,
        size: m.size,
        previousQty: m.previousQty,
        changeQty: -m.quantity,
        newQty: m.newQty,
        reason: billData.isQuickSale ? 'Quick Sale' : 'Bill item sold',
        referenceType: 'sale',
        referenceId: mainBill._id,
        createdBy: req.user._id,
      })));
    }

    let allBills = [mainBill];

    // ═══════════════════════════════════════════════════════════════════
    // ── Custom Copy Count (User se input aayega) ──
    // ── Default: 4 copies, Quick Sale: sirf 1 copy ──
    // ── BUG FIX: `billData.copyCount || 4` treated an explicit 0 (sent by
    // create_bill_screen.dart to mean "just the one main Bill document")
    // as falsy and silently fell back to 4 — so every order kept creating
    // 4 extra Bill docs with suffixed billNumbers (ORD1013-C/-S/-T/-D)
    // that looked like the Order Number itself was changing/duplicating.
    // Must check for null/undefined specifically, not truthiness. ──
    // ═══════════════════════════════════════════════════════════════════
    if (!billData.isQuickSale) {
      const copyCount = (billData.copyCount === undefined || billData.copyCount === null)
        ? 4
        : billData.copyCount;
      
      // ── Copy labels and icons ──
      const copyLabels = ['Customer Copy', 'Shop Copy', 'Tailor/Cutting Copy', 'Delivery Copy'];
      const copyIcons = ['C', 'S', 'T', 'D'];
      
      // ── Max copies limited to 4 ──
      const maxCopies = Math.min(copyCount, copyLabels.length);
      
      for (let i = 0; i < maxCopies; i++) {
        const copyData = {
          ...billData,
          copyLabel: copyLabels[i],
          billGroupId: mainBill._id,
          orderNumber: orderNumber,
          measurementSnapshot: billData.measurementSnapshot,
          billNumber: `${mainBill.billNumber}-${copyIcons[i]}`,
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
      currency: settings.currency || 'SAR',
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
      currency: settings.currency || 'SAR',
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