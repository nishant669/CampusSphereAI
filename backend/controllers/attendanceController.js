const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Professor = require('../models/Professor');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');
const mongoose = require('mongoose');

const verifyProfessorSubject = async (req, subjectId) => {
  if (req.user.role === 'PROFESSOR') {
    const professor = await Professor.findOne({
      $or: [
        { _id: req.user.professorId },
        { userId: req.user.id }
      ]
    });
    if (!professor) {
      throw new AppError('Professor record not found', 404);
    }
    const isAssigned = professor.assignedSubjects.some(
      subId => subId.toString() === subjectId.toString()
    );
    if (!isAssigned) {
      throw new AppError('You are only authorized to manage attendance for your assigned subjects', 403);
    }
  }
};

exports.getMyAttendance = async (req, res, next) => {
  try {
    const summary = await Attendance.getSummaryForStudent(req.user.studentId);
    await Subject.populate(summary, { path: 'subject', select: 'subjectName subjectCode' });
    sendResponse(res, 200, 'Attendance summary fetched', summary);
  } catch (error) {
    next(error);
  }
};

exports.getMyDailyAttendance = async (req, res, next) => {
  try {
    const { date, subjectId, status, page = 1, limit = 20 } = req.query;
    let query = { student: req.user.studentId };

    if (date) query.date = new Date(date);
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: { path: 'subject', select: 'subjectName subjectCode' },
      sort: { date: -1 }
    };

    const attendance = await Attendance.paginate(query, options);
    sendResponse(res, 200, 'Daily attendance fetched', attendance);
  } catch (error) {
    next(error);
  }
};

exports.getAllAttendance = async (req, res, next) => {
  try {
    const { studentId, subjectId, date, status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (studentId) query.student = studentId;
    if (subjectId) query.subject = subjectId;
    if (date) query.date = new Date(date);
    if (status) query.status = status;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: [
        { path: 'student', select: 'fullName enrollmentNumber' },
        { path: 'subject', select: 'subjectName subjectCode' }
      ],
      sort: { date: -1 }
    };

    const attendance = await Attendance.paginate(query, options);
    sendResponse(res, 200, 'Attendance fetched', attendance);
  } catch (error) {
    next(error);
  }
};

exports.getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const summary = await Attendance.getSummaryForStudent(studentId);
    await Subject.populate(summary, { path: 'subject', select: 'subjectName subjectCode' });
    sendResponse(res, 200, 'Student attendance summary fetched', summary);
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceSession = async (req, res, next) => {
  try {
    const { subjectId, date } = req.query;
    if (!subjectId || !date) {
      return next(new AppError('subjectId and date are required', 400));
    }

    await verifyProfessorSubject(req, subjectId);

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const students = await Student.find({
      branch: subject.branch,
      semester: subject.semester,
      status: 'ACTIVE'
    }).select('_id fullName enrollmentNumber').sort({ enrollmentNumber: 1 });

    const attendanceRecords = await Attendance.find({
      subject: subjectId,
      date: new Date(date)
    });

    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.student.toString()] = {
        id: record._id,
        status: record.status
      };
    });

    const result = students.map(student => ({
      studentId: student._id,
      enrollmentNumber: student.enrollmentNumber,
      fullName: student.fullName,
      attendanceId: attendanceMap[student._id.toString()] ? attendanceMap[student._id.toString()].id : null,
      status: attendanceMap[student._id.toString()] ? attendanceMap[student._id.toString()].status : 'NOT_MARKED'
    }));

    sendResponse(res, 200, 'Attendance session fetched', result);
  } catch (error) {
    next(error);
  }
};

exports.getStudentsBelow75 = async (req, res, next) => {
  try {
    const result = await Attendance.aggregate([
      {
        $group: {
          _id: '$student',
          total: {
            $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'ABSENT']] }, 1, 0] }
          },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          studentId: '$_id',
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
            ]
          }
        }
      },
      { $match: { percentage: { $lt: 75 } } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 0,
          studentId: 1,
          percentage: 1,
          fullName: '$student.fullName',
          enrollmentNumber: '$student.enrollmentNumber'
        }
      },
      { $sort: { percentage: 1 } }
    ]);

    sendResponse(res, 200, 'Students below 75% fetched', result);
  } catch (error) {
    next(error);
  }
};

exports.markBulkAttendance = async (req, res, next) => {
  try {
    const { subjectId, date, records } = req.body;
    let savedCount = 0;

    await verifyProfessorSubject(req, subjectId);

    for (const record of records) {
      if (!record.studentId || !record.status) continue;

      await Attendance.findOneAndUpdate(
        { student: record.studentId, subject: subjectId, date: new Date(date) },
        { status: record.status },
        { upsert: true, new: true }
      );
      savedCount++;
    }

    sendResponse(res, 200, `${savedCount} attendance records saved successfully`);
  } catch (error) {
    next(error);
  }
};

exports.updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return next(new AppError('Attendance record not found', 404));
    }

    sendResponse(res, 200, 'Attendance updated successfully', attendance);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/subject-students?subjectId=
 * Accessible by PROFESSOR (own subjects only) and ADMIN
 * Returns all students of that subject with:
 *   - Subject-specific attendance (total, present, absent, percentage)
 *   - Overall attendance percentage across all subjects
 */
exports.getProfessorSubjectStudents = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return next(new AppError('subjectId is required', 400));
    }

    // Professors can only view their own assigned subjects
    await verifyProfessorSubject(req, subjectId);

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Get all active students for this subject's batch
    const students = await Student.find({
      branch: subject.branch,
      semester: subject.semester,
      status: 'ACTIVE'
    }).select('_id fullName enrollmentNumber branch semester section').sort({ enrollmentNumber: 1 });

    const studentIds = students.map(s => s._id);

    // Subject-specific attendance aggregation
    const subjectAttendance = await Attendance.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          subject: new mongoose.Types.ObjectId(subjectId),
          status: { $in: ['PRESENT', 'ABSENT'] }
        }
      },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
        }
      }
    ]);

    // Overall attendance aggregation (all subjects)
    const overallAttendance = await Attendance.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          status: { $in: ['PRESENT', 'ABSENT'] }
        }
      },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
        }
      }
    ]);

    // Build lookup maps
    const subjectMap = {};
    subjectAttendance.forEach(r => { subjectMap[r._id.toString()] = r; });
    const overallMap = {};
    overallAttendance.forEach(r => { overallMap[r._id.toString()] = r; });

    const result = students.map(student => {
      const sid = student._id.toString();
      const subj = subjectMap[sid] || { total: 0, present: 0 };
      const overall = overallMap[sid] || { total: 0, present: 0 };

      const subjectPct = subj.total > 0 ? parseFloat(((subj.present / subj.total) * 100).toFixed(1)) : null;
      const overallPct = overall.total > 0 ? parseFloat(((overall.present / overall.total) * 100).toFixed(1)) : null;

      return {
        studentId: student._id,
        enrollmentNumber: student.enrollmentNumber,
        fullName: student.fullName,
        branch: student.branch,
        semester: student.semester,
        section: student.section,
        subjectAttendance: {
          total: subj.total,
          present: subj.present,
          absent: subj.total - subj.present,
          percentage: subjectPct
        },
        overallAttendance: {
          total: overall.total,
          present: overall.present,
          absent: overall.total - overall.present,
          percentage: overallPct
        }
      };
    });

    sendResponse(res, 200, 'Subject students attendance fetched', result);
  } catch (error) {
    next(error);
  }
};
