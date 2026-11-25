const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const submissionStatusSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  assignmentSubmitted: {
    type: Boolean,
    default: false
  },
  assignmentSubmissionDate: {
    type: Date
  },
  assignmentRemarks: {
    type: String,
    trim: true
  },
  practicalSubmitted: {
    type: Boolean,
    default: false
  },
  practicalSubmissionDate: {
    type: Date
  },
  practicalRemarks: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

submissionStatusSchema.index({ student: 1, subject: 1 }, { unique: true });
submissionStatusSchema.plugin(mongoosePaginate);

const SubmissionStatus = mongoose.model('SubmissionStatus', submissionStatusSchema);
module.exports = SubmissionStatus;
