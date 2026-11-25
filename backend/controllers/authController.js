const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const AppError = require('../utils/AppError');
const { sendResponse, sendError } = require('../utils/sendResponse');
const otpService = require('../services/otpService');

const generateToken = (user, studentId = null, professorId = null) => {
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  if (studentId) {
    payload.studentId = studentId;
  }
  if (professorId) {
    payload.professorId = professorId;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

exports.login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    let user;
    let student = null;
    let professor = null;

    if (role === 'STUDENT') {
      student = await Student.findOne({ enrollmentNumber: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (!student) {
        return next(new AppError('Invalid credentials', 401));
      }
      user = await User.findById(student.userId).select('+password');
    } else if (role === 'PROFESSOR') {
      // Professor can login with email or employeeId/professorId
      professor = await Professor.findOne({
        $or: [
          { email: username.toLowerCase().trim() },
          { employeeId: username.toUpperCase().trim() }
        ]
      }).populate('assignedSubjects');

      if (!professor) {
        return next(new AppError('Invalid professor credentials', 401));
      }
      user = await User.findById(professor.userId).select('+password');
    } else if (role === 'ADMIN') {
      user = await User.findOne({ email: username.toLowerCase().trim(), role: 'ADMIN' }).select('+password');
    }

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = generateToken(
      user,
      student ? student._id : null,
      professor ? professor._id : null
    );
    
    sendResponse(res, 200, 'Login successful', {
      token,
      role: user.role,
      name: user.name,
      email: user.email,
      userId: user._id,
      studentId: student ? student._id : undefined,
      professorId: professor ? professor._id : undefined,
      employeeId: professor ? professor.employeeId : undefined,
      assignedSubjects: professor ? professor.assignedSubjects : undefined
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { enrollmentNumber } = req.body;
    const student = await Student.findOne({ enrollmentNumber: { $regex: new RegExp(`^${enrollmentNumber}$`, 'i') } });
    
    if (!student) {
      return next(new AppError('Student not found with this enrollment number', 404));
    }

    await otpService.createAndSendOtp(student);
    sendResponse(res, 200, 'OTP sent to registered email');
  } catch (error) {
    next(error);
  }
};

exports.verifyOtpController = async (req, res, next) => {
  try {
    const { enrollmentNumber, otp } = req.body;
    const { valid } = await otpService.verifyOtp(enrollmentNumber, otp);

    if (valid) {
      sendResponse(res, 200, 'OTP verified', { verified: true });
    } else {
      sendError(res, 400, 'Invalid or expired OTP', { verified: false });
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { enrollmentNumber, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    const { valid, student } = await otpService.verifyOtp(enrollmentNumber, otp);
    if (!valid) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    const user = await User.findById(student.userId);
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    await otpService.markOtpUsed(student._id);

    sendResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return next(new AppError('New passwords do not match', 400));
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401));
    }

    user.password = newPassword;
    await user.save();

    sendResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
