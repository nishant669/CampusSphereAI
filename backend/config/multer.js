const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const configuredUploadPath = process.env.FILE_UPLOAD_PATH || 'uploads';
const uploadPath = path.isAbsolute(configuredUploadPath)
  ? configuredUploadPath
  : path.resolve(__dirname, '..', configuredUploadPath);
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx|ppt|pptx|xls|xlsx|jpg|jpeg|png/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF, DOC, PPT, XLS, and image files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760 // 10MB default
  },
  fileFilter
});

module.exports = upload;
