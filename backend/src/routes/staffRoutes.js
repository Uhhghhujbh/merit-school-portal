const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyStaff } = require('../middleware/authMiddleware');

router.post('/register', staffController.registerStaff); 
router.post('/login', staffController.staffLogin); 

router.get('/my-students', verifyStaff, staffController.getMyStudents);

const studentController = require('../controllers/studentController');
router.get('/profile/:id', studentController.getStudentProfile);
router.get('/announcements', studentController.getAnnouncements);
router.get('/fees', studentController.getSchoolFees);

module.exports = router;
