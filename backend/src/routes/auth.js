// src/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const createToken = (user) => {
  const payload = { id: user._id || user.id };
  return jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });
};

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, education, college } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email already registered." });

    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || "student",
      education,
      college,
    });

    await user.save();

    const token = createToken(user);
    // send minimal user object
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log("Login failed: user not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Stored password hash:", user.password);
    console.log("Entered password:", password);

    const match = await bcrypt.compare(password, user.password);
    console.log("bcrypt.compare result:", match);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me - return current logged-in user or null (200) if user doc missing
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    if (!userId) return res.status(200).json({ user: null });

    const user = await User.findById(userId).select("-password -__v").lean();
    if (!user) {
      console.warn(`GET /api/auth/me - token valid but user ${userId} not found in DB`);
      return res.status(200).json({ user: null });
    }

    return res.json({ user });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/auth/me — update profile info
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Pick only allowed editable fields
    const allowed = ["name", "bio", "linkedin", "education", "skills", "profilePic"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true })
      .select("-password -__v")
      .lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("PUT /api/auth/me error:", err);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

module.exports = router;
