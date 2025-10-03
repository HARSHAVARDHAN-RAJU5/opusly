const jwt = require('jsonwebtoken');

/**
 * Verify a JWT and return the decoded payload.
 * Throws an error if token is missing/invalid/expired.
 * Useful for Socket.io auth or other non-Express uses.
 */
const verifyToken = (token) => {
  if (!token) throw new Error('No token provided');
  // if token was passed like "Bearer <token>", strip prefix
  const raw = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
  return jwt.verify(raw, process.env.JWT_SECRET);
};

/**
 * Express middleware to protect routes.
 * Expects Authorization: Bearer <token>
 * On success sets req.user = { id, role } (from token payload).
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // attach minimal user info to req for downstream handlers
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Export middleware as default and attach helper for socket usage
module.exports = authMiddleware;
module.exports.verifyToken = verifyToken;
