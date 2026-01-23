/**
 * E-Notes Routes
 * Digital study notes for students
 */

const express = require('express');
const router = express.Router();
const enotesController = require('../controllers/enotesController');
const { verifyAdmin, verifyAny } = require('../middleware/authMiddleware');

// Public routes
router.get('/', enotesController.getENotes);
router.get('/subjects', enotesController.getSubjects);
router.get('/:id', enotesController.getENote);
router.post('/:id/download', enotesController.trackDownload);

// Admin routes
router.post('/add', verifyAdmin, enotesController.addENote);
router.put('/:id', verifyAdmin, enotesController.updateENote);
router.delete('/:id', verifyAdmin, enotesController.deleteENote);

module.exports = router;
