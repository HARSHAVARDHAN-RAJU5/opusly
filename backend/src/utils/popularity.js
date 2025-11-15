const Post = require('../models/Post');
const Gig = require('../models/Gig');
const SkillCard = require('../models/SkillCard');
const User = require('../models/User');

async function calculatePopularity(userId) {
  const posts = await Post.find({ author: userId });
  const gigs = await Gig.find({ provider: userId });
  const skills = await SkillCard.find({ owner: userId }); // make sure field is 'owner' not 'user'

  let score = 0;

  posts.forEach((p) => {
    score += p.likes.length;
  });

  gigs.forEach((g) => {
    score += g.applicants.length;
  });

  score += skills.length;

  await User.findByIdAndUpdate(userId, { popularityScore: score });

  return score;
}

module.exports = { calculatePopularity };
