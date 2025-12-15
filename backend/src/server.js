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
// Limit requests to 100 per 15 minutes per IP
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

// --- 4. BODY PARSER (Size Limits) ---
// Global limit is small (10kb) to prevent overflow attacks
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- 5. DATA SANITIZATION ---
app.use(xss()); // Cleans user input from malicious HTML/Scripts
app.use(hpp()); // Prevents HTTP Parameter Pollution

app.use(morgan('dev'));

// --- SPECIAL ROUTE FOR LARGE UPLOADS (e.g. Student Registration Photos) ---
// We apply a larger limit ONLY to specific routes
const largeUploadHandler = express.json({ limit: '50mb' });

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.send({ 
    status: 'Active', 
    system: 'Merit School Portal API v2.1', 
    timestamp: new Date().toISOString() 
  });
});

// --- API Routes ---
app.use('/api/schmngt', adminRoutes);

// Apply large upload limit to student/staff registration only
app.use('/api/auth/student/register', largeUploadHandler, authRoutes); 
app.use('/api/students/register', largeUploadHandler, studentRoutes);
app.use('/api/staff/register', largeUploadHandler, staffRoutes);

// Standard routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes); // Other student routes
app.use('/api/staff', staffRoutes);      // Other staff routes
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
  console.log(`🛡️  Rate Limiting & XSS Protection Active`);
  console.log(`==================================================\n`);
});
