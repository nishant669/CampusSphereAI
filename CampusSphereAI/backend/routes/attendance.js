const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Student routes
router.get('/my', authorize('STUDENT'), attendanceController.getMyAttendance);
router.get('/my/daily', authorize('STUDENT'), attendanceController.getMyDailyAttendance);

// Routes accessible by both Admin and Professor
router.get('/session', authorize('ADMIN', 'PROFESSOR'), attendanceController.getAttendanceSession);

router.post('/bulk', authorize('ADMIN', 'PROFESSOR'), [
  check('subjectId', 'Subject is required').notEmpty(),
  check('date', 'Date is required').isISO8601(),
  check('records', 'Records array is required').isArray()
], validate, attendanceController.markBulkAttendance);

router.put('/:id', authorize('ADMIN', 'PROFESSOR'), [
  check('status', 'Status must be PRESENT, ABSENT, or NOT_MARKED').isIn(['PRESENT', 'ABSENT', 'NOT_MARKED'])
], validate, attendanceController.updateAttendance);

// Admin-only routes
router.get('/', authorize('ADMIN'), attendanceController.getAllAttendance);
router.get('/student/:studentId', authorize('ADMIN'), attendanceController.getStudentAttendanceSummary);
router.get('/below75', authorize('ADMIN'), attendanceController.getStudentsBelow75);

// Professor + Admin: view all students in a subject with attendance stats
router.get('/subject-students', authorize('ADMIN', 'PROFESSOR'), attendanceController.getProfessorSubjectStudents);

module.exports = router;
