const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// --- PUBLIC VALIDATION ROUTES ---
router.post('/check-email', authController.checkEmailExists); // New: For Frontend Validation

// --- REGISTRATION ROUTES ---
// Note: Large file limit is handled in server.js middleware
router.post('/student/register', authController.registerStudent);

// --- LOGIN ROUTES ---
router.post('/login/admin', authController.adminLogin);
router.post('/login/student', authController.studentLogin);
router.post('/login/staff', authController.staffLogin);
router.post('/login/parent', authController.parentLogin);

module.exports = router;
