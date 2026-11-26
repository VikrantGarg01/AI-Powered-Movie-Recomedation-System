import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationOtp: {
      type: String,
      select: false
    },
    verificationOtpExpires: {
      type: Date,
      select: false
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    favoriteGenres: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Mongoose Pre-Save Middleware for Bcrypt Password Hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance Method to issue signed JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'cinepulse_super_secret_jwt_key_2026_academic_demo',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Instance Method to generate a 6-digit OTP code with 10 minutes expiry
UserSchema.methods.generateVerificationOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationOtp = otp;
  this.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  return otp;
};

// Instance Method to check if entered OTP is valid and not expired
UserSchema.methods.checkVerificationOtp = function (enteredOtp) {
  const cleanEntered = enteredOtp ? enteredOtp.toString().trim() : '';
  if (!this.verificationOtp || !this.verificationOtpExpires) {
    return false;
  }
  if (new Date() > this.verificationOtpExpires) {
    return false;
  }
  return this.verificationOtp.trim() === cleanEntered;
};

export const User = mongoose.model('User', UserSchema);
