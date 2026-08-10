const { validationResult } = require('express-validator');

// Runs after express-validator checks; returns a clean 400 if any failed
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

module.exports = validate;
