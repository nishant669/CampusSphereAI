const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const StudyMaterial = require('../models/StudyMaterial');
const Professor = require('../models/Professor');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');

exports.getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.studentId;

    const student = await Student.findById(studentId);
    if (!student) return next(new AppError('Student not found', 404));

    // Attendance Aggregation
    const attendanceSummary = await Attendance.getSummaryForStudent(studentId);
    let totalClasses = 0;
    let presentClasses = 0;
    attendanceSummary.forEach(item => {
      totalClasses += item.total;
      presentClasses += item.present;
    });
    const overallAttendance = totalClasses === 0 ? 0 : (presentClasses / totalClasses) * 100;

    // Recent Marks
    const recentMarks = await Marks.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('subject', 'subjectName subjectCode');

    // Recent Materials (all materials available for student's semester/branch)
    const recentMaterials = await StudyMaterial.find({
      $or: [
        { semester: student.semester },
        {} // show recent materials across subjects
      ]
    })
      .sort({ uploadDate: -1 })
      .limit(6)
      .populate('subject', 'subjectName subjectCode');

    // Today's Attendance
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
      student: studentId,
      date: { $gte: startOfToday, $lte: endOfToday }
    }).populate('subject', 'subjectName subjectCode');

    const data = {
      profile: {
        fullName: student.fullName,
        enrollmentNumber: student.enrollmentNumber,
        branch: student.branch,
        semester: student.semester,
        course: student.course || 'B.Tech',
        section: student.section,
        lastSemSGPA: student.lastSemSGPA || 0,
        cgpa: student.cgpa || 0,
        academicPerformance: student.academicPerformance || []
      },
      attendance: {
        overallPercentage: overallAttendance,
        warning: overallAttendance < 75,
        subjectWise: attendanceSummary
      },
      todayAttendance,
      recentMarks,
      recentMaterials
    };

    sendResponse(res, 200, 'Student dashboard fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.getProfessorDashboard = async (req, res, next) => {
  try {
    const professor = await Professor.findOne({
      $or: [
        { _id: req.user.professorId },
        { userId: req.user.id }
      ]
    }).populate('assignedSubjects', 'subjectName subjectCode semester branch course');

    if (!professor) {
      return next(new AppError('Professor not found', 404));
    }

    const assignedSubjectIds = professor.assignedSubjects.map(s => s._id);

    // Count students enrolled in branches & semesters of assigned subjects
    const branchesAndSemesters = professor.assignedSubjects.map(s => ({
      branch: s.branch,
      semester: s.semester
    }));

    let totalStudentsTaught = 0;
    if (branchesAndSemesters.length > 0) {
      totalStudentsTaught = await Student.countDocuments({
        status: 'ACTIVE',
        $or: branchesAndSemesters
      });
    }

    // Today's attendance marked for assigned subjects
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAttendancePerSubject = await Attendance.aggregate([
      {
        $match: {
          subject: { $in: assignedSubjectIds },
          date: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: '$subject',
          markedCount: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
        }
      }
    ]);

    // Recent materials uploaded by this professor
    const recentMaterials = await StudyMaterial.find({ uploadedBy: req.user.id })
      .sort({ uploadDate: -1 })
      .limit(6)
      .populate('subject', 'subjectName subjectCode');

    // Total materials uploaded by professor
    const totalMaterialsUploaded = await StudyMaterial.countDocuments({ uploadedBy: req.user.id });

    const data = {
      profile: {
        fullName: professor.fullName,
        employeeId: professor.employeeId,
        email: professor.email,
        department: professor.department,
        course: professor.course
      },
      assignedSubjects: professor.assignedSubjects,
      totalStudentsTaught,
      totalMaterialsUploaded,
      todayAttendancePerSubject,
      recentMaterials
    };

    sendResponse(res, 200, 'Professor dashboard fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments({ status: 'ACTIVE' });
    const totalProfessors = await Professor.countDocuments({ status: 'ACTIVE' });
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const totalMaterials = await StudyMaterial.countDocuments();

    // Today's Attendance Stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAttendanceRecords = await Attendance.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    }).distinct('student');
    const todayAttendanceCount = todayAttendanceRecords.length;

    // Average Attendance
    const aggResult = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'ABSENT']] }, 1, 0] } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
        }
      }
    ]);
    const averageAttendance = aggResult.length > 0 && aggResult[0].total > 0
      ? (aggResult[0].present / aggResult[0].total) * 100
      : 0;

    // Students below 75%
    const below75 = await Attendance.aggregate([
      {
        $group: {
          _id: '$student',
          total: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'ABSENT']] }, 1, 0] } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
        }
      },
      {
        $project: {
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
            ]
          }
        }
      },
      { $match: { percentage: { $lt: 75 } } }
    ]);
    const studentsBelow75Count = below75.length;

    const recentMaterials = await StudyMaterial.find()
      .sort({ uploadDate: -1 })
      .limit(6)
      .populate('subject', 'subjectName subjectCode')
      .populate('uploadedBy', 'name');

    const data = {
      totalStudents,
      totalProfessors,
      totalSubjects,
      totalMaterials,
      todayAttendanceCount,
      averageAttendance,
      studentsBelow75Count,
      recentMaterials
    };

    sendResponse(res, 200, 'Admin dashboard fetched', data);
  } catch (error) {
    next(error);
  }
};
