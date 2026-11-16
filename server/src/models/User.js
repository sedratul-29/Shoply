const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    // Bumped on password change / deactivation so old JWTs stop working.
    tokenVersion: { type: Number, default: 0 },
    // Brute-force protection
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    delete ret.tokenVersion;
    delete ret.failedLogins;
    delete ret.lockUntil;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
