const jwt = require("jsonwebtoken");

/**
 * Express middleware to protect routes.
 * Validates JWT and attaches { id, role } to req.user.
 */
module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

/**
 * Helper for verifying token manually (e.g. Socket.io)
 */
module.exports.verifyToken = (token) => {
  if (!token) throw new Error("No token provided");
  const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  return jwt.verify(raw, process.env.JWT_SECRET);
};
