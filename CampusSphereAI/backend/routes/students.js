const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Student self profile
router.get('/me', authorize('STUDENT'), studentController.getMe);

// Admin: analytics/filter view — MUST be before /:id
router.get('/analytics', authorize('ADMIN'), studentController.getStudentAnalytics);

// Admin + Professor: full student data for a subject (attendance + marks + CGPA)
router.get('/subject-full', authorize('ADMIN', 'PROFESSOR'), studentController.getSubjectFullStudents);

// Admin: bulk update semester or section
router.put('/bulk-update', authorize('ADMIN'), studentController.bulkUpdateStudents);

// Accessible by Admin and Professor
router.get('/', authorize('ADMIN', 'PROFESSOR'), studentController.getStudents);
router.get('/:id', authorize('ADMIN', 'PROFESSOR'), studentController.getStudent);

// Admin only routes
router.post('/', authorize('ADMIN'), [
  check('enrollmentNumber', 'Enrollment Number is required').notEmpty(),
  check('fullName', 'Full Name is required').notEmpty(),
  check('email', 'Valid Email is required').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  check('branch', 'Branch is required').notEmpty(),
  check('semester', 'Semester is required').isInt({ min: 1, max: 8 })
], validate, studentController.createStudent);

router.put('/:id', authorize('ADMIN'), studentController.updateStudent);
router.delete('/:id', authorize('ADMIN'), studentController.deleteStudent);
router.patch('/:id/activate', authorize('ADMIN'), studentController.activateStudent);

module.exports = router;
