import { verifyToken } from '../utils/jwt.js';

export const protect = async (req, res, next) => {
  let token;

  // Get token from cookies or Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }

  req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
  next();
};