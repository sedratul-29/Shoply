const AppError = require('../utils/AppError');

// Extra CSRF defence on top of SameSite cookies + strict CORS:
// every state-changing request must carry a custom header. Browsers will not
// let another website add this header without a CORS preflight, which our
// CORS policy rejects.
module.exports = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return next(new AppError('Missing required request header', 403));
  }
  next();
};
