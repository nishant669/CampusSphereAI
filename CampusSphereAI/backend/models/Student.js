const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true,
    default: 'B.Tech'
  },
  branch: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  section: {
    type: String
  },
  academicYear: {
    type: String
  },
  lastSemSGPA: {
    type: Number,
    default: 0
  },
  cgpa: {
    type: Number,
    default: 0
  },
  academicPerformance: [{
    semester: { type: Number },
    sgpa: { type: Number },
    cgpa: { type: Number },
    totalCredits: { type: Number },
    backlogs: { type: Number, default: 0 },
    remarks: { type: String }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

studentSchema.plugin(mongoosePaginate);

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
