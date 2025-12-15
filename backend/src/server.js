const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

// Load environment variables
dotenv.config();

// Import Route Handlers
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const parentRoutes = require('./routes/parentRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const resultRoutes = require('./routes/resultRoutes'); 
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();

// --- 1. GLOBAL SECURITY HEADERS (Helmet) ---
app.use(helmet());

// --- 2. RATE LIMITING (DoS Protection) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// --- 3. CORS (Strict Access) ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 4. DYNAMIC BODY PARSER (THE FIX) ---
// This replaces the global 10kb limit. 
// It allows 50mb ONLY for registration routes, and 10kb for everything else.
const dynamicBodyParser = (req, res, next) => {
  // Check if the URL is for registration (Student, Staff, or Auth)
  const isRegistration = req.path.includes('/register');
  
  const limit = isRegistration ? '50mb' : '10kb';
  
  express.json({ limit })(req, res, next);
};

const dynamicUrlParser = (req, res, next) => {
  const isRegistration = req.path.includes('/register');
  const limit = isRegistration ? '50mb' : '10kb';
  express.urlencoded({ extended: true, limit })(req, res, next);
};

app.use(dynamicBodyParser);
app.use(dynamicUrlParser);

// --- 5. DATA SANITIZATION ---
app.use(xss()); 
app.use(hpp()); 

app.use(morgan('dev'));

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.send({ 
    status: 'Active', 
    system: 'Merit School Portal API v2.1', 
    timestamp: new Date().toISOString() 
  });
});

// --- API Routes ---
// Note: We removed the "Special Route" blocks because the Dynamic Parser above handles it automatically.
// This prevents the "404 Route Mismatch" errors.

app.use('/api/schmngt', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({ 
    error: true, 
    message: errorMessage 
  });
});

// --- Server Start ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SERVER RUNNING (SECURE MODE)`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'Development'}`);
  console.log(`🛡️  Rate Limiting, XSS & Dynamic Upload Limits Active`);
  console.log(`==================================================\n`);
});
