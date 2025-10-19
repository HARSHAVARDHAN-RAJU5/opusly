// backend/src/middleware/auth.js
// Auth middleware + verifyToken helper (final stable version with debug + role support)

const jwt = require("jsonwebtoken");
const User = require("../models/User");

function verifyToken(token) {
  if (!token) throw new Error("No token provided");
  const secret = process.env.JWT_SECRET || "secret";
  const cleaned = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  const decoded = jwt.verify(cleaned, secret);
  const id = decoded.id || decoded._id || decoded.userId || decoded.uid;
  if (!id) throw new Error("Invalid token payload");
  return { id: String(id), raw: decoded };
}

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log("authMiddleware: authHeader present:", !!authHeader);

    if (!authHeader) {
      console.log("authMiddleware: missing auth header");
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    console.log(
      "authMiddleware: token length:",
      token ? token.length : 0
    );

    let payload;
    try {
      payload = verifyToken(token);
      console.log("authMiddleware: token verified, userId:", payload.id);
    } catch (err) {
      console.error("authMiddleware: verify failed:", err.message);
      return res
        .status(401)
        .json({ success: false, message: "Invalid token" });
    }

    // Fetch user from DB to attach full info
    const user = await User.findById(payload.id).select("-password -__v");
    if (!user) {
      console.warn("authMiddleware: user not found in DB");
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // Attach normalized user data
    req.user = {
      id: String(user._id),
      role: (user.role || "").toLowerCase(),
      name: user.name || "",
      email: user.email || "",
    };
    req.userId = req.user.id;

    console.log(
      `authMiddleware: attached user => ${req.user.name} (${req.user.role})`
    );

    return next();
  } catch (err) {
    console.error("authMiddleware: unexpected error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
module.exports.verifyToken = verifyToken;
