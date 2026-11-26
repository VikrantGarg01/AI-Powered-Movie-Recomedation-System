import express from 'express';
import { uploadAvatarFile } from '../controllers/uploadController.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarFile);

export default router;
