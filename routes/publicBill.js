const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Settings = require('../models/Settings');
const { generateBillHTML, generateQrForBill } = require('../utils/pdfGenerator');

// Public bill view - no auth needed (for QR scan)
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('customer', 'name phone city');
    if (!bill) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Bill Not Found</title></head>
        <body style="font-family:Arial;text-align:center;padding:50px;">
          <h2>❌ Bill not found</h2>
          <p>The bill you are looking for does not exist.</p>
        </body>
        </html>
      `);
    }
    
    // ── Get settings ──
    let settings = await Settings.findOne();
    if (!settings) {
      settings = { 
        shopName: 'Saad bin Shalwah', 
        currency: 'SAR', 
        shopAddress: '',
        shopPhone: '',
        shopEmail: ''
      };
    }
    
    // ── Generate QR Code ──
    const backendUrl = process.env.BACKEND_URL || 'https://saad-bin-shalwah-management-backend.vercel.app';
    const qrDataUrl = await generateQrForBill(bill, backendUrl);
    
    // ── Generate HTML with QR ──
    const html = generateBillHTML(bill, {
      shopName: settings.shopName || 'Saad bin Shalwah',
      shopAddress: settings.shopAddress || '',
      shopPhone: settings.shopPhone || '',
      shopEmail: settings.shopEmail || '',
      currency: settings.currency || 'SAR',
      thankYouMessage: settings.thankYouMessage || 'Thank you for your business!'
    }, qrDataUrl);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Public Bill Error:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family:Arial;text-align:center;padding:50px;">
        <h2>❌ Error loading bill</h2>
        <p>${err.message}</p>
      </body>
      </html>
    `);
  }
});

module.exports = router;