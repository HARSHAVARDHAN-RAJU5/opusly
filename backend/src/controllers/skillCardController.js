// src/controllers/skillCardController.js
const SkillCard = require('../models/SkillCard'); // adjust path if needed
const User = require('../models/User');

function toArraySkills(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [String(input).trim()].filter(Boolean);
}

exports.getSkillCards = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const list = await SkillCard.find({ user: userId }).lean().exec();
    return res.json({ success: true, skillcards: list });
  } catch (err) {
    console.error('getSkillCards error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: 'Server error', error: err?.message || String(err) });
  }
};

exports.createSkillCard = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Accept either "name" or "title" from frontend
    const rawName = (req.body?.name ?? req.body?.title ?? "").toString().trim();
    const level = (req.body?.level ?? 'Beginner').toString();
    const skills = toArraySkills(req.body?.skills ?? req.body?.tags ?? req.body?.skillList);

    if (!rawName) {
      return res.status(400).json({ success: false, message: 'Missing required field: name/title' });
    }
    if (!level) {
      return res.status(400).json({ success: false, message: 'Missing required field: level' });
    }
    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: 'Skills must be an array or comma-separated string' });
    }

    // enforce max 3 skillcards
    const count = await SkillCard.countDocuments({ user: userId });
    if (count >= 3) return res.status(400).json({ success: false, message: 'You already have 3 SkillCards' });

    const skillCard = new SkillCard({
      // set both title (what schema needs) and name (compat)
      title: rawName,
      name: rawName,
      level,
      skills,
      user: userId,
    });

    const saved = await skillCard.save();
    return res.status(201).json({ success: true, skillCard: saved });
  } catch (err) {
    console.error('createSkillCard error:', err && err.stack ? err.stack : err);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating SkillCard',
      error: err?.message || String(err),
    });
  }
};

exports.updateSkillCard = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Missing skillcard id' });

    const sc = await SkillCard.findById(id);
    if (!sc) return res.status(404).json({ success: false, message: 'SkillCard not found' });
    if (sc.user && sc.user.toString() !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

    // handle skills & title/name updates safely
    if ('skills' in req.body) sc.skills = toArraySkills(req.body.skills);
    const newName = (req.body?.name ?? req.body?.title);
    if (newName) {
      sc.title = newName;
      sc.name = newName;
    }
    if ('level' in req.body) sc.level = req.body.level;

    await sc.save();
    return res.json({ success: true, skillCard: sc });
  } catch (err) {
    console.error('updateSkillCard error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
};

exports.deleteSkillCard = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const sc = await SkillCard.findById(req.params.id);
    if (!sc) return res.status(404).json({ success: false, message: 'SkillCard not found' });
    if (sc.user && sc.user.toString() !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

    await sc.deleteOne();
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('deleteSkillCard error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
};
