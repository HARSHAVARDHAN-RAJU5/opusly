const SkillCard = require('../models/SkillCard');

exports.createSkillCard = async (req, res, next) => {
  try {
    const skill = await SkillCard.create({ user: req.user.id, ...req.body });
    res.status(201).json(skill);
  } catch (err) {
    next(err);
  }
};

exports.getSkillCards = async (req, res, next) => {
  try {
    const skills = await SkillCard.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    next(err);
  }
};

exports.updateSkillCard = async (req, res, next) => {
  try {
    const skill = await SkillCard.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!skill) return res.status(404).json({ message: 'Skill not found or not yours' });
    res.json(skill);
  } catch (err) {
    next(err);
  }
};

exports.deleteSkillCard = async (req, res, next) => {
  try {
    const skill = await SkillCard.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!skill) return res.status(404).json({ message: 'Skill not found or not yours' });
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    next(err);
  }
};
