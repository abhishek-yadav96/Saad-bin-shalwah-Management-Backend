const nodemailer = require('nodemailer');
const moment = require('moment');

const getTransporter = (settings) => {
  const config = {
    host: settings.smtpHost || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: settings.smtpPort || parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: settings.smtpUser || process.env.EMAIL_USER,
      pass: settings.smtpPass || process.env.EMAIL_PASS,
    }
  };
  return nodemailer.createTransporter(config);
};

const sendBillEmail = async (bill, pdfBuffer, settings) => {
  try {
    const transporter = getTransporter(settings);
    const fromEmail = settings.smtpUser || process.env.EMAIL_USER;
    
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2c3e50; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">${settings.shopName}</h1>
          <p style="color: #bdc3c7; margin: 5px 0 0;">${settings.shopAddress}</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd;">
          <p>Dear <strong>${bill.customerName}</strong>,</p>
          <p>Thank you for choosing <strong>${settings.shopName}</strong>. Please find your bill attached to this email.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td><strong>Bill Number:</strong></td><td>${bill.billNumber}</td></tr>
              <tr><td><strong>Date:</strong></td><td>${moment(bill.billDate).format('DD MMM YYYY')}</td></tr>
              <tr><td><strong>Total Amount:</strong></td><td><strong>${settings.currency} ${bill.total.toFixed(2)}</strong></td></tr>
              <tr><td><strong>Advance Paid:</strong></td><td>${settings.currency} ${bill.advancePaid.toFixed(2)}</td></tr>
              <tr><td><strong>Remaining:</strong></td><td style="color: #e74c3c;"><strong>${settings.currency} ${bill.remaining.toFixed(2)}</strong></td></tr>
            </table>
          </div>
          
          <p>You can also view your bill digitally by scanning the QR code on your bill receipt, or clicking the link below:</p>
          <p><a href="${process.env.FRONTEND_URL}/bill/${bill._id}" 
               style="background: #2c3e50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Digital Bill
          </a></p>
          
          <p style="margin-top: 20px; color: #666; font-style: italic;">${settings.thankYouMessage || 'Thank you for your business!'}</p>
        </div>
        <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 8px 8px;">
          <p>📞 ${settings.shopPhone || ''} | ✉️ ${settings.shopEmail || fromEmail}</p>
          <p>${settings.shopAddress}</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${settings.shopName}" <${fromEmail}>`,
      to: bill.customerEmail || '',
      subject: `Your Bill from ${settings.shopName} — Bill #${bill.billNumber}`,
      html: emailHTML,
      attachments: [{
        filename: `Bill_${bill.billNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendBillEmail };