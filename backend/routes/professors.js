const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const professorController = require('../controllers/professorController');

const router = express.Router();

// Professor self-profile
router.get('/me', protect, authorize('PROFESSOR', 'ADMIN'), professorController.getMe);

// Admin routes
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/')
  .get(professorController.getProfessors)
  .post(professorController.createProfessor);

router.route('/:id')
  .get(professorController.getProfessorById)
  .put(professorController.updateProfessor)
  .delete(professorController.deleteProfessor);

module.exports = router;
