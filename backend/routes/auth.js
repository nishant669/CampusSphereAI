const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', [
  check('username', 'Username is required').notEmpty(),
  check('password', 'Password is required').notEmpty(),
  check('role', 'Role must be STUDENT, PROFESSOR, or ADMIN').isIn(['STUDENT', 'PROFESSOR', 'ADMIN'])
], validate, authController.login);

router.post('/forgot-password', [
  check('enrollmentNumber', 'Enrollment Number is required').notEmpty()
], validate, authController.forgotPassword);

router.post('/verify-otp', [
  check('enrollmentNumber', 'Enrollment Number is required').notEmpty(),
  check('otp', 'OTP is required').notEmpty()
], validate, authController.verifyOtpController);

router.post('/reset-password', [
  check('enrollmentNumber', 'Enrollment Number is required').notEmpty(),
  check('otp', 'OTP is required').notEmpty(),
  check('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 }),
  check('confirmPassword', 'Confirm password is required').notEmpty()
], validate, authController.resetPassword);

router.post('/change-password', protect, [
  check('currentPassword', 'Current password is required').notEmpty(),
  check('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 }),
  check('confirmPassword', 'Confirm password is required').notEmpty()
], validate, authController.changePassword);

module.exports = router;
