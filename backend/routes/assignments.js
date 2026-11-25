const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const controller = require('../controllers/assignmentController');
const router = express.Router();

router.use(protect);
router.get('/', controller.list);
router.post('/', authorize('ADMIN', 'PROFESSOR'), upload.single('file'), controller.create);
router.post('/:id/submit', authorize('STUDENT'), upload.single('file'), controller.submit);
router.get('/:id/submissions', authorize('ADMIN', 'PROFESSOR'), controller.submissions);
router.patch('/submissions/:submissionId/grade', authorize('ADMIN', 'PROFESSOR'), controller.grade);
router.get('/files/:kind/:id', controller.download);
module.exports = router;
