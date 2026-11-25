const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['SUBMITTED', 'LATE', 'GRADED'], default: 'SUBMITTED' },
  marks: { type: Number, min: 0, default: null },
  feedback: { type: String, default: '' },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('AssignmentSubmission', submissionSchema);
