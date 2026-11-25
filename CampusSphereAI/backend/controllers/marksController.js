const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const SubmissionStatus = require('../models/SubmissionStatus');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');

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
      throw new AppError('You are only authorized to manage marks for your assigned subjects', 403);
    }
  }
};

exports.getMyMarks = async (req, res, next) => {
  try {
    const marks = await Marks.find({ student: req.user.studentId })
      .populate('subject', 'subjectName subjectCode')
      .sort({ createdAt: -1 });

    // Group by subject
    const groupedMarks = marks.reduce((acc, curr) => {
      const subjectId = curr.subject._id.toString();
      if (!acc[subjectId]) {
        acc[subjectId] = {
          subjectId: curr.subject._id,
          subjectName: curr.subject.subjectName,
          subjectCode: curr.subject.subjectCode,
          marks: []
        };
      }
      acc[subjectId].marks.push({
        _id: curr._id,
        examType: curr.examType,
        obtainedMarks: curr.obtainedMarks,
        maximumMarks: curr.maximumMarks,
        percentage: curr.maximumMarks > 0 ? (curr.obtainedMarks / curr.maximumMarks) * 100 : 0,
        remarks: curr.remarks
      });
      return acc;
    }, {});

    sendResponse(res, 200, 'Marks fetched successfully', Object.values(groupedMarks));
  } catch (error) {
    next(error);
  }
};

exports.getAllMarks = async (req, res, next) => {
  try {
    const { studentId, subjectId, examType, page = 1, limit = 20 } = req.query;
    let query = {};

    if (studentId) query.student = studentId;
    if (subjectId) query.subject = subjectId;
    if (examType) query.examType = examType;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const marks = await Marks.find(query)
      .populate('student', 'fullName enrollmentNumber branch semester')
      .populate('subject', 'subjectName subjectCode')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Marks.countDocuments(query);

    sendResponse(res, 200, 'Marks fetched', {
      docs: marks,
      totalDocs: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentMarks = async (req, res, next) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId })
      .populate('subject', 'subjectName subjectCode')
      .sort({ 'subject': 1, examType: 1 });
      
    // Group by subject
    const groupedMarks = marks.reduce((acc, curr) => {
      const subjectId = curr.subject._id.toString();
      if (!acc[subjectId]) {
        acc[subjectId] = {
          subjectId: curr.subject._id,
          subjectName: curr.subject.subjectName,
          subjectCode: curr.subject.subjectCode,
          marks: []
        };
      }
      acc[subjectId].marks.push({
        _id: curr._id,
        examType: curr.examType,
        obtainedMarks: curr.obtainedMarks,
        maximumMarks: curr.maximumMarks,
        percentage: curr.maximumMarks > 0 ? (curr.obtainedMarks / curr.maximumMarks) * 100 : 0,
        remarks: curr.remarks
      });
      return acc;
    }, {});

    sendResponse(res, 200, 'Student marks fetched', Object.values(groupedMarks));
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateMarks = async (req, res, next) => {
  try {
    const { studentId, subjectId, examType, obtainedMarks, maximumMarks, remarks } = req.body;

    await verifyProfessorSubject(req, subjectId);

    if (obtainedMarks > maximumMarks) {
      return next(new AppError('Obtained marks cannot be greater than maximum marks', 400));
    }

    const marks = await Marks.findOneAndUpdate(
      { student: studentId, subject: subjectId, examType },
      { obtainedMarks, maximumMarks, remarks },
      { upsert: true, new: true, runValidators: true }
    ).populate('student', 'fullName').populate('subject', 'subjectName');

    sendResponse(res, 200, 'Marks saved successfully', marks);
  } catch (error) {
    next(error);
  }
};

exports.bulkCreateMarks = async (req, res, next) => {
  try {
    const { subjectId, examType, records } = req.body;
    let savedCount = 0;

    await verifyProfessorSubject(req, subjectId);

    for (const record of records) {
      if (!record.studentId || record.obtainedMarks === undefined) continue;

      if (record.obtainedMarks > record.maximumMarks) {
        continue; // Skip invalid records
      }

      await Marks.findOneAndUpdate(
        { student: record.studentId, subject: subjectId, examType },
        { 
          obtainedMarks: record.obtainedMarks, 
          maximumMarks: record.maximumMarks,
          remarks: record.remarks 
        },
        { upsert: true, new: true }
      );
      savedCount++;
    }

    sendResponse(res, 200, `${savedCount} marks records saved successfully`);
  } catch (error) {
    next(error);
  }
};

exports.updateMarks = async (req, res, next) => {
  try {
    if (req.body.obtainedMarks > req.body.maximumMarks) {
      return next(new AppError('Obtained marks cannot be greater than maximum marks', 400));
    }

    const existing = await Marks.findById(req.params.id);
    if (!existing) {
      return next(new AppError('Marks record not found', 404));
    }

    await verifyProfessorSubject(req, existing.subject);

    const marks = await Marks.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    sendResponse(res, 200, 'Marks updated successfully', marks);
  } catch (error) {
    next(error);
  }
};

exports.deleteMarks = async (req, res, next) => {
  try {
    const marks = await Marks.findByIdAndDelete(req.params.id);
    if (!marks) {
      return next(new AppError('Marks record not found', 404));
    }
    sendResponse(res, 200, 'Marks deleted successfully');
  } catch (error) {
    next(error);
  }
};

// =================== Assignment & Practical Submissions ===================

// @desc    Get submission status for students in a subject
// @route   GET /api/marks/submissions
// @access  Private (ADMIN, PROFESSOR)
exports.getSubmissions = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return next(new AppError('subjectId is required', 400));
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

    const submissionRecords = await SubmissionStatus.find({ subject: subjectId });
    const statusMap = {};
    submissionRecords.forEach(s => {
      statusMap[s.student.toString()] = s;
    });

    const result = students.map(student => {
      const rec = statusMap[student._id.toString()];
      return {
        studentId: student._id,
        enrollmentNumber: student.enrollmentNumber,
        fullName: student.fullName,
        assignmentSubmitted: rec ? rec.assignmentSubmitted : false,
        assignmentRemarks: rec ? (rec.assignmentRemarks || '') : '',
        practicalSubmitted: rec ? rec.practicalSubmitted : false,
        practicalRemarks: rec ? (rec.practicalRemarks || '') : ''
      };
    });

    sendResponse(res, 200, 'Submissions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update bulk submission status
// @route   POST /api/marks/submissions/bulk
// @access  Private (ADMIN, PROFESSOR)
exports.saveBulkSubmissions = async (req, res, next) => {
  try {
    const { subjectId, records } = req.body;
    if (!subjectId || !records || !Array.isArray(records)) {
      return next(new AppError('subjectId and records array are required', 400));
    }

    await verifyProfessorSubject(req, subjectId);

    let saved = 0;
    for (const rec of records) {
      if (!rec.studentId) continue;
      await SubmissionStatus.findOneAndUpdate(
        { student: rec.studentId, subject: subjectId },
        {
          assignmentSubmitted: Boolean(rec.assignmentSubmitted),
          assignmentRemarks: rec.assignmentRemarks || '',
          practicalSubmitted: Boolean(rec.practicalSubmitted),
          practicalRemarks: rec.practicalRemarks || '',
          updatedBy: req.user.id
        },
        { upsert: true, new: true }
      );
      saved++;
    }

    sendResponse(res, 200, `${saved} submission records updated successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Student gets their own submission statuses
// @route   GET /api/marks/submissions/my
// @access  Private (STUDENT)
exports.getMySubmissions = async (req, res, next) => {
  try {
    const records = await SubmissionStatus.find({ student: req.user.studentId })
      .populate('subject', 'subjectName subjectCode semester branch')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Student submissions fetched', records);
  } catch (error) {
    next(error);
  }
};
