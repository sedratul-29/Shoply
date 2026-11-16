const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { validate } = require('../middleware/validate');
const { protect, signToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const router = express.Router();

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// Used so login takes the same time whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const emailRule = z.string().trim().toLowerCase().email('Enter a valid email').max(120);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60),
  email: emailRule,
  password: passwordRule,
});

const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1).max(72),
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordRule,
});

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.exists({ email })) throw new AppError('Email is already registered', 409);

    // role is never read from the request, so nobody can self-register as admin
    const user = await User.create({ name, email, password });
    setAuthCookie(res, signToken(user));
    res.status(201).json({ user });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isLocked()) {
      throw new AppError('Too many failed attempts. Please try again later', 423);
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      user.failedLogins += 1;
      if (user.failedLogins >= MAX_FAILED_LOGINS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLogins = 0;
      }
      await user.save({ validateBeforeSave: false });
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) throw new AppError('This account has been disabled', 403);

    if (user.failedLogins || user.lockUntil) {
      user.failedLogins = 0;
      user.lockUntil = undefined;
      await user.save({ validateBeforeSave: false });
    }

    setAuthCookie(res, signToken(user));
    res.json({ user });
  })
);

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

router.put(
  '/me',
  protect,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    req.user.name = req.body.name;
    await req.user.save();
    res.json({ user: req.user });
  })
);

router.put(
  '/password',
  protect,
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      throw new AppError('Current password is incorrect', 400);
    }
    user.password = req.body.newPassword;
    user.tokenVersion += 1; // logs out every other device
    await user.save();
    setAuthCookie(res, signToken(user));
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
