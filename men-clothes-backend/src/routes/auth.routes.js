import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.js';
import { updateProfile, changePassword } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;