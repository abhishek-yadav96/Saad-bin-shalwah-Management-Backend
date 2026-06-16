const express = require('express');
const cors = require('cors');
const app = express();

// Simple CORS
app.use(cors());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is live!',
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is working!',
    endpoints: {
      health: '/api/health'
    }
  });
});

// Export for Vercel
module.exports = app;

// Local run
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors({
//   origin: ['http://localhost:3000', process.env.FRONTEND_URL],
//   credentials: true
// }));
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Database Connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('✅ MongoDB Connected'))
// .catch(err => console.error('❌ MongoDB Error:', err));

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/customers', require('./routes/customers'));
// app.use('/api/bills', require('./routes/bills'));
// app.use('/api/products', require('./routes/products'));
// app.use('/api/reports', require('./routes/reports'));
// app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/settings', require('./routes/settings'));

// // Public bill route (no auth needed for QR scan)
// app.use('/bill', require('./routes/publicBill'));

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Saad bin shalwah API Running' });
// });

// // Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
// });

// const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on http://localhost:${PORT}`);
// //   console.log(`📧 Email: ${process.env.EMAIL_USER}`);
// //   console.log(`🏪 Shop: ${process.env.SHOP_NAME}`);
// // });
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
//   console.log(`📧 Email: ${process.env.EMAIL_USER}`);
//   console.log(`🏪 Shop: ${process.env.SHOP_NAME}`);
// });