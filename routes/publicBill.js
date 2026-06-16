const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Settings = require('../models/Settings');
const { generateBillHTML } = require('../utils/pdfGenerator');

// Public bill view - no auth needed (for QR scan)
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('customer', 'name phone city');
    if (!bill) return res.status(404).send('<h2>Bill not found</h2>');
    
    let settings = await Settings.findOne();
    if (!settings) settings = { shopName: 'Saad bin shalwah', currency: 'AED', shopAddress: '' };
    
    const html = generateBillHTML(bill, {
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      shopPhone: settings.shopPhone,
      shopEmail: settings.shopEmail,
      shopLogo: settings.shopLogo,
      currency: settings.currency || 'AED',
      thankYouMessage: settings.thankYouMessage
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('<h2>Error loading bill: ' + err.message + '</h2>');
  }
});

module.exports = router;