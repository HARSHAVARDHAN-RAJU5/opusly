// src/middleware/auth.js
// Auth middleware + verifyToken helper with extra debug logging.

const jwt = require("jsonwebtoken");

function verifyToken(token) {
  if (!token) throw new Error("No token provided");
  const secret = process.env.JWT_SECRET || "secret";
  const decoded = jwt.verify(token, secret);
  const id = decoded.id || decoded._id || decoded.userId || decoded.uid;
  if (!id) throw new Error("Invalid token payload");
  return { id: String(id), raw: decoded };
}

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log("authMiddleware: authHeader:", !!authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("authMiddleware: no bearer token present -> 401");
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("authMiddleware: token length:", token ? token.length : 0);

    let payload;
    try {
      payload = verifyToken(token);
      console.log("authMiddleware: token verified, userId:", payload.id);
    } catch (err) {
      console.error("authMiddleware: token verify failed:", err && err.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = { id: payload.id };
    return next();
  } catch (err) {
    console.error("auth middleware unexpected error:", err && err.message);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
module.exports.verifyToken = verifyToken;
