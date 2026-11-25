const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const marksController = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Student routes
router.get('/my', authorize('STUDENT'), marksController.getMyMarks);
router.get('/submissions/my', authorize('STUDENT'), marksController.getMySubmissions);

// Submissions (Admin and Professor)
router.get('/submissions', authorize('ADMIN', 'PROFESSOR'), marksController.getSubmissions);
router.post('/submissions/bulk', authorize('ADMIN', 'PROFESSOR'), marksController.saveBulkSubmissions);

// Routes accessible by both Admin and Professor
router.post('/', authorize('ADMIN', 'PROFESSOR'), [
  check('studentId', 'Student is required').notEmpty(),
  check('subjectId', 'Subject is required').notEmpty(),
  check('examType', 'Valid Exam Type is required').isIn(['MST_1', 'MST_2', 'MST_3', 'UNIT_TEST_1', 'UNIT_TEST_2', 'UNIT_TEST_3']),
  check('obtainedMarks', 'Obtained marks is required').isNumeric(),
  check('maximumMarks', 'Maximum marks is required').isNumeric()
], validate, marksController.createOrUpdateMarks);

router.post('/bulk', authorize('ADMIN', 'PROFESSOR'), [
  check('subjectId', 'Subject is required').notEmpty(),
  check('examType', 'Exam Type is required').isIn(['MST_1', 'MST_2', 'MST_3', 'UNIT_TEST_1', 'UNIT_TEST_2', 'UNIT_TEST_3']),
  check('records', 'Records must be an array').isArray()
], validate, marksController.bulkCreateMarks);

router.put('/:id', authorize('ADMIN', 'PROFESSOR'), marksController.updateMarks);

// Admin-only routes
router.get('/', authorize('ADMIN'), marksController.getAllMarks);
router.get('/student/:studentId', authorize('ADMIN', 'PROFESSOR'), marksController.getStudentMarks);
router.delete('/:id', authorize('ADMIN'), marksController.deleteMarks);

module.exports = router;
