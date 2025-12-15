const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const { verifyStudent } = require('../middleware/authMiddleware'); // Ensure this middleware exists

// --- PUBLIC ROUTES ---
// This handles api.post('/students/register')
router.post('/register', authController.registerStudent); 

// --- PROTECTED ROUTES ---
// These require a valid Token
router.get('/profile/:id', verifyStudent, studentController.getStudentProfile);
router.get('/announcements', verifyStudent, studentController.getAnnouncements);
router.get('/fees', verifyStudent, studentController.getSchoolFees);
router.post('/verify-payment', verifyStudent, studentController.verifyPayment);
router.post('/manual-payment', verifyStudent, studentController.submitManualPayment);

module.exports = router;
