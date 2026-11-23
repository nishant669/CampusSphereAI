const Student = require('../models/Student');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');

exports.getMe = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.studentId).populate('userId', 'name email role isActive');
    if (!student) {
      return next(new AppError('Student profile not found', 404));
    }
    sendResponse(res, 200, 'Student profile fetched', student);
  } catch (error) {
    next(error);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { search, course, branch, semester, status, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (course) query.course = course;
    if (branch) query.branch = branch;
    if (semester) query.semester = semester;
    if (status) query.status = status;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: { path: 'userId', select: 'name email role isActive' },
      sort: { createdAt: -1 }
    };

    const students = await Student.paginate(query, options);
    sendResponse(res, 200, 'Students fetched successfully', students);
  } catch (error) {
    next(error);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email role isActive');
    if (!student) {
      return next(new AppError('Student not found', 404));
    }
    sendResponse(res, 200, 'Student fetched successfully', student);
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const {
      enrollmentNumber,
      fullName,
      email,
      password,
      phone,
      course = 'B.Tech',
      branch,
      semester,
      section,
      academicYear,
      lastSemSGPA = 0,
      cgpa = 0,
      academicPerformance = []
    } = req.body;

    const cleanEnrollment = enrollmentNumber.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingEnrollment = await Student.findOne({ enrollmentNumber: { $regex: new RegExp(`^${cleanEnrollment}$`, 'i') } });
    if (existingEnrollment) {
      return next(new AppError('Enrollment number already exists', 400));
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return next(new AppError('Email already registered', 400));
    }

    const user = await User.create({
      name: fullName.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: 'STUDENT'
    });

    const student = await Student.create({
      userId: user._id,
      enrollmentNumber: cleanEnrollment,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      course: course.trim(),
      branch: branch.trim(),
      semester: Number(semester),
      section: section ? section.trim() : '',
      academicYear: academicYear ? academicYear.trim() : '',
      lastSemSGPA: Number(lastSemSGPA) || 0,
      cgpa: Number(cgpa) || 0,
      academicPerformance: academicPerformance || []
    });

    sendResponse(res, 201, 'Student created successfully', student);
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    const {
      fullName,
      email,
      phone,
      course,
      branch,
      semester,
      section,
      academicYear,
      lastSemSGPA,
      cgpa,
      academicPerformance,
      password
    } = req.body;

    if (email && email.toLowerCase().trim() !== student.email) {
      const cleanEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        return next(new AppError('Email already in use', 400));
      }
    }

    const user = await User.findById(student.userId).select('+password');
    if (user) {
      if (fullName) user.name = fullName.trim();
      if (email) user.email = email.toLowerCase().trim();
      if (password && password.trim().length >= 8) {
        user.password = password.trim();
      }
      await user.save();
    }

    if (fullName) student.fullName = fullName.trim();
    if (email) student.email = email.toLowerCase().trim();
    if (phone !== undefined) student.phone = phone ? phone.trim() : '';
    if (course) student.course = course.trim();
    if (branch) student.branch = branch.trim();
    if (semester !== undefined) student.semester = Number(semester);
    if (section !== undefined) student.section = section ? section.trim() : '';
    if (academicYear) student.academicYear = academicYear.trim();
    if (lastSemSGPA !== undefined) student.lastSemSGPA = Number(lastSemSGPA);
    if (cgpa !== undefined) student.cgpa = Number(cgpa);
    if (academicPerformance !== undefined) student.academicPerformance = academicPerformance;

    await student.save();

    sendResponse(res, 200, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    student.status = 'INACTIVE';
    await student.save();

    const user = await User.findById(student.userId);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    sendResponse(res, 200, 'Student deactivated successfully');
  } catch (error) {
    next(error);
  }
};

exports.activateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    student.status = 'ACTIVE';
    await student.save();

    const user = await User.findById(student.userId);
    if (user) {
      user.isActive = true;
      await user.save();
    }

    sendResponse(res, 200, 'Student activated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/analytics
 * ADMIN only — returns all students with:
 *   - overallAttendancePct (computed from Attendance collection)
 *   - minMstMarks        (lowest obtainedMarks across MST_1/2/3)
 *   - minUnitTestMarks   (lowest obtainedMarks across UNIT_TEST_1/2/3)
 *   - cgpa, lastSemSGPA
 * Supports filter query params:
 *   maxAttendancePct, minCgpa, maxCgpa, maxMstMarks, maxUnitTestMarks
 *   branch, semester, course, search
 */
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const Attendance = require('./Attendance') ? null : null; // handled below
    const AttendanceModel = require('../models/Attendance');
    const MarksModel = require('../models/Marks');

    const {
      maxAttendancePct,
      minCgpa,
      maxCgpa,
      maxMstMarks,
      maxUnitTestMarks,
      branch,
      semester,
      course,
      search
    } = req.query;

    // Build base student query
    let studentQuery = { status: 'ACTIVE' };
    if (branch) studentQuery.branch = branch;
    if (semester) studentQuery.semester = Number(semester);
    if (course) studentQuery.course = course;
    if (minCgpa || maxCgpa) {
      studentQuery.cgpa = {};
      if (minCgpa) studentQuery.cgpa.$gte = Number(minCgpa);
      if (maxCgpa) studentQuery.cgpa.$lte = Number(maxCgpa);
    }
    if (search) {
      studentQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(studentQuery)
      .select('_id enrollmentNumber fullName email phone course branch semester section cgpa lastSemSGPA status academicYear')
      .sort({ enrollmentNumber: 1 });

    if (students.length === 0) {
      return sendResponse(res, 200, 'No students found', []);
    }

    const studentIds = students.map(s => s._id);

    // ── Attendance aggregation ────────────────────────────────────────────────
    const attendanceAgg = await AttendanceModel.aggregate([
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

    const attendanceMap = {};
    attendanceAgg.forEach(a => {
      const pct = a.total > 0 ? parseFloat(((a.present / a.total) * 100).toFixed(1)) : null;
      attendanceMap[a._id.toString()] = { total: a.total, present: a.present, percentage: pct };
    });

    // ── Marks aggregation (min marks per exam group) ──────────────────────────
    const marksAgg = await MarksModel.aggregate([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: '$student',
          minMstMarks: {
            $min: {
              $cond: [
                { $in: ['$examType', ['MST_1', 'MST_2', 'MST_3']] },
                '$obtainedMarks',
                null
              ]
            }
          },
          minUnitTestMarks: {
            $min: {
              $cond: [
                { $in: ['$examType', ['UNIT_TEST_1', 'UNIT_TEST_2', 'UNIT_TEST_3']] },
                '$obtainedMarks',
                null
              ]
            }
          }
        }
      }
    ]);

    const marksMap = {};
    marksAgg.forEach(m => {
      marksMap[m._id.toString()] = {
        minMstMarks: m.minMstMarks,
        minUnitTestMarks: m.minUnitTestMarks
      };
    });

    // ── Build result + apply post-aggregation filters ─────────────────────────
    let result = students.map(student => {
      const sid = student._id.toString();
      const att = attendanceMap[sid] || { total: 0, present: 0, percentage: null };
      const mrk = marksMap[sid] || { minMstMarks: null, minUnitTestMarks: null };

      return {
        _id: student._id,
        enrollmentNumber: student.enrollmentNumber,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        section: student.section,
        cgpa: student.cgpa,
        lastSemSGPA: student.lastSemSGPA,
        status: student.status,
        academicYear: student.academicYear,
        attendance: {
          total: att.total,
          present: att.present,
          percentage: att.percentage
        },
        minMstMarks: mrk.minMstMarks,
        minUnitTestMarks: mrk.minUnitTestMarks
      };
    });

    // Apply attendance filter (post-aggregation)
    if (maxAttendancePct !== undefined && maxAttendancePct !== '') {
      const threshold = Number(maxAttendancePct);
      result = result.filter(s =>
        s.attendance.percentage === null || s.attendance.percentage <= threshold
      );
    }

    // Apply min marks filters (post-aggregation)
    if (maxMstMarks !== undefined && maxMstMarks !== '') {
      const threshold = Number(maxMstMarks);
      result = result.filter(s =>
        s.minMstMarks !== null && s.minMstMarks <= threshold
      );
    }

    if (maxUnitTestMarks !== undefined && maxUnitTestMarks !== '') {
      const threshold = Number(maxUnitTestMarks);
      result = result.filter(s =>
        s.minUnitTestMarks !== null && s.minUnitTestMarks <= threshold
      );
    }

    sendResponse(res, 200, `${result.length} student(s) found`, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/subject-full?subjectId=
 * ADMIN or PROFESSOR (own subjects only)
 * Returns all students of a subject's batch with:
 *   - Subject-specific attendance (total, present, absent, %)
 *   - Overall attendance (all subjects combined)
 *   - All exam marks (MST 1/2/3, UT 1/2/3) grouped
 *   - CGPA, SGPA from student profile
 */
exports.getSubjectFullStudents = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return next(new AppError('subjectId is required', 400));

    const Subject = require('../models/Subject');
    const Professor = require('../models/Professor');
    const AttendanceModel = require('../models/Attendance');
    const MarksModel = require('../models/Marks');
    const mongoose = require('mongoose');

    // Professor subject isolation
    if (req.user.role === 'PROFESSOR') {
      const prof = await Professor.findOne({
        $or: [{ _id: req.user.professorId }, { userId: req.user.id }]
      });
      if (!prof) return next(new AppError('Professor record not found', 404));
      const isAssigned = prof.assignedSubjects.some(
        id => id.toString() === subjectId.toString()
      );
      if (!isAssigned) return next(new AppError('Access denied: not your assigned subject', 403));
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) return next(new AppError('Subject not found', 404));

    const students = await Student.find({
      branch: subject.branch,
      semester: subject.semester,
      status: 'ACTIVE'
    }).select('_id enrollmentNumber fullName email phone course branch semester section cgpa lastSemSGPA status').sort({ enrollmentNumber: 1 });

    if (students.length === 0) return sendResponse(res, 200, 'No students in this batch', []);

    const studentIds = students.map(s => s._id);
    const subjectObjId = new mongoose.Types.ObjectId(subjectId);

    // Subject attendance
    const subAtt = await AttendanceModel.aggregate([
      { $match: { student: { $in: studentIds }, subject: subjectObjId, status: { $in: ['PRESENT', 'ABSENT'] } } },
      { $group: { _id: '$student', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } } } }
    ]);
    const subAttMap = {};
    subAtt.forEach(a => { subAttMap[a._id.toString()] = a; });

    // Overall attendance
    const allAtt = await AttendanceModel.aggregate([
      { $match: { student: { $in: studentIds }, status: { $in: ['PRESENT', 'ABSENT'] } } },
      { $group: { _id: '$student', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } } } }
    ]);
    const allAttMap = {};
    allAtt.forEach(a => { allAttMap[a._id.toString()] = a; });

    // All marks with subject populated
    const marksRaw = await MarksModel.find({ student: { $in: studentIds } })
      .populate('subject', 'subjectName subjectCode')
      .lean();

    // Group marks by student
    const marksMap = {};
    marksRaw.forEach(m => {
      const sid = m.student.toString();
      if (!marksMap[sid]) marksMap[sid] = {};
      const subKey = m.subject?._id?.toString() || 'unknown';
      if (!marksMap[sid][subKey]) {
        marksMap[sid][subKey] = {
          subjectId: subKey,
          subjectName: m.subject?.subjectName || 'Unknown',
          subjectCode: m.subject?.subjectCode || '',
          marks: []
        };
      }
      marksMap[sid][subKey].marks.push({
        examType: m.examType,
        obtainedMarks: m.obtainedMarks,
        maximumMarks: m.maximumMarks,
        percentage: m.maximumMarks > 0 ? parseFloat(((m.obtainedMarks / m.maximumMarks) * 100).toFixed(1)) : 0,
        remarks: m.remarks
      });
    });

    const result = students.map(student => {
      const sid = student._id.toString();
      const sa = subAttMap[sid] || { total: 0, present: 0 };
      const oa = allAttMap[sid] || { total: 0, present: 0 };
      const subjectPct = sa.total > 0 ? parseFloat(((sa.present / sa.total) * 100).toFixed(1)) : null;
      const overallPct = oa.total > 0 ? parseFloat(((oa.present / oa.total) * 100).toFixed(1)) : null;

      return {
        _id: student._id,
        enrollmentNumber: student.enrollmentNumber,
        fullName: student.fullName,
        email: student.email,
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        section: student.section,
        cgpa: student.cgpa,
        lastSemSGPA: student.lastSemSGPA,
        subjectAttendance: {
          total: sa.total, present: sa.present, absent: sa.total - sa.present, percentage: subjectPct
        },
        overallAttendance: {
          total: oa.total, present: oa.present, absent: oa.total - oa.present, percentage: overallPct
        },
        marksGroups: Object.values(marksMap[sid] || {})
      };
    });

    sendResponse(res, 200, `${result.length} students fetched`, result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/bulk-update
 * ADMIN only — bulk update semester or section for selected students
 * Body: { studentIds: [...], semester?, section? }
 */
exports.bulkUpdateStudents = async (req, res, next) => {
  try {
    const { studentIds, semester, section } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return next(new AppError('studentIds array is required', 400));
    }
    if (semester === undefined && section === undefined) {
      return next(new AppError('Provide at least semester or section to update', 400));
    }

    const updateFields = {};
    if (semester !== undefined && semester !== '') updateFields.semester = Number(semester);
    if (section !== undefined && section !== '') updateFields.section = section;

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: updateFields }
    );

    sendResponse(res, 200, `${result.modifiedCount} student(s) updated successfully`, {
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

