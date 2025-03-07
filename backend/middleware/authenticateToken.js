import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET; // Use environment variable for consistency


export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET,async (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    await User.findByIdAndUpdate(user.id, { isOnline: true, lastSeen: new Date() })
    next();
  });
};

export default authenticateToken;
