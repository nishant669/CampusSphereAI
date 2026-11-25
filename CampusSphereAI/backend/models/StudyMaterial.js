const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  materialType: {
    type: String,
    enum: ['NOTES', 'ASSIGNMENT', 'MST_PAPER', 'UNIT_TEST_PAPER', 'UNIVERSITY_PAPER', 'IMP_QUESTIONS'],
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

studyMaterialSchema.plugin(mongoosePaginate);

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
module.exports = StudyMaterial;
