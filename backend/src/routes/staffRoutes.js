const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController'); 
const { verifyStaff } = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController'); 

// --- AUTH ---
router.post('/register', staffController.registerStaff);
router.post('/login', staffController.staffLogin);

// --- DASHBOARD DATA ---
router.get('/my-students', verifyStaff, staffController.getMyStudents);

// --- SHARED DATA ---
router.get('/profile/:id', studentController.getStudentProfile);
router.get('/announcements', studentController.getAnnouncements);
router.get('/fees', studentController.getSchoolFees);

module.exports = router;
