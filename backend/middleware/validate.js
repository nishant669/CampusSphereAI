const { validationResult } = require('express-validator');
const { sendError } = require('../utils/sendResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation Error', errors.array());
  }
  next();
};

module.exports = validate;
