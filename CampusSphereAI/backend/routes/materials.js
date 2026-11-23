const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const materialController = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

router.use(protect);

router.get('/', materialController.getMaterials);
router.get('/:id/download', materialController.downloadMaterial);

// Allow both ADMIN and PROFESSOR to upload, edit, delete materials
router.post('/', authorize('ADMIN', 'PROFESSOR'), upload.single('file'), [
  check('title', 'Title is required').notEmpty(),
  check('subjectId', 'Subject ID is required').notEmpty(),
  check('materialType', 'Valid material type is required').isIn(['NOTES', 'ASSIGNMENT', 'MST_PAPER', 'UNIT_TEST_PAPER', 'UNIVERSITY_PAPER', 'IMP_QUESTIONS']),
  check('semester', 'Semester is required').isInt(),
  check('academicYear', 'Academic year is required').notEmpty()
], validate, materialController.uploadMaterial);

router.put('/:id', authorize('ADMIN', 'PROFESSOR'), materialController.updateMaterial);
router.delete('/:id', authorize('ADMIN', 'PROFESSOR'), materialController.deleteMaterial);

module.exports = router;
