const Post = require("../models/Post");
const Gig = require("../models/Gig");
const SkillCard = require("../models/SkillCard");
const User = require("../models/User");

async function calculatePopularity(userId) {
  try {
    const posts = await Post.find({ author: userId });
    const gigs = await Gig.find({ createdBy: userId });
    const skillcards = await SkillCard.find({ user: userId });

    let score = 0;

    posts.forEach((p) => {
      score += p.likes?.length || 0;
    });

    gigs.forEach((g) => {
      score += g.applicants?.length || 0;
    });

    score += skillcards.reduce(
      (sum, sc) => sum + (sc.endorsedBy?.length || 0),
      0
    );

    await User.findByIdAndUpdate(
      userId,
      { $set: { popularity: score } },
      { new: true }
    );

    return score;
  } catch (err) {
    console.error("Popularity Error:", err);
    return 0;
  }
}

async function getPopularity(req, res) {
  try {
    const userId = req.params.id;
    const score = await calculatePopularity(userId);

    return res.json({
      success: true,
      popularity: score,
    });
  } catch (err) {
    console.error("getPopularity Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  calculatePopularity,
  getPopularity,
};
