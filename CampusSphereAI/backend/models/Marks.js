const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
  examType: {
    type: String,
    enum: ['MST_1', 'MST_2', 'MST_3', 'UNIT_TEST_1', 'UNIT_TEST_2', 'UNIT_TEST_3'],
    required: true
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: 0
  },
  maximumMarks: {
    type: Number,
    required: true,
    min: 1
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

marksSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true });

const Marks = mongoose.model('Marks', marksSchema);
module.exports = Marks;
