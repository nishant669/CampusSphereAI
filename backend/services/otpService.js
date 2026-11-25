const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const AppError = require('../utils/AppError');
const { sendOtpEmail } = require('./emailService');
const Student = require('../models/Student');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createAndSendOtp = async (student) => {
  const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60;
  
  const existingOTP = await OTP.findOne({ student: student._id });
  
  if (existingOTP) {
    const timeSinceLastSent = (Date.now() - existingOTP.lastSentAt.getTime()) / 1000;
    if (timeSinceLastSent < cooldownSeconds) {
      throw new AppError(`Please wait ${Math.ceil(cooldownSeconds - timeSinceLastSent)} seconds before requesting a new OTP`, 429);
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES, 10) || 5) * 60 * 1000);

  await OTP.findOneAndUpdate(
    { student: student._id },
    { 
      otpHash, 
      expiresAt, 
      isUsed: false, 
      attempts: 0, 
      lastSentAt: Date.now() 
    },
    { upsert: true, new: true }
  );

  await sendOtpEmail(student.email, student.fullName, otp);
};

const verifyOtp = async (enrollmentNumber, otp) => {
  const student = await Student.findOne({ enrollmentNumber: { $regex: new RegExp(`^${enrollmentNumber}$`, 'i') } });
  if (!student) {
    return { valid: false };
  }

  const otpRecord = await OTP.findOne({ student: student._id });
  if (!otpRecord) {
    return { valid: false };
  }

  if (otpRecord.isUsed) {
    return { valid: false };
  }

  if (new Date() > otpRecord.expiresAt) {
    return { valid: false };
  }

  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 3;
  if (otpRecord.attempts >= maxAttempts) {
    return { valid: false };
  }

  otpRecord.attempts += 1;
  await otpRecord.save();

  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    return { valid: false };
  }

  return { valid: true, student };
};

const markOtpUsed = async (studentId) => {
  await OTP.findOneAndUpdate(
    { student: studentId },
    { isUsed: true }
  );
};

module.exports = {
  generateOtp,
  createAndSendOtp,
  verifyOtp,
  markOtpUsed
};
