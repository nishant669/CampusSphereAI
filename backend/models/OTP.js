const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
