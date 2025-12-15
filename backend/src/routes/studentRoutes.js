const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const { verifyStudent } = require('../middleware/authMiddleware'); 

// --- PUBLIC ROUTES ---
router.post('/register', authController.registerStudent); 

// --- PROTECTED ROUTES (Require Login) ---
// These routes will now have access to 'req.user' because of 'verifyStudent'
router.get('/profile/:id', verifyStudent, studentController.getStudentProfile);
router.get('/announcements', verifyStudent, studentController.getAnnouncements);
router.get('/fees', verifyStudent, studentController.getSchoolFees);
router.post('/verify-payment', verifyStudent, studentController.verifyPayment);
router.post('/manual-payment', verifyStudent, studentController.submitManualPayment);

module.exports = router;
