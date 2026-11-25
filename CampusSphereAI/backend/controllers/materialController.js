const StudyMaterial = require('../models/StudyMaterial');
const Professor = require('../models/Professor');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/sendResponse');
const fs = require('fs');
const path = require('path');

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
      throw new AppError('You are only authorized to upload materials for your assigned subjects', 403);
    }
  }
};

exports.getMaterials = async (req, res, next) => {
  try {
    const { subjectId, materialType, semester, academicYear, search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (subjectId) query.subject = subjectId;
    if (materialType) query.materialType = materialType;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (search) query.title = { $regex: search, $options: 'i' };

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: [
        { path: 'subject', select: 'subjectName subjectCode semester branch' },
        { path: 'uploadedBy', select: 'name role' }
      ],
      sort: { uploadDate: -1 }
    };

    const materials = await StudyMaterial.paginate(query, options);
    sendResponse(res, 200, 'Materials fetched successfully', materials);
  } catch (error) {
    next(error);
  }
};

exports.uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const { title, description, subjectId, materialType, semester, academicYear } = req.body;

    await verifyProfessorSubject(req, subjectId);

    const material = await StudyMaterial.create({
      title,
      description,
      subject: subjectId,
      materialType,
      semester,
      academicYear,
      fileName: req.file.originalname,
      filePath: req.file.path.replace(/\\/g, '/'), // Normalize path
      fileSize: req.file.size,
      uploadedBy: req.user.id
    });

    sendResponse(res, 201, 'Material uploaded successfully', material);
  } catch (error) {
    // Clean up uploaded file if DB creation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file after failed DB save', err);
      });
    }
    next(error);
  }
};

exports.updateMaterial = async (req, res, next) => {
  try {
    // Only allow updating metadata, not the file itself
    const { title, description, materialType, semester, academicYear } = req.body;
    
    const material = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { title, description, materialType, semester, academicYear },
      { new: true, runValidators: true }
    );

    if (!material) {
      return next(new AppError('Material not found', 404));
    }

    sendResponse(res, 200, 'Material updated successfully', material);
  } catch (error) {
    next(error);
  }
};

exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return next(new AppError('Material not found', 404));
    }

    // Delete file from filesystem
    if (fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, 'Material deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.downloadMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return next(new AppError('Material not found', 404));
    }

    const absPath = path.resolve(material.filePath);
    
    if (!fs.existsSync(absPath)) {
      return next(new AppError('File not found on server', 404));
    }

    res.download(absPath, material.fileName);
  } catch (error) {
    next(error);
  }
};
