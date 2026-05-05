import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
};