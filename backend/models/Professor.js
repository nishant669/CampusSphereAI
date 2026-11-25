const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
require('./Subject');

const professorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
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
  department: {
    type: String,
    required: true,
    trim: true,
    default: 'CSE'
  },
  assignedSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

professorSchema.plugin(mongoosePaginate);

const Professor = mongoose.model('Professor', professorSchema);
module.exports = Professor;
