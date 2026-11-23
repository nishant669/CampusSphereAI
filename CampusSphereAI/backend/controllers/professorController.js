const Professor = require('../models/Professor');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');

// @desc    Get currently logged in professor profile
// @route   GET /api/professors/me
// @access  Private (PROFESSOR)
exports.getMe = async (req, res, next) => {
  try {
    let professor;
    if (req.user.professorId) {
      professor = await Professor.findById(req.user.professorId).populate('assignedSubjects');
    } else {
      professor = await Professor.findOne({ userId: req.user.id }).populate('assignedSubjects');
    }

    if (!professor) {
      return next(new AppError('Professor profile not found', 404));
    }

    sendResponse(res, 200, 'Professor profile retrieved', professor);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all professors (Paginated)
// @route   GET /api/professors
// @access  Private (ADMIN)
exports.getProfessors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', course = '', status = '' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;
    if (course) query.course = course;
    if (status) query.status = status;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: { path: 'assignedSubjects', select: 'subjectCode subjectName semester branch course' }
    };

    const professors = await Professor.paginate(query, options);
    sendResponse(res, 200, 'Professors retrieved successfully', professors);
  } catch (error) {
    next(error);
  }
};

// @desc    Get professor by ID
// @route   GET /api/professors/:id
// @access  Private (ADMIN)
exports.getProfessorById = async (req, res, next) => {
  try {
    const professor = await Professor.findById(req.params.id).populate('assignedSubjects');
    if (!professor) {
      return next(new AppError('Professor not found', 404));
    }
    sendResponse(res, 200, 'Professor retrieved successfully', professor);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate / Create Professor ID (Admin)
// @route   POST /api/professors
// @access  Private (ADMIN)
exports.createProfessor = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      employeeId,
      phone,
      course = 'B.Tech',
      department = 'CSE',
      assignedSubjects = [],
      password
    } = req.body;

    if (!email || !fullName) {
      return next(new AppError('Full name and email are required', 400));
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanEmpId = (employeeId || `PROF${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();

    // Check existing
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 409));
    }

    const existingProf = await Professor.findOne({ employeeId: cleanEmpId });
    if (existingProf) {
      return next(new AppError('Professor with this Employee ID already exists', 409));
    }

    const tempPassword = password || 'Prof@123';
    if (tempPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    // 1. Create User
    const user = await User.create({
      name: fullName.trim(),
      email: cleanEmail,
      password: tempPassword,
      role: 'PROFESSOR',
      isActive: true
    });

    // 2. Create Professor
    const professor = await Professor.create({
      userId: user._id,
      employeeId: cleanEmpId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      course: course.trim(),
      department: department.trim(),
      assignedSubjects,
      status: 'ACTIVE'
    });

    // 3. Link assigned subjects
    if (assignedSubjects && assignedSubjects.length > 0) {
      await Subject.updateMany(
        { _id: { $in: assignedSubjects } },
        { $set: { assignedProfessor: professor._id } }
      );
    }

    const populated = await Professor.findById(professor._id).populate('assignedSubjects');
    sendResponse(res, 201, 'Professor ID generated successfully', populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Professor (Admin)
// @route   PUT /api/professors/:id
// @access  Private (ADMIN)
exports.updateProfessor = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      course,
      department,
      assignedSubjects,
      status,
      password
    } = req.body;

    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return next(new AppError('Professor not found', 404));
    }

    // Update Professor fields
    if (fullName) professor.fullName = fullName.trim();
    if (phone !== undefined) professor.phone = phone.trim();
    if (course) professor.course = course.trim();
    if (department) professor.department = department.trim();
    if (status) professor.status = status;

    if (assignedSubjects !== undefined) {
      // Remove old assignments
      await Subject.updateMany(
        { assignedProfessor: professor._id },
        { $unset: { assignedProfessor: '' } }
      );
      // Assign new
      professor.assignedSubjects = assignedSubjects;
      if (assignedSubjects.length > 0) {
        await Subject.updateMany(
          { _id: { $in: assignedSubjects } },
          { $set: { assignedProfessor: professor._id } }
        );
      }
    }

    // Update User email/name/password if changed
    const user = await User.findById(professor.userId).select('+password');
    if (user) {
      if (fullName) user.name = fullName.trim();
      if (email && email.toLowerCase().trim() !== professor.email) {
        const cleanEmail = email.toLowerCase().trim();
        const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (emailExists) {
          return next(new AppError('Email already taken by another user', 409));
        }
        user.email = cleanEmail;
        professor.email = cleanEmail;
      }
      if (password && password.trim().length >= 6) {
        user.password = password.trim();
      }
      if (status) {
        user.isActive = status === 'ACTIVE';
      }
      await user.save();
    }

    await professor.save();
    const updated = await Professor.findById(professor._id).populate('assignedSubjects');
    sendResponse(res, 200, 'Professor updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (Deactivate) Professor (Admin)
// @route   DELETE /api/professors/:id
// @access  Private (ADMIN)
exports.deleteProfessor = async (req, res, next) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return next(new AppError('Professor not found', 404));
    }

    professor.status = 'INACTIVE';
    await professor.save();

    await User.findByIdAndUpdate(professor.userId, { isActive: false });

    // Unassign subjects
    await Subject.updateMany(
      { assignedProfessor: professor._id },
      { $unset: { assignedProfessor: '' } }
    );

    sendResponse(res, 200, 'Professor deactivated successfully');
  } catch (error) {
    next(error);
  }
};
