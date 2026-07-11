const moment = require('moment');
const QRCode = require('qrcode');

// ── FIX #23: QR ab hamesha BACKEND url ko encode karta hai (frontend nahi) ──
// backendBaseUrl example: https://your-api.vercel.app
async function generateQrForBill(bill, backendBaseUrl) {
  const url = `${backendBaseUrl}/bill/${bill._id}`;
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  return qrDataUrl;
}

function measurementBlockHTML(m) {
  if (!m) return '';
  const shirtRows = (m.type || []).includes('Shirt') ? `
    <tr><td colspan="4"><strong>Shirt Measurement</strong></td></tr>
    <tr>
      <td>Length: ${m.length ?? '-'}</td><td>Chest: ${m.chest ?? '-'}</td>
      <td>Shoulder: ${m.shoulder ?? '-'}</td><td>Arm: ${m.arm ?? '-'}</td>
    </tr>
    <tr>
      <td>Middle: ${m.middle ?? '-'}</td><td>K.Back: ${m.kback ?? '-'}</td>
      <td>Neck: ${m.neck ?? '-'}</td><td>Head: ${m.head ?? '-'}</td>
    </tr>` : '';

  const trouserRows = (m.type || []).includes('Trousers') ? `
    <tr><td colspan="4"><strong>Trouser Measurement</strong></td></tr>
    <tr>
      <td>Length: ${m.pantLength ?? '-'}</td><td>Waist: ${m.waist ?? '-'}</td>
      <td>Hip: ${m.hip ?? '-'}</td><td>Thigh: ${m.thigh ?? '-'}</td>
    </tr>
    <tr>
      <td>Knee: ${m.knee ?? '-'}</td><td>Bottom: ${m.bottom ?? '-'}</td>
      <td>Round: ${m.round ?? '-'}</td><td></td>
    </tr>` : '';

  return `
    <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:10px;" border="1" cellpadding="4">
      ${shirtRows}
      ${trouserRows}
    </table>`;
}

function generateBillHTML(bill, shopSettings, qrDataUrl) {
  const showMeasurements = bill.copyLabel === 'Tailor/Cutting Copy' || bill.copyLabel === 'Shop Copy';

  // NOTE: purchasePrice is intentionally never read/rendered here — customer must never see it.
  const itemsRows = bill.items.map((it) => `
    <tr>
      <td>${it.description}</td>
      <td style="text-align:center;">${it.quantity}</td>
      <td style="text-align:right;">${shopSettings.currency} ${it.price.toFixed(2)}</td>
      <td style="text-align:right;">${shopSettings.currency} ${it.total.toFixed(2)}</td>
    </tr>`).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Bill ${bill.billNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
      .header { text-align:center; border-bottom:2px solid #2c3e50; padding-bottom:10px; margin-bottom:15px; }
      .meta { font-size:13px; margin-bottom:10px; }
      .meta td { padding: 2px 8px 2px 0; }
      table.items { width:100%; border-collapse:collapse; font-size:13px; margin-top:10px; }
      table.items th, table.items td { border:1px solid #ccc; padding:6px; }
      .totals { margin-top:10px; float:right; width:260px; font-size:13px; }
      .totals td { padding:3px 6px; }
      .copy-label { text-align:center; font-weight:bold; background:#2c3e50; color:#fff; padding:4px; margin-bottom:10px; }
      .qr-block { text-align:center; margin-top:30px; clear:both; }
      .qr-block img { width:120px; height:120px; }
    </style>
  </head>
  <body>
    <div class="copy-label">${bill.copyLabel || 'Bill'}</div>
    <div class="header">
      <h2>${shopSettings.shopName}</h2>
      <div>${shopSettings.shopAddress || ''}</div>
      <div>${shopSettings.shopPhone || ''}</div>
    </div>

    <table class="meta">
      <tr>
        <td><strong>Bill No:</strong> ${bill.billNumber}</td>
        <td><strong>Order No:</strong> ${bill.orderNumber || '-'}</td>
      </tr>
      <tr>
        <td><strong>Date:</strong> ${moment(bill.billDate).format('DD MMM YYYY')}</td>
        <td><strong>Time:</strong> ${moment(bill.billDate).format('hh:mm A')}</td>
      </tr>
      <tr>
        <td><strong>Customer:</strong> ${bill.customerName}</td>
        <td><strong>Mobile:</strong> ${bill.customerPhone || '-'}</td>
      </tr>
    </table>

    <table class="items">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="totals">
      <table style="width:100%;">
        <tr><td>Subtotal</td><td style="text-align:right;">${shopSettings.currency} ${bill.subtotal.toFixed(2)}</td></tr>
        ${bill.vatPercent ? `<tr><td>VAT (${bill.vatPercent}%)</td><td style="text-align:right;">${shopSettings.currency} ${bill.vatAmount.toFixed(2)}</td></tr>` : ''}
        <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${shopSettings.currency} ${bill.total.toFixed(2)}</strong></td></tr>
        <tr><td>Advance Paid</td><td style="text-align:right;">${shopSettings.currency} ${bill.advancePaid.toFixed(2)}</td></tr>
        <tr><td>Remaining</td><td style="text-align:right; color:#e74c3c;"><strong>${shopSettings.currency} ${bill.remaining.toFixed(2)}</strong></td></tr>
      </table>
    </div>

    ${showMeasurements ? measurementBlockHTML(bill.measurementSnapshot) : ''}

    <div class="qr-block">
      <img src="${qrDataUrl}" alt="Scan for digital bill" />
      <div style="font-size:11px; color:#666;">Scan to view this bill online</div>
    </div>

    <p style="text-align:center; margin-top:20px; font-style:italic; font-size:12px;">
      ${shopSettings.thankYouMessage || 'Thank you for your business!'}
    </p>
  </body>
  </html>`;
}

module.exports = { generateBillHTML, generateQrForBill };
