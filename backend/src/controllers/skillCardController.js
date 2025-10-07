// src/controllers/skillCardController.js
const SkillCard = require("../models/SkillCard");

exports.createSkillCard = async (req, res) => {
  try {
    console.log("createSkillCard called - user:", req.user && req.user.id);
    console.log("createSkillCard body:", req.body);

    const userId = req.user && req.user.id;
    const { title, level, skills } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    // enforce maximum of 3 skillcards per user
    const existingCards = await SkillCard.find({ user: userId });
    if (existingCards.length >= 3) {
      return res.status(400).json({ success: false, message: "You can only create up to 3 SkillCards." });
    }

    const newCard = await SkillCard.create({
      user: userId,
      title: title.trim(),
      level: level || "Beginner",
      skills: Array.isArray(skills) ? skills.map(s => String(s)) : [],
    });

    console.log("SkillCard created id:", newCard._id);
    res.status(201).json({
      success: true,
      message: "SkillCard created successfully",
      skillcard: newCard,
    });
  } catch (err) {
    console.error("createSkillCard error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.getSkillCards = async (req, res) => {
  try {
    console.log("getSkillCards called - user:", req.user && req.user.id);
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const cards = await SkillCard.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, skillcards: cards });
  } catch (err) {
    console.error("getSkillCards error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateSkillCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, level, skills } = req.body;

    const card = await SkillCard.findById(id);
    if (!card) return res.status(404).json({ success: false, message: "SkillCard not found" });

    // optional: verify ownership
    if (String(card.user) !== String(req.user && req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    card.title = title ?? card.title;
    card.level = level ?? card.level;
    card.skills = Array.isArray(skills) ? skills.map(s => String(s)) : card.skills;

    await card.save();

    res.json({ success: true, skillcard: card });
  } catch (err) {
    console.error("updateSkillCard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteSkillCard = async (req, res) => {
  try {
    const { id } = req.params;
    const card = await SkillCard.findById(id);
    if (!card) return res.status(404).json({ success: false, message: "SkillCard not found" });

    // verify ownership
    if (String(card.user) !== String(req.user && req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await card.remove();
    res.json({ success: true, message: "SkillCard deleted" });
  } catch (err) {
    console.error("deleteSkillCard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
