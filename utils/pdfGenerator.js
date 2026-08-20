// const moment = require('moment');
// const QRCode = require('qrcode');

// // ── Generate QR Code for Bill ──
// async function generateQrForBill(bill, backendBaseUrl) {
//   try {
//     const url = `${backendBaseUrl}/bill/${bill._id}`;
//     const qrDataUrl = await QRCode.toDataURL(url, { 
//       margin: 2, 
//       width: 300,
//       errorCorrectionLevel: 'H'
//     });
//     return qrDataUrl;
//   } catch (error) {
//     console.error('QR Generation Error:', error);
//     return null;
//   }
// }

// // function measurementBlockHTML(m) {
// //   if (!m) return '';
  
// //   let types = [];
// //   if (m.type) {
// //     if (Array.isArray(m.type)) {
// //       types = m.type;
// //     } else if (typeof m.type === 'string') {
// //       types = [m.type];
// //     }
// //   }
  
// //   const hasShirt = types.includes('Shirt');
// //   const hasTrousers = types.includes('Trousers');

// //   let html = '';
  
// //   if (hasShirt) {
// //     html += `
// //     <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">SHIRT MEASUREMENTS</td></tr>
// //     <tr>
// //       <td>Length: ${m.length ?? '-'}</td>
// //       <td>Chest: ${m.chest ?? '-'}</td>
// //       <td>Shoulder: ${m.shoulder ?? '-'}</td>
// //       <td>Sleeve: ${m.arm ?? '-'}</td>
// //     </tr>
// //     <tr>
// //       <td>Middle: ${m.middle ?? '-'}</td>
// //       <td>K.Back: ${m.kback ?? '-'}</td>
// //       <td>Neck: ${m.neck ?? '-'}</td>
// //       <td>Head: ${m.head ?? '-'}</td>
// //     </tr>`;
// //   }

// //   if (hasTrousers) {
// //     html += `
// //     <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">TROUSER MEASUREMENTS</td></tr>
// //     <tr>
// //       <td>Length: ${m.pantLength ?? '-'}</td>
// //       <td>Waist: ${m.waist ?? '-'}</td>
// //       <td>Hip: ${m.hip ?? '-'}</td>
// //       <td>Thigh: ${m.thigh ?? '-'}</td>
// //     </tr>
// //     <tr>
// //       <td>Knee: ${m.knee ?? '-'}</td>
// //       <td>Bottom: ${m.bottom ?? '-'}</td>
// //       <td>Round: ${m.round ?? '-'}</td>
// //       <td></td>
// //     </tr>`;
// //   }

// //   return html ? `
// //     <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:10px;" border="1" cellpadding="4">
// //       ${html}
// //     </table>` : '';
// // }
// function measurementBlockHTML(m) {
//   if (!m) return '';
  
//   let types = [];
//   if (m.type) {
//     if (Array.isArray(m.type)) types = m.type;
//     else if (typeof m.type === 'string') types = [m.type];
//   }
  
//   const hasShirt = types.includes('Shirt');
//   const hasTrousers = types.includes('Trousers');

//   let html = '';
  
//   // ── Cloth Label ──
//   if (m.clothLabel) {
//     html += `<div style="margin-bottom:6px; font-weight:bold;">Cloth Label: ${m.clothLabel}${m.clothLabelOther ? ' ('+m.clothLabelOther+')' : ''}</div>`;
//   }
  
//   // ── Shirt Style ──
//   function shirtStyle(m) {
//     const styles = [];
//     if (m.pocketStyle) styles.push(`Pocket: ${m.pocketStyle}`);
//     if (m.pocketCut) styles.push(`Cut: ${m.pocketCut}`);
//     if (m.mobilePocket) styles.push(`Mobile: ${m.mobilePocket}`);
//     if (m.pocketClosure) styles.push(`Closure: ${m.pocketClosure}`);
//     if (m.frontStyle) styles.push(`Front: ${m.frontStyle}`);
//     if (m.nameEmbroidery) styles.push(`Embroidery: ${m.nameEmbroidery}`);
//     if (m.buttonSize) styles.push(`Button: ${m.buttonSize}`);
//     if (m.cuffStyle) styles.push(`Cuff: ${m.cuffStyle}`);
//     if (m.pleats) styles.push(`Pleats: ${m.pleats}`);
//     if (m.chestStyle) styles.push(`Chest: ${m.chestStyle}`);
//     if (m.napel) styles.push(`Napel: ${m.napel}`);
//     if (styles.length === 0) return '';
//     return `<div style="margin-top:4px; font-size:11px; color:#555;"><strong>Shirt Style:</strong> ${styles.join(' | ')}</div>`;
//   }
  
//   function pantStyle(m) {
//     const styles = [];
//     if (m.pantWaistStyle) styles.push(`Waist: ${m.pantWaistStyle}`);
//     if (m.pantBottomStyle) styles.push(`Bottom: ${m.pantBottomStyle}`);
//     if (m.pantPocketStyle) styles.push(`Pocket: ${m.pantPocketStyle}`);
//     if (styles.length === 0) return '';
//     return `<div style="margin-top:4px; font-size:11px; color:#555;"><strong>Pant Style:</strong> ${styles.join(' | ')}</div>`;
//   }
  
//   if (hasShirt) {
//     html += `
//     <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="4">
//       <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">SHIRT MEASUREMENTS</td></tr>
//       <tr>
//         <td>Length: ${m.length ?? '-'}</td>
//         <td>Chest: ${m.chest ?? '-'}</td>
//         <td>Shoulder: ${m.shoulder ?? '-'}</td>
//         <td>Sleeve: ${m.arm ?? '-'}</td>
//       </tr>
//       <tr>
//         <td>Middle: ${m.middle ?? '-'}</td>
//         <td>K.Back: ${m.kback ?? '-'}</td>
//         <td>Neck: ${m.neck ?? '-'}</td>
//         <td>Head: ${m.head ?? '-'}</td>
//       </tr>
//     </table>
//     ${shirtStyle(m)}`;
//   }

//   if (hasTrousers) {
//     html += `
//     <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="4">
//       <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">TROUSER MEASUREMENTS</td></tr>
//       <tr>
//         <td>Length: ${m.pantLength ?? '-'}</td>
//         <td>Waist: ${m.waist ?? '-'}</td>
//         <td>Hip: ${m.hip ?? '-'}</td>
//         <td>Thigh: ${m.thigh ?? '-'}</td>
//       </tr>
//       <tr>
//         <td>Knee: ${m.knee ?? '-'}</td>
//         <td>Bottom: ${m.bottom ?? '-'}</td>
//         <td>Round: ${m.round ?? '-'}</td>
//         <td></td>
//       </tr>
//     </table>
//     ${pantStyle(m)}`;
//   }

//   return html;
// }

// function generateBillHTML(bill, shopSettings, qrDataUrl) {
//   const showMeasurements = true;
//   const snap = bill.measurementSnapshot || {};

//   // ── Calculate extra items total ──
//   let extraTotal = 0;
//   if (snap.extraItems && snap.extraItems.length > 0) {
//     for (const item of snap.extraItems) {
//       const price = item.sellPrice || 0;
//       const qty = item.quantity || 1;
//       extraTotal += price * qty;
//     }
//   }

//   const grandTotal = (bill.total || 0) + extraTotal;
//   const remaining = grandTotal - (bill.advancePaid || 0);

//   let itemsRows = bill.items.map((it) => `
//     <tr>
//       <td>${it.description}</td>
//       <td style="text-align:center;">${it.quantity}</td>
//       <td style="text-align:right;">${shopSettings.currency} ${it.price.toFixed(2)}</td>
//       <td style="text-align:right;">${shopSettings.currency} ${it.total.toFixed(2)}</td>
//     </tr>`).join('');

//   if (snap.extraItems && snap.extraItems.length > 0) {
//     for (const item of snap.extraItems) {
//       const price = item.sellPrice || 0;
//       const qty = item.quantity || 1;
//       const itemTotal = price * qty;
//       itemsRows += `
//         <tr>
//           <td>${item.name || 'Extra Item'}</td>
//           <td style="text-align:center;">${qty}</td>
//           <td style="text-align:right;">${shopSettings.currency} ${price.toFixed(2)}</td>
//           <td style="text-align:right;">${shopSettings.currency} ${itemTotal.toFixed(2)}</td>
//         </tr>`;
//     }
//   }

//   const qrImage = qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : '<p>QR Code unavailable</p>';

//   return `
//   <!DOCTYPE html>
//   <html>
//   <head>
//     <meta charset="utf-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Bill ${bill.billNumber}</title>
//     <style>
//       * { box-sizing: border-box; }
//       body { 
//         font-family: Arial, sans-serif; 
//         padding: 20px; 
//         color: #222; 
//         max-width: 800px; 
//         margin: 0 auto;
//         background: #f5f5f5;
//       }
//       .bill-container {
//         background: white;
//         padding: 30px;
//         border-radius: 12px;
//         box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//       }
//       .header { 
//         text-align:center; 
//         border-bottom:2px solid #2c3e50; 
//         padding-bottom:15px; 
//         margin-bottom:20px; 
//       }
//       .header h2 { 
//         margin:0; 
//         color:#2c3e50; 
//         font-size:24px;
//       }
//       .header .sub { 
//         color:#666; 
//         font-size:14px; 
//         margin-top:4px;
//       }
//       .meta { 
//         width:100%; 
//         font-size:14px; 
//         margin-bottom:15px; 
//         border-collapse:collapse;
//       }
//       .meta td { 
//         padding: 4px 8px 4px 0; 
//         border-bottom:1px solid #eee;
//       }
//       .meta .label { 
//         color:#666; 
//         font-weight:600;
//         width:100px;
//       }
//       table.items { 
//         width:100%; 
//         border-collapse:collapse; 
//         font-size:13px; 
//         margin-top:10px; 
//       }
//       table.items th { 
//         background:#2c3e50; 
//         color:white; 
//         padding:8px; 
//         text-align:left; 
//       }
//       table.items th:last-child,
//       table.items td:last-child { text-align:right; }
//       table.items td { 
//         padding:6px 8px; 
//         border-bottom:1px solid #ddd; 
//       }
//       table.items tr:last-child td { border-bottom:none; }
//       .totals { 
//         margin-top:15px; 
//         width:100%; 
//         max-width:350px; 
//         float:right; 
//         font-size:14px; 
//         border-collapse:collapse;
//       }
//       .totals td { padding:4px 8px; }
//       .totals .total-row { font-weight:bold; font-size:16px; border-top:2px solid #2c3e50; }
//       .totals .remaining { 
//         font-weight:bold; 
//         font-size:16px; 
//         color: ${remaining > 0 ? '#e74c3c' : '#27ae60'};
//         border-top:2px solid ${remaining > 0 ? '#e74c3c' : '#27ae60'};
//       }
//       .qr-block { 
//         text-align:center; 
//         margin-top:30px; 
//         clear:both; 
//         padding-top:20px;
//         border-top:1px solid #ddd;
//       }
//       .qr-block img { 
//         width:150px; 
//         height:150px; 
//         border:2px solid #2c3e50;
//         border-radius:12px;
//         padding:10px;
//         background: white;
//       }
//       .qr-label { 
//         font-size:12px; 
//         color:#666; 
//         margin-top:8px; 
//         font-weight:600;
//       }
//       .footer { 
//         text-align:center; 
//         margin-top:20px; 
//         font-style:italic; 
//         font-size:13px; 
//         color:#666; 
//       }
//       .measurement-section {
//         margin-top:15px;
//         clear:both;
//         border-top:1px solid #ddd;
//         padding-top:15px;
//       }
//       .measurement-section table {
//         width:100%;
//         font-size:12px;
//         border-collapse:collapse;
//         margin-top:8px;
//       }
//       .measurement-section table td {
//         padding:4px 8px;
//         border:1px solid #ddd;
//       }
//       .measurement-section table tr:first-child td {
//         background:#f0f0f0;
//         font-weight:bold;
//         text-align:center;
//       }
//       .clearfix { clear:both; }
//       @media print {
//         body { background:white; padding:10px; }
//         .bill-container { box-shadow:none; padding:10px; }
//         table.items th { background:#2c3e50 !important; color:white !important; }
//         .qr-block img { border:1px solid #ddd; }
//       }
//       @media (max-width: 600px) {
//         body { padding:10px; }
//         .bill-container { padding:15px; }
//         .meta td { display:block; padding:2px 0; }
//         .meta td.label { width:auto; }
//         .totals { float:none; width:100%; max-width:100%; }
//         .qr-block img { width:120px; height:120px; }
//         table.items { font-size:12px; }
//         table.items th, table.items td { padding:4px; }
//         .header h2 { font-size:20px; }
//       }
//     </style>
//   </head>
//   <body>
//     <div class="bill-container">
      
//       <div class="header">
//         <h2>${shopSettings.shopName || 'Saad bin Shalwah'}</h2>
//         <div class="sub">${shopSettings.shopAddress || ''}</div>
//         <div class="sub">${shopSettings.shopPhone || ''}</div>
//       </div>

//       <table class="meta">
//         <tr>
//           <td class="label">Bill No:</td>
//           <td><strong>${bill.billNumber}</strong></td>
//           <td class="label">Order No:</td>
//           <td><strong>${bill.orderNumber || '-'}</strong></td>
//         </tr>
//         <tr>
//           <td class="label">Date:</td>
//           <td>${moment(bill.billDate).format('DD MMM YYYY')}</td>
//           <td class="label">Time:</td>
//           <td>${moment(bill.billDate).format('hh:mm A')}</td>
//         </tr>
//         <tr>
//           <td class="label">Customer:</td>
//           <td><strong>${bill.customerName}</strong></td>
//           <td class="label">Mobile:</td>
//           <td>${bill.customerPhone || '-'}</td>
//         </tr>
//       </table>

//       <table class="items">
//         <thead>
//           <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
//         </thead>
//         <tbody>${itemsRows}</tbody>
//       </table>

//       <div style="clear:both;"></div>
      
//       <table class="totals">
//         <tr><td>Subtotal</td><td style="text-align:right;">${shopSettings.currency} ${(bill.subtotal || 0).toFixed(2)}</td></tr>
//         ${bill.vatPercent ? `<tr><td>VAT (${bill.vatPercent}%)</td><td style="text-align:right;">${shopSettings.currency} ${(bill.vatAmount || 0).toFixed(2)}</td></tr>` : ''}
//         <tr class="total-row"><td>Total</td><td style="text-align:right;">${shopSettings.currency} ${grandTotal.toFixed(2)}</td></tr>
//         <tr><td>Advance Paid</td><td style="text-align:right;">${shopSettings.currency} ${(bill.advancePaid || 0).toFixed(2)}</td></tr>
//         <tr class="remaining"><td>Remaining</td><td style="text-align:right;">${shopSettings.currency} ${remaining.toFixed(2)}</td></tr>
//       </table>

//       <div style="clear:both;"></div>

//       <!-- MEASUREMENTS SECTION (NO ICONS) -->
//       ${showMeasurements ? `
//       <div class="measurement-section">
//         <h4 style="margin:0 0 8px 0; color:#2c3e50;">Measurements</h4>
//         ${measurementBlockHTML(snap)}
        
//         ${snap.extraItems && snap.extraItems.length > 0 ? `
//         <div style="margin-top:8px; background:#f8f9fa; padding:8px; border-radius:4px;">
//           <strong>Extra Items:</strong>
//           ${snap.extraItems.map(item => `${item.name || 'Item'} (x${item.quantity || 1}) - ${shopSettings.currency} ${((item.sellPrice || 0) * (item.quantity || 1)).toFixed(2)}`).join('<br>')}
//         </div>` : ''}
        
//         <!-- Shirt Style -->
//         ${snap && (snap.pocketStyle || snap.frontStyle || snap.nameEmbroidery || snap.buttonSize || snap.cuffStyle || snap.pleats || snap.chestStyle) ? `
//         <div style="margin-top:8px; background:#f0f0f0; padding:6px 10px; border-radius:4px;">
//           <strong>Shirt Style:</strong>
//           ${[
//             snap.pocketStyle ? `Pocket: ${snap.pocketStyle}` : '',
//             snap.pocketCut ? `Cut: ${snap.pocketCut}` : '',
//             snap.mobilePocket ? `Mobile: ${snap.mobilePocket}` : '',
//             snap.pocketClosure ? `Closure: ${snap.pocketClosure}` : '',
//             snap.frontStyle ? `Front: ${snap.frontStyle}` : '',
//             snap.nameEmbroidery ? `Embroidery: ${snap.nameEmbroidery}` : '',
//             snap.buttonSize ? `Button: ${snap.buttonSize}` : '',
//             snap.cuffStyle ? `Cuff: ${snap.cuffStyle}` : '',
//             snap.pleats ? `Pleats: ${snap.pleats}` : '',
//             snap.chestStyle ? `Chest: ${snap.chestStyle}` : '',
//             snap.napel ? `Napel: ${snap.napel}` : ''
//           ].filter(Boolean).join(' | ')}
//         </div>` : ''}
        
//         <!-- Pant Style -->
//         ${snap && (snap.pantWaistStyle || snap.pantBottomStyle || snap.pantPocketStyle) ? `
//         <div style="margin-top:6px; background:#f0f0f0; padding:6px 10px; border-radius:4px;">
//           <strong>Pant Style:</strong>
//           ${[
//             snap.pantWaistStyle ? `Waist: ${snap.pantWaistStyle}` : '',
//             snap.pantBottomStyle ? `Bottom: ${snap.pantBottomStyle}` : '',
//             snap.pantPocketStyle ? `Pocket: ${snap.pantPocketStyle}` : ''
//           ].filter(Boolean).join(' | ')}
//         </div>` : ''}
        
//         <!-- Cloth Label -->
//         ${snap.clothLabel ? `
//         <div style="margin-top:6px; background:#f0f0f0; padding:6px 10px; border-radius:4px;">
//           <strong>Cloth Label:</strong> ${snap.clothLabel} ${snap.clothLabelOther ? `(${snap.clothLabelOther})` : ''}
//         </div>` : ''}
//       </div>` : ''}

//       <!-- QR CODE BLOCK (NO ICON) -->
//       <div class="qr-block">
//         ${qrImage}
//         <div class="qr-label">Scan to view this bill online</div>
//       </div>

//       <div class="footer">
//         ${shopSettings.thankYouMessage || 'Thank you for your business! We look forward to serving you again.'}
//       </div>
//     </div>
//   </body>
//   </html>`;
// }

// module.exports = { generateBillHTML, generateQrForBill };
const moment = require('moment');
const QRCode = require('qrcode');

// ── Generate QR Code for Bill ──
async function generateQrForBill(bill, backendBaseUrl) {
  try {
    const url = `${backendBaseUrl}/bill/${bill._id}`;
    const qrDataUrl = await QRCode.toDataURL(url, { 
      margin: 2, 
      width: 300,
      errorCorrectionLevel: 'H'
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Generation Error:', error);
    return null;
  }
}

function measurementBlockHTML(m) {
  if (!m) return '';
  
  let types = [];
  if (m.type) {
    if (Array.isArray(m.type)) types = m.type;
    else if (typeof m.type === 'string') types = [m.type];
  }
  
  const hasShirt = types.includes('Shirt');
  const hasTrousers = types.includes('Trousers');

  let html = '';
  
  // ── Cloth Label ──
  if (m.clothLabel) {
    html += `<div style="margin-bottom:6px; font-weight:bold;">Cloth Label: ${m.clothLabel}${m.clothLabelOther ? ' ('+m.clothLabelOther+')' : ''}</div>`;
  }
  
  // ── Shirt Style ──
  function shirtStyle(m) {
    const styles = [];
    if (m.pocketStyle) styles.push(`Pocket: ${m.pocketStyle}`);
    if (m.pocketCut) styles.push(`Cut: ${m.pocketCut}`);
    if (m.mobilePocket) styles.push(`Mobile: ${m.mobilePocket}`);
    if (m.pocketClosure) styles.push(`Closure: ${m.pocketClosure}`);
    if (m.frontStyle) styles.push(`Front: ${m.frontStyle}`);
    if (m.nameEmbroidery) styles.push(`Embroidery: ${m.nameEmbroidery}`);
    if (m.buttonSize) styles.push(`Button: ${m.buttonSize}`);
    if (m.cuffStyle) styles.push(`Cuff: ${m.cuffStyle}`);
    if (m.pleats) styles.push(`Pleats: ${m.pleats}`);
    if (m.chestStyle) styles.push(`Chest: ${m.chestStyle}`);
    if (m.napel) styles.push(`Napel: ${m.napel}`);
    if (m.kalarPoint) styles.push(`Kalar Point: ${m.kalarPoint}`);
    if (styles.length === 0) return '';
    return `<div style="margin-top:4px; font-size:11px; color:#555;"><strong>Shirt Style:</strong> ${styles.join(' | ')}</div>`;
  }
  
  function pantStyle(m) {
    const styles = [];
    if (m.pantWaistStyle) styles.push(`Waist: ${m.pantWaistStyle}`);
    if (m.pantBottomStyle) styles.push(`Bottom: ${m.pantBottomStyle}`);
    if (m.pantPocketStyle) styles.push(`Pocket: ${m.pantPocketStyle}`);
    if (styles.length === 0) return '';
    return `<div style="margin-top:4px; font-size:11px; color:#555;"><strong>Pant Style:</strong> ${styles.join(' | ')}</div>`;
  }
  
  if (hasShirt) {
    html += `
    <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="4">
      <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">SHIRT MEASUREMENTS</td></tr>
      <tr>
        <td>Length: ${m.length ?? '-'}</td>
        <td>Chest: ${m.chest ?? '-'}</td>
        <td>Shoulder: ${m.shoulder ?? '-'}</td>
        <td>Sleeve: ${m.arm ?? '-'}</td>
      </tr>
      <tr>
        <td>Middle: ${m.middle ?? '-'}</td>
        <td>K.Back: ${m.kback ?? '-'}</td>
        <td>Neck: ${m.neck ?? '-'}</td>
        <td>Head: ${m.head ?? '-'}</td>
      </tr>
    </table>
    ${shirtStyle(m)}`;
  }

  if (hasTrousers) {
    html += `
    <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="4">
      <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">TROUSER MEASUREMENTS</td></tr>
      <tr>
        <td>Length: ${m.pantLength ?? '-'}</td>
        <td>Waist: ${m.waist ?? '-'}</td>
        <td>Hip: ${m.hip ?? '-'}</td>
        <td>Thigh: ${m.thigh ?? '-'}</td>
      </tr>
      <tr>
        <td>Knee: ${m.knee ?? '-'}</td>
        <td>Bottom: ${m.bottom ?? '-'}</td>
        <td>Round: ${m.round ?? '-'}</td>
        <td></td>
      </tr>
    </table>
    ${pantStyle(m)}`;
  }

  return html;
}

function generateBillHTML(bill, shopSettings, qrDataUrl) {
  const showMeasurements = true;
  const snap = bill.measurementSnapshot || {};

  // ══════════════════════════════════════════════════════════════════
  // ── COPY TYPE DETECTION ──
  // Customer Copy  -> sirf amount/pricing, measurements HIDE
  // Tailor/Cutting Copy -> sirf measurements, amount/pricing HIDE
  // Shop Copy / Delivery Copy / (main bill, no copyLabel) -> sab kuch dikhega
  // ══════════════════════════════════════════════════════════════════
  const copyLabel = bill.copyLabel || '';
  const isCustomerCopy = copyLabel === 'Customer Copy';
  const isTailorCopy = copyLabel === 'Tailor/Cutting Copy';
  const showPricing = !isTailorCopy;       // hide pricing for tailor copy
  const showMeasurementsSection = !isCustomerCopy; // hide measurements for customer copy

  // ── Calculate extra items total ──
  let extraTotal = 0;
  if (snap.extraItems && snap.extraItems.length > 0) {
    for (const item of snap.extraItems) {
      const price = item.sellPrice || 0;
      const qty = item.quantity || 1;
      extraTotal += price * qty;
    }
  }

  const grandTotal = (bill.total || 0) + extraTotal;
  const remaining = grandTotal - (bill.advancePaid || 0);

  const dressName = bill.dressName || '';
  const deliveryDateStr = bill.deliveryDate ? moment(bill.deliveryDate).format('DD MMM YYYY') : '';

  let itemsRows = bill.items.map((it) => `
    <tr>
      <td>${it.description}</td>
      <td style="text-align:center;">${it.quantity}</td>
      <td style="text-align:right;">${shopSettings.currency} ${it.price.toFixed(2)}</td>
      <td style="text-align:right;">${shopSettings.currency} ${it.total.toFixed(2)}</td>
    </tr>`).join('');

  if (snap.extraItems && snap.extraItems.length > 0) {
    for (const item of snap.extraItems) {
      const price = item.sellPrice || 0;
      const qty = item.quantity || 1;
      const itemTotal = price * qty;
      itemsRows += `
        <tr>
          <td>${item.name || 'Extra Item'}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${shopSettings.currency} ${price.toFixed(2)}</td>
          <td style="text-align:right;">${shopSettings.currency} ${itemTotal.toFixed(2)}</td>
        </tr>`;
    }
  }

  const qrImage = qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : '<p>QR Code unavailable</p>';

  // ── Items + Totals block (hidden for Tailor/Cutting Copy) ──
  const pricingBlockHTML = showPricing ? `
      <table class="items">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <div style="clear:both;"></div>
      
      <table class="totals">
        <tr><td>Subtotal</td><td style="text-align:right;">${shopSettings.currency} ${(bill.subtotal || 0).toFixed(2)}</td></tr>
        ${bill.vatPercent ? `<tr><td>VAT (${bill.vatPercent}%)</td><td style="text-align:right;">${shopSettings.currency} ${(bill.vatAmount || 0).toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>Total</td><td style="text-align:right;">${shopSettings.currency} ${grandTotal.toFixed(2)}</td></tr>
        <tr><td>Advance Paid</td><td style="text-align:right;">${shopSettings.currency} ${(bill.advancePaid || 0).toFixed(2)}</td></tr>
        <tr class="remaining"><td>Remaining</td><td style="text-align:right;">${shopSettings.currency} ${remaining.toFixed(2)}</td></tr>
      </table>

      <div style="clear:both;"></div>` : `
      <div style="text-align:center; padding:14px 0; color:#666; font-size:12px; border-top:1px dashed #ddd; border-bottom:1px dashed #ddd; margin-top:6px;">
        Amount details not shown on this copy
      </div>`;

  // ── Shirt / Pant style line builders (reused by both layouts) ──
  function shirtStyleLine(m) {
    const parts = [
      m.pocketStyle ? `Pocket: ${m.pocketStyle}` : '',
      m.pocketCut ? `Cut: ${m.pocketCut}` : '',
      m.mobilePocket ? `Mobile: ${m.mobilePocket}` : '',
      m.pocketClosure ? `Closure: ${m.pocketClosure}` : '',
      m.frontStyle ? `Front: ${m.frontStyle}` : '',
      m.nameEmbroidery ? `Embroidery: ${m.nameEmbroidery}` : '',
      m.buttonSize ? `Button: ${m.buttonSize}` : '',
      m.cuffStyle ? `Cuff: ${m.cuffStyle}` : '',
      m.pleats ? `Pleats: ${m.pleats}` : '',
      m.chestStyle ? `Chest: ${m.chestStyle}` : '',
      m.napel ? `Napel: ${m.napel}` : '',
      m.kalarPoint ? `Kalar Point: ${m.kalarPoint}` : ''
    ].filter(Boolean).join(' | ');
    return parts ? `<div style="margin-top:4px; font-size:11px; color:#555;"><strong>Shirt Style:</strong> ${parts}</div>` : '';
  }
  function pantStyleLine(m) {
    const parts = [
      m.pantWaistStyle ? `Waist: ${m.pantWaistStyle}` : '',
      m.pantBottomStyle ? `Bottom: ${m.pantBottomStyle}` : '',
      m.pantPocketStyle ? `Pocket: ${m.pantPocketStyle}` : ''
    ].filter(Boolean).join(' | ');
    return parts ? `<div style="margin-top:4px; font-size:11px; color:#555;"><strong>Pant Style:</strong> ${parts}</div>` : '';
  }

  let types = [];
  if (snap.type) {
    if (Array.isArray(snap.type)) types = snap.type;
    else if (typeof snap.type === 'string') types = [snap.type];
  }
  const hasShirt = types.includes('Shirt');
  const hasTrousers = types.includes('Trousers');

  // ══════════════════════════════════════════════════════════════════
  // ── TAILOR/CUTTING COPY: TWO SELF-CONTAINED CUT TAGS ──
  // Har tag apne aap me complete hai (Bill#, Order#, Dress Name,
  // Delivery Date dobara print hote hain) taake tailor use fabric ke
  // shirt-piece aur pant-piece par alag alag pin/cut karke laga sake.
  // ══════════════════════════════════════════════════════════════════
  function cutTagHTML(partLabel, bodyHTML) {
    return `
      <div class="cut-tag">
        <div class="cut-tag-title">${partLabel}</div>
        <div class="id-highlight-row">
          <div class="id-highlight-box">
            <span class="id-highlight-label">ORDER NO.</span>
            <span class="id-highlight-value">${bill.orderNumber || '-'}</span>
          </div>
        </div>
        <table class="cut-tag-meta">
          <tr><td>Bill No:</td><td>${bill.billNumber}</td></tr>
          ${dressName ? `<tr><td>Dress Name:</td><td><strong>${dressName}</strong></td></tr>` : ''}
        </table>
        <div class="cut-tag-heading">MEASUREMENTS</div>
        ${bodyHTML}
        ${deliveryDateStr ? `<div class="cut-tag-delivery">Delivery Date: <strong>${deliveryDateStr}</strong></div>` : ''}
      </div>`;
  }

  function shirtTableHTML(m) {
    return `
      <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="4">
        <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">SHIRT</td></tr>
        <tr>
          <td>Length: ${m.length ?? '-'}</td>
          <td>Chest: ${m.chest ?? '-'}</td>
          <td>Shoulder: ${m.shoulder ?? '-'}</td>
          <td>Sleeve: ${m.arm ?? '-'}</td>
        </tr>
        <tr>
          <td>Middle: ${m.middle ?? '-'}</td>
          <td>K.Back: ${m.kback ?? '-'}</td>
          <td>Neck: ${m.neck ?? '-'}</td>
          <td>Head: ${m.head ?? '-'}</td>
        </tr>
      </table>
      ${shirtStyleLine(m)}`;
  }

  function pantTableHTML(m) {
    return `
      <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="4">
        <tr><td colspan="4" style="background:#f0f0f0; font-weight:bold; text-align:center;">PANT</td></tr>
        <tr>
          <td>Length: ${m.pantLength ?? '-'}</td>
          <td>Waist: ${m.waist ?? '-'}</td>
          <td>Hip: ${m.hip ?? '-'}</td>
          <td>Thigh: ${m.thigh ?? '-'}</td>
        </tr>
        <tr>
          <td>Knee: ${m.knee ?? '-'}</td>
          <td>Bottom: ${m.bottom ?? '-'}</td>
          <td>Round: ${m.round ?? '-'}</td>
          <td></td>
        </tr>
      </table>
      ${pantStyleLine(m)}`;
  }

  const clothLabelLine = snap.clothLabel
    ? `<div style="margin-bottom:6px; font-weight:bold;">Cloth Label: ${snap.clothLabel}${snap.clothLabelOther ? ' (' + snap.clothLabelOther + ')' : ''}</div>`
    : '';

  let tailorCutHTML = '';
  if (hasShirt) tailorCutHTML += cutTagHTML('✂ SHIRT PIECE — CUT HERE', clothLabelLine + shirtTableHTML(snap));
  if (hasTrousers) tailorCutHTML += cutTagHTML('✂ PANT PIECE — CUT HERE', clothLabelLine + pantTableHTML(snap));
  if (!hasShirt && !hasTrousers) {
    // Fallback: type na ho to purana continuous block dikhado
    tailorCutHTML = cutTagHTML('✂ CUT HERE', clothLabelLine + measurementBlockHTML(snap));
  }

  // ── Measurements block (hidden for Customer Copy) ──
  const measurementsBlockHTML = (showMeasurements && showMeasurementsSection) ? (
    isTailorCopy ? `
      <div class="measurement-section">
        ${tailorCutHTML}
      </div>`
      : `
      <div class="measurement-section">
        <h4 style="margin:0 0 8px 0; color:#2c3e50;">Measurements</h4>
        ${measurementBlockHTML(snap)}

        ${snap.extraItems && snap.extraItems.length > 0 ? `
        <div style="margin-top:8px; background:#f8f9fa; padding:8px; border-radius:4px;">
          <strong>Extra Items:</strong>
          ${snap.extraItems.map(item => `${item.name || 'Item'} (x${item.quantity || 1})`).join('<br>')}
        </div>` : ''}

        <!-- Shirt Style -->
        ${shirtStyleLine(snap)}

        <!-- Pant Style -->
        ${pantStyleLine(snap)}

        <!-- Cloth Label -->
        ${snap.clothLabel ? `
        <div style="margin-top:6px; background:#f0f0f0; padding:6px 10px; border-radius:4px;">
          <strong>Cloth Label:</strong> ${snap.clothLabel} ${snap.clothLabelOther ? `(${snap.clothLabelOther})` : ''}
        </div>` : ''}
      </div>`
  ) : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bill ${bill.billNumber}</title>
    <style>
      * { box-sizing: border-box; }
      body { 
        font-family: Arial, sans-serif; 
        padding: 20px; 
        color: #222; 
        max-width: 800px; 
        margin: 0 auto;
        background: #f5f5f5;
      }
      .bill-container {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header { 
        text-align:center; 
        border-bottom:2px solid #2c3e50; 
        padding-bottom:15px; 
        margin-bottom:20px; 
      }
      .header h2 { 
        margin:0; 
        color:#2c3e50; 
        font-size:24px;
      }
      .header .sub { 
        color:#666; 
        font-size:14px; 
        margin-top:4px;
      }
      .copy-label {
        display:inline-block;
        margin-top:8px;
        padding:4px 14px;
        background:#2c3e50;
        color:#fff;
        font-size:12px;
        font-weight:700;
        letter-spacing:0.5px;
        border-radius:20px;
      }
      .id-highlight-row {
        display:flex;
        gap:10px;
        margin-bottom:14px;
      }
      .id-highlight-box {
        flex:1;
        background:#fff3cd;
        border:2px solid #f59e0b;
        border-radius:8px;
        padding:6px 10px;
        text-align:center;
      }
      .id-highlight-label {
        display:block;
        font-size:10px;
        font-weight:700;
        letter-spacing:0.5px;
        color:#92400e;
      }
      .id-highlight-value {
        display:block;
        font-size:20px;
        font-weight:800;
        color:#111;
      }
      .meta {
        width:100%;
        font-size:14px;
        margin-bottom:15px;
        border-collapse:collapse;
      }
      .meta td { 
        padding: 4px 8px 4px 0; 
        border-bottom:1px solid #eee;
      }
      .meta .label { 
        color:#666; 
        font-weight:600;
        width:100px;
      }
      table.items { 
        width:100%; 
        border-collapse:collapse; 
        font-size:13px; 
        margin-top:10px; 
      }
      table.items th { 
        background:#2c3e50; 
        color:white; 
        padding:8px; 
        text-align:left; 
      }
      table.items th:last-child,
      table.items td:last-child { text-align:right; }
      table.items td { 
        padding:6px 8px; 
        border-bottom:1px solid #ddd; 
      }
      table.items tr:last-child td { border-bottom:none; }
      .totals { 
        margin-top:15px; 
        width:100%; 
        max-width:350px; 
        float:right; 
        font-size:14px; 
        border-collapse:collapse;
      }
      .totals td { padding:4px 8px; }
      .totals .total-row { font-weight:bold; font-size:16px; border-top:2px solid #2c3e50; }
      .totals .remaining { 
        font-weight:bold; 
        font-size:16px; 
        color: ${remaining > 0 ? '#e74c3c' : '#27ae60'};
        border-top:2px solid ${remaining > 0 ? '#e74c3c' : '#27ae60'};
      }
      .qr-block { 
        text-align:center; 
        margin-top:30px; 
        clear:both; 
        padding-top:20px;
        border-top:1px solid #ddd;
      }
      .qr-block img { 
        width:150px; 
        height:150px; 
        border:2px solid #2c3e50;
        border-radius:12px;
        padding:10px;
        background: white;
      }
      .qr-label { 
        font-size:12px; 
        color:#666; 
        margin-top:8px; 
        font-weight:600;
      }
      .footer { 
        text-align:center; 
        margin-top:20px; 
        font-style:italic; 
        font-size:13px; 
        color:#666; 
      }
      .measurement-section {
        margin-top:15px;
        clear:both;
        border-top:1px solid #ddd;
        padding-top:15px;
      }
      .measurement-section table {
        width:100%;
        font-size:12px;
        border-collapse:collapse;
        margin-top:8px;
      }
      .measurement-section table td {
        padding:4px 8px;
        border:1px solid #ddd;
      }
      .measurement-section table tr:first-child td {
        background:#f0f0f0;
        font-weight:bold;
        text-align:center;
      }
      .clearfix { clear:both; }
      .cut-tag {
        margin-top:10px;
        padding:10px 12px;
        border:1px dashed #888;
        border-radius:6px;
      }
      .cut-tag + .cut-tag { margin-top:18px; }
      .cut-tag-title {
        font-weight:bold;
        font-size:12px;
        text-align:center;
        letter-spacing:0.5px;
        margin-bottom:6px;
      }
      .cut-tag-meta { width:100%; font-size:12px; border-collapse:collapse; margin-bottom:6px; }
      .cut-tag-meta td { padding:1px 6px 1px 0; }
      .cut-tag-meta td:first-child { color:#666; width:80px; }
      .cut-tag-heading {
        font-weight:bold;
        font-size:11px;
        text-align:center;
        background:#f0f0f0;
        padding:3px;
        border-radius:3px;
        margin-bottom:4px;
      }
      .cut-tag-delivery {
        margin-top:8px;
        font-size:12px;
        text-align:center;
        border-top:1px dashed #ccc;
        padding-top:6px;
      }
      @media print {
        body { background:white; padding:10px; }
        .bill-container { box-shadow:none; padding:10px; }
        table.items th { background:#2c3e50 !important; color:white !important; }
        .qr-block img { border:1px solid #ddd; }
      }
      @media (max-width: 600px) {
        body { padding:10px; }
        .bill-container { padding:15px; }
        .meta td { display:block; padding:2px 0; }
        .meta td.label { width:auto; }
        .totals { float:none; width:100%; max-width:100%; }
        .qr-block img { width:120px; height:120px; }
        table.items { font-size:12px; }
        table.items th, table.items td { padding:4px; }
        .header h2 { font-size:20px; }
      }
    </style>
  </head>
  <body>
    <div class="bill-container">
      
      <div class="header">
        <h2>${shopSettings.shopName || 'Saad bin Shalwah'}</h2>
        <div class="sub">${shopSettings.shopAddress || ''}</div>
        <div class="sub">${shopSettings.shopPhone || ''}</div>
        ${copyLabel ? `<div><span class="copy-label">${copyLabel}</span></div>` : ''}
      </div>

      <div class="id-highlight-row">
        <div class="id-highlight-box">
          <span class="id-highlight-label">ORDER NO.</span>
          <span class="id-highlight-value">${bill.orderNumber || '-'}</span>
        </div>
      </div>

      <table class="meta">
        <tr>
          <td class="label">Bill No:</td>
          <td>${bill.billNumber}</td>
          <td class="label">Date:</td>
          <td>${moment(bill.billDate).format('DD MMM YYYY')}</td>
        </tr>
        <tr>
          <td class="label">Time:</td>
          <td>${moment(bill.billDate).format('hh:mm A')}</td>
          <td class="label">Mobile:</td>
          <td>${bill.customerPhone || '-'}</td>
        </tr>
        <tr>
          <td class="label">Customer:</td>
          <td colspan="3"><strong>${bill.customerName}</strong></td>
        </tr>
        ${dressName || deliveryDateStr ? `
        <tr>
          <td class="label">Dress Name:</td>
          <td><strong>${dressName || '-'}</strong></td>
          <td class="label">Delivery Date:</td>
          <td><strong>${deliveryDateStr || '-'}</strong></td>
        </tr>` : ''}
      </table>

      <!-- PRICING SECTION (hidden on Tailor/Cutting Copy) -->
      ${pricingBlockHTML}

      <!-- MEASUREMENTS SECTION (hidden on Customer Copy) -->
      ${measurementsBlockHTML}

      <!-- QR CODE BLOCK — sirf Customer Copy (ya copyLabel na ho) par, Tailor/Cutting Copy par nahi -->
      ${!isTailorCopy ? `
      <div class="qr-block">
        ${qrImage}
        <div class="qr-label">Scan to view this bill online</div>
      </div>` : ''}

      <div class="footer">
        ${shopSettings.thankYouMessage || 'Thank you for your business! We look forward to serving you again.'}
      </div>
    </div>
  </body>
  </html>`;
}

module.exports = { generateBillHTML, generateQrForBill };