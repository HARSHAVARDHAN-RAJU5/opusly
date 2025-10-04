const Gig = require('../models/Gig');

// create gig (provider only)
const createGig = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can create gigs' });
    }
    const gig = await Gig.create({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      stipend: req.body.stipend,
      duration: req.body.duration,
      createdBy: req.user.id,
      creatorRole: req.user.role,
    });
    res.status(201).json(gig);
  } catch (err) {
    next(err);
  }
};

// get all gigs (conditionally populate only if schema has createdBy)
const getAllGigs = async (req, res, next) => {
  try {
    const shouldPopulate = !!Gig.schema.path('createdBy');
    let query = Gig.find();
    if (shouldPopulate) query = query.populate('createdBy', 'name role');
    const gigs = await query.exec();
    res.json(gigs);
  } catch (err) {
    next(err);
  }
};

// get gig by id
const getGigById = async (req, res, next) => {
  try {
    const shouldPopulate = !!Gig.schema.path('createdBy');
    let query = Gig.findById(req.params.id);
    if (shouldPopulate) query = query.populate('createdBy', 'name role');
    const gig = await query.exec();
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    next(err);
  }
};

// update gig (only creator)
const updateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.createdBy && gig.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });
    Object.assign(gig, req.body);
    await gig.save();
    res.json(gig);
  } catch (err) {
    next(err);
  }
};

// delete gig (only creator)
const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.createdBy && gig.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });
    await gig.deleteOne();
    res.json({ message: 'Gig deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
};
