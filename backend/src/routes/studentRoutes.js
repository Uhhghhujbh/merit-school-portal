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

// NEW FEES ROUTE (Fixes 404)
router.get('/fees', studentController.getSchoolFees);

module.exports = router;