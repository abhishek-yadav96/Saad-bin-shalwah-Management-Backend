const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ============================================
// 🔧 CORS
// ============================================
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// 🗄️ DB CONNECTION - VERCEL SAFE (Cached)
// ============================================
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn; // ✅ Already connected, reuse karo

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,        // ⚠️ Vercel ke liye must
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  }

  cached.conn = await cached.promise;
  console.log('✅ MongoDB Connected:', mongoose.connection.db.databaseName);
  return cached.conn;
}

// ============================================
// 🔌 MIDDLEWARE - Har request se pehle DB connect
// ============================================
app.use(async (req, res, next) => {
  try {
    await dbConnect(); // ✅ Yahi fix hai — await karta hai
    next();
  } catch (err) {
    console.error('❌ DB Connection Failed:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// ============================================
// 🚀 ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/bill', require('./routes/publicBill'));

// ============================================
// 🏠 HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };

  res.json({
    status: 'OK',
    mongodb: dbStatus[dbState],
    mongodb_ready: dbState === 1,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Al Noor Saad bin shalwah API', version: '1.0.0' });
});

// ============================================
// ❌ ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ============================================
// ✅ EXPORT FOR VERCEL
// ============================================
module.exports = app;