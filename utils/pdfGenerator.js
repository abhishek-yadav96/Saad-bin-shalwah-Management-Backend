const moment = require('moment');

const generateBillHTML = (bill, settings) => {
  const itemRows = bill.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${settings.currency} ${item.price.toFixed(2)}</td>
      <td style="text-align:right">${settings.currency} ${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #333; background: white; }
        .bill-container { max-width: 800px; margin: 0 auto; padding: 30px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #2c3e50; }
        .shop-info h1 { font-size: 24px; color: #2c3e50; margin-bottom: 5px; }
        .shop-info p { color: #666; font-size: 12px; line-height: 1.6; }
        .bill-info { text-align: right; }
        .bill-info h2 { font-size: 20px; color: #2c3e50; margin-bottom: 8px; }
        .bill-info p { font-size: 12px; color: #555; line-height: 1.8; }
        .customer-section { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .customer-section h3 { color: #2c3e50; margin-bottom: 10px; font-size: 14px; }
        .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .customer-item { font-size: 12px; }
        .customer-item strong { color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead { background: #2c3e50; color: white; }
        thead th { padding: 10px 12px; text-align: left; font-size: 12px; }
        tbody tr { border-bottom: 1px solid #eee; }
        tbody tr:nth-child(even) { background: #f9f9f9; }
        tbody td { padding: 9px 12px; font-size: 12px; }
        .totals { margin-left: auto; width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #eee; }
        .total-row.grand { font-weight: bold; font-size: 15px; color: #2c3e50; border-top: 2px solid #2c3e50; border-bottom: none; padding-top: 10px; }
        .total-row.remaining-row { color: #e74c3c; font-weight: bold; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .qr-section { text-align: center; }
        .qr-section img { width: 100px; height: 100px; }
        .qr-section p { font-size: 10px; color: #999; margin-top: 4px; }
        .thank-you { flex: 1; text-align: center; color: #666; font-style: italic; font-size: 12px; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
        .paid { background: #d4edda; color: #155724; }
        .pending { background: #fff3cd; color: #856404; }
        .partial { background: #cce5ff; color: #004085; }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          <div class="shop-info">
            ${settings.shopLogo ? `<img src="${settings.shopLogo}" style="height:60px;margin-bottom:8px;"><br>` : ''}
            <h1>${settings.shopName}</h1>
            <p>${settings.shopAddress}</p>
            <p>📞 ${settings.shopPhone || ''}</p>
            <p>✉️ ${settings.shopEmail || ''}</p>
          </div>
          <div class="bill-info">
            <h2>INVOICE</h2>
            <p><strong>Bill #:</strong> ${bill.billNumber}</p>
            <p><strong>Date:</strong> ${moment(bill.billDate).format('DD MMM YYYY')}</p>
            <p><strong>Status:</strong> 
              <span class="status-badge ${bill.status}">${bill.status.toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div class="customer-section">
          <h3>📋 Customer Details</h3>
          <div class="customer-grid">
            <div class="customer-item"><strong>Name:</strong> ${bill.customerName}</div>
            <div class="customer-item"><strong>Phone:</strong> ${bill.customerPhone || '-'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${settings.currency} ${bill.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>VAT (${bill.vatPercent}%)</span>
            <span>${settings.currency} ${bill.vatAmount.toFixed(2)}</span>
          </div>
          <div class="total-row grand">
            <span>Grand Total</span>
            <span>${settings.currency} ${bill.total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Advance Paid</span>
            <span>${settings.currency} ${bill.advancePaid.toFixed(2)}</span>
          </div>
          <div class="total-row remaining-row">
            <span>Remaining</span>
            <span>${settings.currency} ${bill.remaining.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <div class="thank-you">
            <p>🙏 ${settings.thankYouMessage || 'Thank you for your business!'}</p>
          </div>
          <div class="qr-section">
            ${bill.qrCode ? `<img src="${bill.qrCode}" alt="QR Code">` : ''}
            <p>Scan to view bill</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ NO puppeteer - Return HTML only
const generatePDF = async (bill, settings) => {
  return generateBillHTML(bill, settings);
};

module.exports = { generatePDF, generateBillHTML };



// const puppeteer = require('puppeteer');
// const moment = require('moment');

// const generateBillHTML = (bill, settings) => {
//   const itemRows = bill.items.map(item => `
//     <tr>
//       <td>${item.description}</td>
//       <td style="text-align:center">${item.quantity}</td>
//       <td style="text-align:right">${settings.currency} ${item.price.toFixed(2)}</td>
//       <td style="text-align:right">${settings.currency} ${item.total.toFixed(2)}</td>
//     </tr>
//   `).join('');

//   return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="UTF-8">
//       <style>
//         * { margin: 0; padding: 0; box-sizing: border-box; }
//         body { font-family: Arial, sans-serif; font-size: 13px; color: #333; background: white; }
//         .bill-container { max-width: 800px; margin: 0 auto; padding: 30px; }
//         .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #2c3e50; }
//         .shop-info h1 { font-size: 24px; color: #2c3e50; margin-bottom: 5px; }
//         .shop-info p { color: #666; font-size: 12px; line-height: 1.6; }
//         .bill-info { text-align: right; }
//         .bill-info h2 { font-size: 20px; color: #2c3e50; margin-bottom: 8px; }
//         .bill-info p { font-size: 12px; color: #555; line-height: 1.8; }
//         .customer-section { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
//         .customer-section h3 { color: #2c3e50; margin-bottom: 10px; font-size: 14px; }
//         .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
//         .customer-item { font-size: 12px; }
//         .customer-item strong { color: #555; }
//         table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
//         thead { background: #2c3e50; color: white; }
//         thead th { padding: 10px 12px; text-align: left; font-size: 12px; }
//         tbody tr { border-bottom: 1px solid #eee; }
//         tbody tr:nth-child(even) { background: #f9f9f9; }
//         tbody td { padding: 9px 12px; font-size: 12px; }
//         .totals { margin-left: auto; width: 280px; }
//         .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #eee; }
//         .total-row.grand { font-weight: bold; font-size: 15px; color: #2c3e50; border-top: 2px solid #2c3e50; border-bottom: none; padding-top: 10px; }
//         .total-row.remaining-row { color: #e74c3c; font-weight: bold; }
//         .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
//         .qr-section { text-align: center; }
//         .qr-section img { width: 100px; height: 100px; }
//         .qr-section p { font-size: 10px; color: #999; margin-top: 4px; }
//         .thank-you { flex: 1; text-align: center; color: #666; font-style: italic; font-size: 12px; }
//         .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
//         .paid { background: #d4edda; color: #155724; }
//         .pending { background: #fff3cd; color: #856404; }
//         .partial { background: #cce5ff; color: #004085; }
//       </style>
//     </head>
//     <body>
//       <div class="bill-container">
//         <div class="header">
//           <div class="shop-info">
//             ${settings.shopLogo ? `<img src="${settings.shopLogo}" style="height:60px;margin-bottom:8px;"><br>` : ''}
//             <h1>${settings.shopName}</h1>
//             <p>${settings.shopAddress}</p>
//             <p>📞 ${settings.shopPhone || ''}</p>
//             <p>✉️ ${settings.shopEmail || ''}</p>
//           </div>
//           <div class="bill-info">
//             <h2>INVOICE</h2>
//             <p><strong>Bill #:</strong> ${bill.billNumber}</p>
//             <p><strong>Date:</strong> ${moment(bill.billDate).format('DD MMM YYYY')}</p>
//             <p><strong>Status:</strong> 
//               <span class="status-badge ${bill.status}">${bill.status.toUpperCase()}</span>
//             </p>
//           </div>
//         </div>

//         <div class="customer-section">
//           <h3>📋 Customer Details</h3>
//           <div class="customer-grid">
//             <div class="customer-item"><strong>Name:</strong> ${bill.customerName}</div>
//             <div class="customer-item"><strong>Phone:</strong> ${bill.customerPhone || '-'}</div>
//           </div>
//         </div>

//         <table>
//           <thead>
//             <tr>
//               <th>Description</th>
//               <th style="text-align:center">Qty</th>
//               <th style="text-align:right">Price</th>
//               <th style="text-align:right">Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${itemRows}
//           </tbody>
//         </table>

//         <div class="totals">
//           <div class="total-row">
//             <span>Subtotal</span>
//             <span>${settings.currency} ${bill.subtotal.toFixed(2)}</span>
//           </div>
//           <div class="total-row">
//             <span>VAT (${bill.vatPercent}%)</span>
//             <span>${settings.currency} ${bill.vatAmount.toFixed(2)}</span>
//           </div>
//           <div class="total-row grand">
//             <span>Grand Total</span>
//             <span>${settings.currency} ${bill.total.toFixed(2)}</span>
//           </div>
//           <div class="total-row">
//             <span>Advance Paid</span>
//             <span>${settings.currency} ${bill.advancePaid.toFixed(2)}</span>
//           </div>
//           <div class="total-row remaining-row">
//             <span>Remaining</span>
//             <span>${settings.currency} ${bill.remaining.toFixed(2)}</span>
//           </div>
//         </div>

//         <div class="footer">
//           <div class="thank-you">
//             <p>🙏 ${settings.thankYouMessage || 'Thank you for your business!'}</p>
//           </div>
//           <div class="qr-section">
//             ${bill.qrCode ? `<img src="${bill.qrCode}" alt="QR Code">` : ''}
//             <p>Scan to view bill</p>
//           </div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;
// };

// const generatePDF = async (bill, settings) => {
//   let browser;
//   try {
//     browser = await puppeteer.launch({
//       headless: 'new',
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
//     });
//     const page = await browser.newPage();
//     const html = generateBillHTML(bill, settings);
//     await page.setContent(html, { waitUntil: 'networkidle0' });
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
//     });
//     return pdfBuffer;
//   } finally {
//     if (browser) await browser.close();
//   }
// };

// module.exports = { generatePDF, generateBillHTML };
