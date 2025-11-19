const Post = require('../models/Post');
const Gig = require('../models/Gig');
const SkillCard = require('../models/SkillCard');
const User = require('../models/User');

async function popularity(req, res) {
  try {
    const userId = req.params.id;

    const posts = await Post.find({ author: userId });
    const gigs = await Gig.find({ provider: userId });
    const skills = await SkillCard.find({ owner: userId });

    let score = 0;

    posts.forEach((p) => {
      score += p.likes.length;
    });

    gigs.forEach((g) => {
      score += g.applicants.length;
    });

    score += skills.length;

    await User.findByIdAndUpdate(userId, { popularityScore: score });

    return res.json({ success: true, popularityScore: score });
  } catch (err) {
    console.error("Popularity Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { popularity };
