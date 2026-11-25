const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const subjectController = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', subjectController.getSubjects);
router.get('/:id', subjectController.getSubject);

router.use(authorize('ADMIN'));

router.post('/', [
  check('subjectCode', 'Subject Code is required').notEmpty(),
  check('subjectName', 'Subject Name is required').notEmpty(),
  check('semester', 'Semester is required').isInt(),
  check('branch', 'Branch is required').notEmpty(),
  check('academicYear', 'Academic Year is required').notEmpty()
], validate, subjectController.createSubject);

router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;
