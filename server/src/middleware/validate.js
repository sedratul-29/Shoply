const AppError = require('../utils/AppError');
const { OBJECT_ID_RE } = require('../utils/helpers');

// validate(schema) -> parses req.body (default) or req.query with zod.
// Unknown fields are stripped, which also prevents mass-assignment.
const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    req[source] = result.data;
    next();
  };

// Rejects malformed ObjectIds before they reach MongoDB.
const validateId =
  (param = 'id') =>
  (req, _res, next) => {
    if (!OBJECT_ID_RE.test(req.params[param] || '')) {
      return next(new AppError('Invalid id', 400));
    }
    next();
  };

module.exports = { validate, validateId };
