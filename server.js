const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ============================================
// 📁 UPLOADS FOLDER
// ============================================
const uploadPath = process.env.UPLOAD_PATH || './uploads';
const uploadDir = path.join(__dirname, uploadPath);

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Uploads folder created');
  }
} catch (err) {
  console.warn('⚠️ Could not create uploads folder:', err.message);
}

// ============================================
// 🔧 CORS - SAB ALLOW
// ============================================
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

// ============================================
// 🗄️ DATABASE CONNECTION - WITH LOGS
// ============================================
console.log('🔍 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB Connected to Atlas');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    console.error('❌ Please check:');
    console.error('   1. MONGODB_URI is correct');
    console.error('   2. IP whitelist has 0.0.0.0/0');
    console.error('   3. Username/password are correct');
  });
} else {
  console.error('❌ MONGODB_URI not set in environment variables!');
}

// ============================================
// 🚀 ROUTES
// ============================================
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/customers', require('./routes/customers'));
  app.use('/api/bills', require('./routes/bills'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/reports', require('./routes/reports'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/bill', require('./routes/publicBill'));
} catch (err) {
  console.error('❌ Route Error:', err.message);
}

// ============================================
// 🏠 HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({
    status: 'OK',
    message: 'Saad bin shalwah API Running',
    mongodb: dbStatus[dbState] || 'Unknown',
    mongodb_ready: dbState === 1,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Al Noor Saad bin shalwah API',
    version: '1.0.0',
    shop: process.env.SHOP_NAME || 'Al Noor Saad bin shalwah',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      customers: '/api/customers',
      bills: '/api/bills',
      products: '/api/products'
    }
  });
});

// ============================================
// ❌ ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ============================================
// ✅ EXPORT FOR VERCEL
// ============================================
module.exports = app;
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