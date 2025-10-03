const Gig = require('../models/Gig');

exports.createGig = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can create gigs' });
    }
    const gig = await Gig.create({ provider: req.user.id, ...req.body });
    res.status(201).json(gig);
  } catch (err) {
    next(err);
  }
};

exports.getGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find().populate('provider', 'name role profilePic').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    next(err);
  }
};

exports.applyGig = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply' });
    }
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    if (gig.applicants.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already applied' });
    }

    gig.applicants.push(req.user.id);
    await gig.save();
    res.json({ message: 'Applied successfully' });
  } catch (err) {
    next(err);
  }
};

