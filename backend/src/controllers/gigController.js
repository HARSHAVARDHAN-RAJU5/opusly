// src/controllers/gigController.js
const Gig = require('../models/Gig');
const User = require('../models/User');
const SkillCard = require('../models/SkillCard');

//  CREATE GIG
const createGig = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userId = req.user.id;
    const userRole = req.user.role || 'provider';
    const requestedType =
      req.body.gigType || (userRole === 'provider' ? 'internship' : 'freelance');

    if (requestedType === 'internship' && userRole !== 'provider') {
      return res
        .status(403)
        .json({ success: false, message: 'Only providers can post internships' });
    }

    const gigData = {
      title: req.body.title?.trim() || '',
      description: req.body.description || '',
      location: req.body.location || '',
      createdBy: userId,
      postedByRole: userRole,
      gigType: requestedType,
      applicants: [],
      skills: req.body.skills || [],
    };

    if (userRole === 'provider') {
      gigData.stipend = req.body.stipend || '';
      gigData.duration = req.body.duration || '';
    } else if (userRole === 'student') {
      gigData.rate = req.body.rate || '';
      gigData.availability = req.body.availability || '';
    }

    if (!gigData.title)
      return res
        .status(400)
        .json({ success: false, message: 'Title is required' });

    const gig = await Gig.create(gigData);
    return res.status(201).json({ success: true, gig });
  } catch (err) {
    console.error('createGig error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  GET ALL GIGS
const getAllGigs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.postedByRole = req.query.role;
    if (req.query.type) filter.gigType = req.query.type;

    let query = Gig.find(filter);
    if (Gig.schema.path('createdBy'))
      query = query.populate('createdBy', 'name role');
    const gigs = await query.exec();
    res.json({ success: true, gigs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  GET SINGLE GIG
const getGigById = async (req, res) => {
  try {
    let query = Gig.findById(req.params.id);
    if (Gig.schema.path('createdBy'))
      query = query.populate('createdBy', 'name role');
    const gig = await query.exec();
    if (!gig)
      return res
        .status(404)
        .json({ success: false, message: 'Gig not found' });
    res.json({ success: true, gig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  UPDATE GIG
const updateGig = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    const gig = await Gig.findById(req.params.id);
    if (!gig)
      return res
        .status(404)
        .json({ success: false, message: 'Gig not found' });

    if (gig.createdBy.toString() !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized: not the owner' });

    const disallowed = ['createdBy', 'postedByRole', 'applicants'];
    disallowed.forEach((k) => delete req.body[k]);

    Object.assign(gig, req.body);
    await gig.save();
    res.json({ success: true, gig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  DELETE GIG
const deleteGig = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const gig = await Gig.findById(req.params.id);
    if (!gig)
      return res
        .status(404)
        .json({ success: false, message: 'Gig not found' });

    if (gig.createdBy.toString() !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden: not the owner' });

    await Gig.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Gig deleted successfully' });
  } catch (err) {
    console.error('deleteGig error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  APPLY TO GIG
const applyToGig = async (req, res) => {
  try {
    console.log(
      'applyToGig called - userId:',
      req.user?.id,
      'role:',
      req.user?.role,
      'gigId:',
      req.params.id
    );

    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const gig = await Gig.findById(req.params.id);
    if (!gig)
      return res
        .status(404)
        .json({ success: false, message: 'Gig not found' });

    if (gig.createdBy.toString() === req.user.id)
      return res
        .status(400)
        .json({ success: false, message: "You can't apply to your own gig" });

    if (gig.gigType === 'internship' && req.user.role !== 'student') {
      return res
        .status(403)
        .json({ success: false, message: 'Only students can apply' });
    }

    const { skillCardId } = req.body || {};
    if (skillCardId) {
      const sc = await SkillCard.findById(skillCardId);
      if (!sc)
        return res
          .status(400)
          .json({ success: false, message: 'SkillCard not found' });
      if (sc.user && sc.user.toString() !== req.user.id)
        return res
          .status(403)
          .json({ success: false, message: 'SkillCard does not belong to you' });
    }

    const alreadyApplied = gig.applicants.some(
      (a) => a.toString() === req.user.id
    );
    if (alreadyApplied)
      return res
        .status(400)
        .json({ success: false, message: 'Already applied' });

    gig.applicants.push(req.user.id);
    await gig.save();

    if (gig.createdBy) {
      await User.findByIdAndUpdate(gig.createdBy, {
        $inc: { popularityScore: 1 },
      });
    }

    try {
      const io = req.app?.get?.('io');
      if (io && gig.createdBy) {
        io.to(gig.createdBy.toString()).emit('gig:applicant', {
          gigId: gig._id,
          applicant: { id: req.user.id, name: req.user.name || '' },
          skillCardId: skillCardId || null,
        });
      }
    } catch (e) {
      console.warn('applyToGig: io emit failed', e.message);
    }

    return res.json({ success: true, message: 'Applied successfully' });
  } catch (err) {
    console.error('applyToGig error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  VIEW APPLICANTS
const viewApplicants = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const gig = await Gig.findById(req.params.id).populate(
      'applicants',
      'name email'
    );
    if (!gig)
      return res
        .status(404)
        .json({ success: false, message: 'Gig not found' });

    if (gig.createdBy.toString() !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized' });

    return res.json({ success: true, applicants: gig.applicants || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
  applyToGig,
  viewApplicants,
};
