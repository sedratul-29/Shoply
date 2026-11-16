const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), v: user.tokenVersion }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable by JavaScript -> protects against XSS token theft
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // protects against CSRF on cross-site requests
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

// Requires a valid login. Attaches the user to req.user.
const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies && req.cookies[COOKIE_NAME];
  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) token = header.slice(7);
  if (!token) throw new AppError('Please log in to continue', 401);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Session expired or invalid. Please log in again', 401);
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive || user.tokenVersion !== payload.v) {
    throw new AppError('Session expired or invalid. Please log in again', 401);
  }

  req.user = user;
  next();
});

// Role-based authorization, e.g. restrictTo('admin')
const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to do that', 403));
    }
    next();
  };

module.exports = { protect, restrictTo, signToken, setAuthCookie, clearAuthCookie };
