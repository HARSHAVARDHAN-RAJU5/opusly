const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const User = require("../models/User");
const auth = require("../middleware/auth");

// signup
router.post("/signup", signup);

// login
router.post("/login", login);

// get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error in /auth/me:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
