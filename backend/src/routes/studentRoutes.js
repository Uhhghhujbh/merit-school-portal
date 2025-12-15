const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');

// Registration
router.post('/register', authController.registerStudent);

// Profile & Data
router.get('/profile/:id', studentController.getStudentProfile);
router.get('/announcements', studentController.getAnnouncements);

// Payment Verification
router.post('/verify-payment', studentController.verifyPayment);
router.post('/manual-payment', studentController.submitManualPayment); // Added Route

// NEW FEES ROUTE
router.get('/fees', studentController.getSchoolFees);

module.exports = router;
