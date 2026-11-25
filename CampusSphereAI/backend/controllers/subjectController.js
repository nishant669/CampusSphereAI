const Subject = require('../models/Subject');
const Professor = require('../models/Professor');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');

exports.getSubjects = async (req, res, next) => {
  try {
    const { branch, semester, course, search, page = 1, limit = 50 } = req.query;
    let query = { isActive: true };

    if (branch) query.branch = branch;
    if (semester) query.semester = semester;
    if (course) query.course = course;
    if (search) {
      query.$or = [
        { subjectName: { $regex: search, $options: 'i' } },
        { subjectCode: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: { path: 'assignedProfessor', select: 'fullName employeeId email' },
      sort: { subjectName: 1 }
    };

    const subjects = await Subject.paginate(query, options);
    sendResponse(res, 200, 'Subjects fetched successfully', subjects);
  } catch (error) {
    next(error);
  }
};

exports.getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('assignedProfessor', 'fullName employeeId email');
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }
    sendResponse(res, 200, 'Subject fetched successfully', subject);
  } catch (error) {
    next(error);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const { subjectCode, subjectName, semester, branch, course = 'B.Tech', academicYear, description, assignedProfessor } = req.body;

    const existingSubject = await Subject.findOne({ subjectCode: { $regex: new RegExp(`^${subjectCode.trim()}$`, 'i') } });
    if (existingSubject) {
      return next(new AppError('Subject code already exists', 400));
    }

    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase().trim(),
      subjectName: subjectName.trim(),
      semester: Number(semester),
      branch: branch.trim(),
      course: course.trim(),
      academicYear: academicYear.trim(),
      description: description ? description.trim() : '',
      assignedProfessor: assignedProfessor || undefined
    });

    // If assignedProfessor provided, add to professor's assignedSubjects array
    if (assignedProfessor) {
      await Professor.findByIdAndUpdate(assignedProfessor, {
        $addToSet: { assignedSubjects: subject._id }
      });
    }

    const populated = await Subject.findById(subject._id).populate('assignedProfessor', 'fullName employeeId email');
    sendResponse(res, 201, 'Subject created successfully', populated);
  } catch (error) {
    next(error);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const { subjectCode, subjectName, semester, branch, course, academicYear, description, assignedProfessor, isActive } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const oldProf = subject.assignedProfessor;

    if (subjectCode) subject.subjectCode = subjectCode.toUpperCase().trim();
    if (subjectName) subject.subjectName = subjectName.trim();
    if (semester !== undefined) subject.semester = Number(semester);
    if (branch) subject.branch = branch.trim();
    if (course) subject.course = course.trim();
    if (academicYear) subject.academicYear = academicYear.trim();
    if (description !== undefined) subject.description = description ? description.trim() : '';
    if (isActive !== undefined) subject.isActive = isActive;
    if (assignedProfessor !== undefined) subject.assignedProfessor = assignedProfessor || undefined;

    await subject.save();

    // If professor assignment changed, update Professor models
    if (assignedProfessor !== undefined && String(oldProf) !== String(assignedProfessor)) {
      if (oldProf) {
        await Professor.findByIdAndUpdate(oldProf, { $pull: { assignedSubjects: subject._id } });
      }
      if (assignedProfessor) {
        await Professor.findByIdAndUpdate(assignedProfessor, { $addToSet: { assignedSubjects: subject._id } });
      }
    }

    const updated = await Subject.findById(subject._id).populate('assignedProfessor', 'fullName employeeId email');
    sendResponse(res, 200, 'Subject updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    subject.isActive = false;
    await subject.save();

    if (subject.assignedProfessor) {
      await Professor.findByIdAndUpdate(subject.assignedProfessor, {
        $pull: { assignedSubjects: subject._id }
      });
    }

    sendResponse(res, 200, 'Subject deactivated successfully');
  } catch (error) {
    next(error);
  }
};
