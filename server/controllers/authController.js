import { User } from '../models/User.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import { logger } from '../config/logger.js';

// @desc    Register a new user & dispatch verification OTP
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, favoriteGenres } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail }).select('+verificationOtp +verificationOtpExpires');

    if (existingUser) {
      // If user already verified, prevent duplicate registration
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email already exists and is verified. Please sign in.'
        });
      }

      // If user exists but was never verified, update info and re-send OTP
      existingUser.name = name.trim();
      existingUser.password = password;
      if (favoriteGenres) existingUser.favoriteGenres = favoriteGenres;

      const otp = existingUser.generateVerificationOtp();
      await existingUser.save();

      try {
        await sendVerificationEmail({
          to: existingUser.email,
          name: existingUser.name,
          code: otp,
          type: 'register'
        });
      } catch (mailError) {
        logger.error(`Failed to send verification email: ${mailError.message}`);
      }

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: existingUser.email,
        message: 'A verification code has been sent to your email. Please verify to activate your account.'
      });
    }

    // Create unverified user and dispatch OTP
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      favoriteGenres: favoriteGenres || ['Sci-Fi', 'Action', 'Thriller', 'Drama'],
      isVerified: false
    });

    const otp = user.generateVerificationOtp();
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: otp,
        type: 'register'
      });
    } catch (mailError) {
      logger.error(`Failed to send verification email: ${mailError.message}`);
    }

    res.status(201).json({
      success: true,
      requireVerification: true,
      email: user.email,
      message: 'Verification code sent to your email. Enter the code to activate your account.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify registration OTP code & activate user account
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and 6-digit verification code'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail }).select('+verificationOtp +verificationOtpExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    const isValid = user.checkVerificationOtp(cleanOtp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code. Please request a new code.'
      });
    }

    // Activate and clear OTP
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to Movie+.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteGenres: user.favoriteGenres,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login existing user & return JWT (or prompt verification if unverified/2FA)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password +verificationOtp +verificationOtpExpires');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password mismatch.'
      });
    }

    // Privacy & verification check: If user account is not verified, require verification
    if (!user.isVerified) {
      const otp = user.generateVerificationOtp();
      await user.save();

      try {
        await sendVerificationEmail({
          to: user.email,
          name: user.name,
          code: otp,
          type: 'register'
        });
      } catch (mailError) {
        logger.error(`Failed to send verification email: ${mailError.message}`);
      }

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        error: 'Your account is not verified yet. A verification code has been sent to your email.'
      });
    }

    // If 2FA is explicitly enabled for this account
    if (user.twoFactorEnabled) {
      const otp = user.generateVerificationOtp();
      await user.save();

      try {
        await sendVerificationEmail({
          to: user.email,
          name: user.name,
          code: otp,
          type: 'login'
        });
      } catch (mailError) {
        logger.error(`Failed to send 2FA login email: ${mailError.message}`);
      }

      return res.status(200).json({
        success: true,
        requireOtp: true,
        email: user.email,
        message: 'Security verification code sent to your email.'
      });
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteGenres: user.favoriteGenres,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2-Step Login OTP
// @route   POST /api/auth/verify-login-otp
// @access  Public
export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and verification code'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+verificationOtp +verificationOtpExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isValid = user.checkVerificationOtp(otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login identity verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteGenres: user.favoriteGenres,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP code to user's email
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res, next) => {
  try {
    const { email, type = 'register' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your email address'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+verificationOtp +verificationOtpExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email'
      });
    }

    const otp = user.generateVerificationOtp();
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: otp,
        type
      });
    } catch (mailError) {
      logger.error(`Resend OTP mail failed: ${mailError.message}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please check SMTP settings or try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteGenres: user.favoriteGenres,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile / favorite genres / 2FA setting
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, favoriteGenres, avatar, twoFactorEnabled } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (favoriteGenres) fieldsToUpdate.favoriteGenres = favoriteGenres;
    if (avatar) fieldsToUpdate.avatar = avatar;
    if (typeof twoFactorEnabled === 'boolean') fieldsToUpdate.twoFactorEnabled = twoFactorEnabled;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteGenres: user.favoriteGenres,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    next(error);
  }
};
