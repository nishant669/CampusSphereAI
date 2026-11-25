const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'NOT_MARKED'],
    required: true,
    default: 'NOT_MARKED'
  }
}, { timestamps: true });

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(mongoosePaginate);

attendanceSchema.statics.getSummaryForStudent = async function(studentId) {
  return await this.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$subject',
        total: {
          $sum: {
            $cond: [{ $in: ['$status', ['PRESENT', 'ABSENT']] }, 1, 0]
          }
        },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0]
          }
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        subject: '$_id',
        total: 1,
        present: 1,
        absent: 1,
        percentage: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
          ]
        }
      }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
