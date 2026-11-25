const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true,
    trim: true,
    default: 'B.Tech'
  },
  assignedProfessor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor'
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

subjectSchema.plugin(mongoosePaginate);

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
