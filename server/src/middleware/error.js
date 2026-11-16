const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // Validation errors from zod
  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return res.status(400).json({
      message: errors[0] ? `${errors[0].field ? errors[0].field + ': ' : ''}${errors[0].message}` : 'Invalid input',
      errors,
    });
  }

  // Mongo duplicate key (e.g. email already registered)
  if (err && err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use' });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid value supplied' });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }

  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }

  const status = err.status && Number.isInteger(err.status) ? err.status : 500;

  if (status >= 500) {
    console.error(err); // log details on the server only
  }

  res.status(status).json({
    message: status >= 500 ? 'Something went wrong on our side' : err.message,
  });
};

module.exports = { notFound, errorHandler };
