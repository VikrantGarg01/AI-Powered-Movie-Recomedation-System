import { User } from '../models/User.js';

// @desc    Upload avatar image file
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatarFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Update user profile avatar if authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { avatar: fileUrl });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: fileUrl
    });
  } catch (error) {
    next(error);
  }
};
