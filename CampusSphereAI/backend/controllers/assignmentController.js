const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

exports.list = async (req, res, next) => {
  try {
    const assignments = await Assignment.find().populate('subject', 'subjectName subjectCode').populate('createdBy', 'name').sort({ dueDate: 1 });
    const ids = assignments.map(a => a._id);
    const mine = req.user.role === 'STUDENT'
      ? await AssignmentSubmission.find({ assignment: { $in: ids }, student: req.user.id }).select('assignment status marks feedback submittedAt')
      : [];
    const byAssignment = new Map(mine.map(s => [String(s.assignment), s]));
    res.json({ status: 'success', data: assignments.map(a => ({
      ...a.toObject(), mySubmission: byAssignment.get(String(a._id)) || null
    })) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, subjectId, semester, dueDate } = req.body;
    if (!title || !subjectId || !semester || !dueDate) return res.status(400).json({ message: 'Title, subject, semester and due date are required.' });
    const assignment = await Assignment.create({
      title, description, subject: subjectId, semester: Number(semester), dueDate: new Date(dueDate),
      attachmentName: req.file?.originalname, attachmentPath: req.file?.path, createdBy: req.user.id
    });
    res.status(201).json({ status: 'success', data: assignment });
  } catch (e) { next(e); }
};

exports.submit = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please attach your assignment file.' });
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    const now = new Date();
    const status = now > new Date(assignment.dueDate) ? 'LATE' : 'SUBMITTED';
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user.id },
      { $set: { fileName: req.file.originalname, filePath: req.file.path, submittedAt: now, status, marks: null, feedback: '' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ status: 'success', data: submission, message: 'Assignment submitted.' });
  } catch (e) { next(e); }
};

exports.submissions = async (req, res, next) => {
  try {
    const rows = await AssignmentSubmission.find({ assignment: req.params.id })
      .populate('student', 'name email').populate('assignment', 'title dueDate').sort({ submittedAt: -1 });
    res.json({ status: 'success', data: rows });
  } catch (e) { next(e); }
};

exports.grade = async (req, res, next) => {
  try {
    const marks = Number(req.body.marks);
    if (!Number.isFinite(marks) || marks < 0 || marks > 100) return res.status(400).json({ message: 'Marks must be between 0 and 100.' });
    const row = await AssignmentSubmission.findByIdAndUpdate(req.params.submissionId, {
      marks, feedback: String(req.body.feedback || '').slice(0, 2000), status: 'GRADED', gradedBy: req.user.id
    }, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ message: 'Submission not found.' });
    res.json({ status: 'success', data: row });
  } catch (e) { next(e); }
};

exports.download = async (req, res, next) => {
  try {
    const row = req.params.kind === 'assignment'
      ? await Assignment.findById(req.params.id)
      : await AssignmentSubmission.findById(req.params.id);
    if (!row) return res.status(404).json({ message: 'File not found.' });
    if (req.params.kind === 'submission' && req.user.role === 'STUDENT' && String(row.student) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only download your own submission.' });
    }
    if (!['assignment', 'submission'].includes(req.params.kind)) return res.status(400).json({ message: 'Invalid file type.' });
    const filePath = req.params.kind === 'assignment' ? row.attachmentPath : row.filePath;
    const fileName = req.params.kind === 'assignment' ? row.attachmentName : row.fileName;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ message: 'File is unavailable.' });
    res.download(path.resolve(filePath), fileName || 'download');
  } catch (e) { next(e); }
};
