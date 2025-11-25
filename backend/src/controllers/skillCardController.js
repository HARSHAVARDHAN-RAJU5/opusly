// src/controllers/skillCardController.js

const SkillCard = require("../models/SkillCard");
const User = require("../models/User");
const { calculatePopularity } = require("../utils/popularity");

function toArraySkills(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(input).trim()].filter(Boolean);
}

exports.getSkillCards = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const list = await SkillCard.find({ user: userId })
      .lean()
      .exec();

    return res.json({ success: true, skillcards: list });
  } catch (err) {
    console.error("getSkillCards error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.createSkillCard = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const rawName = String(
      req.body?.name ??
        req.body?.title ??
        ""
    ).trim();

    const level = String(
      req.body?.level ?? "Beginner"
    );

    const skills = toArraySkills(
      req.body?.skills ??
        req.body?.tags ??
        req.body?.skillList
    );

    if (!rawName) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: name/title",
      });
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: "Skills must be an array or comma-separated string",
      });
    }

    // limit: max 3 skillcards
    const count = await SkillCard.countDocuments({
      user: userId,
    });
    if (count >= 3) {
      return res.status(400).json({
        success: false,
        message: "You already have 3 SkillCards",
      });
    }

    const skillCard = new SkillCard({
      title: rawName,
      name: rawName,
      level,
      skills,
      user: userId,
      endorsedBy: [],
    });

    const saved = await skillCard.save();

    return res.status(201).json({
      success: true,
      skillCard: saved,
    });
  } catch (err) {
    console.error("createSkillCard error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating SkillCard",
      error: err.message,
    });
  }
};

exports.updateSkillCard = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = req.params.id;
    const sc = await SkillCard.findById(id);

    if (!sc) {
      return res.status(404).json({
        success: false,
        message: "SkillCard not found",
      });
    }

    if (sc.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if ("skills" in req.body) {
      sc.skills = toArraySkills(req.body.skills);
    }

    const newName = req.body?.name ?? req.body?.title;
    if (newName) {
      sc.name = newName;
      sc.title = newName;
    }

    if ("level" in req.body) sc.level = req.body.level;

    await sc.save();

    return res.json({ success: true, skillCard: sc });
  } catch (err) {
    console.error("updateSkillCard error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteSkillCard = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const sc = await SkillCard.findById(req.params.id);

    if (!sc) {
      return res.status(404).json({
        success: false,
        message: "SkillCard not found",
      });
    }

    if (sc.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    await sc.deleteOne();

    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteSkillCard error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.endorseSkill = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const skillId = req.params.id;

    const skill = await SkillCard.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: "SkillCard not found" });
    }

    const ownerId = skill.user.toString();

    if (ownerId === loggedInUser) {
      return res
        .status(400)
        .json({ message: "You cannot endorse yourself" });
    }

    if (!Array.isArray(skill.endorsedBy)) {
      skill.endorsedBy = [];
    }

    if (skill.endorsedBy.includes(loggedInUser)) {
      return res
        .status(400)
        .json({ message: "Already endorsed" });
    }

    skill.endorsedBy.push(loggedInUser);
    await skill.save();

    // Increase popularity of skill owner
    await calculatePopularity(ownerId);

    return res.json({
      success: true,
      message: "Endorsed successfully",
    });
  } catch (err) {
    console.error("endorseSkill error:", err.stack || err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.unendorseSkill = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const skillId = req.params.id;

    const skill = await SkillCard.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: "SkillCard not found" });
    }

    if (!Array.isArray(skill.endorsedBy)) {
      skill.endorsedBy = [];
    }

    skill.endorsedBy = skill.endorsedBy.filter(
      (u) => u.toString() !== loggedInUser
    );

    await skill.save();

    // decrease popularity
    await calculatePopularity(skill.user);

    return res.json({
      success: true,
      message: "Unendorsed successfully",
    });
  } catch (err) {
    console.error("unendorseSkill error:", err.stack || err);
    return res.status(500).json({
      message: err.message,
    });
  }
};
