/**
 * E-Notes Routes
 * Digital study notes for students
 */

const express = require('express');
const router = express.Router();
const enotesController = require('../controllers/enotesController');
const { verifyAdmin, verifyStaff, verifyAny } = require('../middleware/authMiddleware');

// Public routes
router.get('/', enotesController.getENotes);
router.get('/subjects', enotesController.getSubjects);
router.get('/:id', enotesController.getENote);
router.post('/:id/download', enotesController.trackDownload);

// Admin routes
// Admin & Staff routes
router.post('/add', verifyStaff, enotesController.addENote); // Auto-approve for Admin, Pending for Staff
router.get('/mine', verifyStaff, enotesController.getMyENotes);

// Admin only routes
router.put('/:id', verifyAdmin, enotesController.updateENote);
router.delete('/:id', verifyAdmin, enotesController.deleteENote);
router.put('/:id/approve', verifyAdmin, enotesController.approveENote);
router.get('/pending', verifyAdmin, enotesController.getPendingENotes);

module.exports = router;
