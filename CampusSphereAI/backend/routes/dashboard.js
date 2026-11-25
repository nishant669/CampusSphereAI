const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/student', authorize('STUDENT'), dashboardController.getStudentDashboard);
router.get('/professor', authorize('PROFESSOR'), dashboardController.getProfessorDashboard);
router.get('/admin', authorize('ADMIN'), dashboardController.getAdminDashboard);

module.exports = router;
