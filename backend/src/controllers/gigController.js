// controllers/gigController.js
const Gig = require('../models/Gig');
const User = require('../models/User');

// Create gig - server authoritative + role enforcement
const createGig = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const userId = req.user.id;
    const userRole = req.user.role; // 'student' | 'provider' etc.

    // Respect client-sent gigType but enforce rules server-side
    const requestedType = req.body.gigType || (userRole === 'provider' ? 'internship' : 'freelance');

    // Business rule: internships are provider-only
    if (requestedType === 'internship' && userRole !== 'provider') {
      return res.status(403).json({ success: false, message: 'Only providers can post internships' });
    }

    // Build server-authoritative gig object
    const gigData = {
      title: req.body.title?.trim() || '',
      description: req.body.description || '',
      location: req.body.location || '',
      createdBy: userId,
      postedByRole: userRole,
      gigType: requestedType,
      applicants: [], // ensure default
    };

    // provider-specific fields
    if (userRole === 'provider') {
      gigData.stipend = req.body.stipend || '';
      gigData.duration = req.body.duration || '';
      gigData.skills = req.body.skills || [];
    }

    // student-specific fields (if you want students to post freelance gigs)
    if (userRole === 'student') {
      gigData.rate = req.body.rate || '';
      gigData.availability = req.body.availability || '';
      gigData.skills = req.body.skills || [];
    }

    // minimal validation
    if (!gigData.title) return res.status(400).json({ success: false, message: 'Title is required' });

    const gig = await Gig.create(gigData);
    return res.status(201).json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

// Get all gigs
const getAllGigs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.postedByRole = req.query.role;
    if (req.query.type) filter.gigType = req.query.type;

    let query = Gig.find(filter);
    if (Gig.schema.path('createdBy')) query = query.populate('createdBy', 'name role');
    const gigs = await query.exec();
    res.json({ success: true, gigs });
  } catch (err) {
    next(err);
  }
};

// Get gig by id
const getGigById = async (req, res, next) => {
  try {
    let query = Gig.findById(req.params.id);
    if (Gig.schema.path('createdBy')) query = query.populate('createdBy', 'name role');
    const gig = await query.exec();
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

// Update gig - only creator
const updateGig = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    if (gig.createdBy && gig.createdBy.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    // prevent changing createdBy/postedByRole by client
    const disallowed = ['createdBy', 'postedByRole', 'applicants'];
    disallowed.forEach(k => delete req.body[k]);

    Object.assign(gig, req.body);
    await gig.save();
    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

// Delete gig - only creator
const deleteGig = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
    if (gig.createdBy && gig.createdBy.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    await gig.deleteOne();
    res.json({ success: true, message: 'Gig deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Apply to a gig
const applyToGig = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

    // Owner can't apply to their own gig
    if (gig.createdBy && gig.createdBy.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't apply to your own gig" });
    }

    // Example rule: internships should only be applied to by students
    if (gig.gigType === 'internship' && req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can apply to internships' });
    }

    // Duplication check
    const alreadyApplied = (gig.applicants || []).some(a => a.toString() === req.user.id);
    if (alreadyApplied) return res.status(400).json({ success: false, message: 'Already applied' });

    gig.applicants = gig.applicants || [];
    gig.applicants.push(req.user.id);
    await gig.save();

    // increment creator popularity (or use your popularity util)
    if (gig.createdBy) {
      await User.findByIdAndUpdate(gig.createdBy, { $inc: { popularityScore: 1 } });
    }

    // Optional: emit real-time event if you stored io on req.app (app.set('io', io))
    try {
      const io = req.app && req.app.get && req.app.get('io');
      if (io && gig.createdBy) {
        io.to(gig.createdBy.toString()).emit('gig:applicant', {
          gigId: gig._id,
          applicant: { id: req.user.id, name: req.user.name || '' }
        });
      }
    } catch (e) {
      // non-fatal
    }

    return res.json({ success: true, message: 'Applied successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// View applicants - owner only
const viewApplicants = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const gig = await Gig.findById(req.params.id).populate('applicants', 'name email');
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

    const createdById = gig.createdBy ? gig.createdBy.toString() : null;
    if (!createdById) return res.status(400).json({ success: false, message: 'Gig has no creator info' });
    if (createdById !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

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
