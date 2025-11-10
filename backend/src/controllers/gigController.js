// src/controllers/gigController.js
const Gig = require('../models/Gig');
const User = require('../models/User');
const SkillCard = require('../models/SkillCard');
const Application = require("../models/Application");


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
const applyToGig = async (req, res) => {
  try {
    console.log(
      "applyToGig called - userId:",
      req.user?.id,
      "role:",
      req.user?.role,
      "gigId:",
      req.params.id
    );

    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const gig = await Gig.findById(req.params.id);
    if (!gig)
      return res
        .status(404)
        .json({ success: false, message: "Gig not found" });

    if (gig.createdBy.toString() === req.user.id)
      return res
        .status(400)
        .json({ success: false, message: "You can't apply to your own gig" });

    if (gig.gigType === "internship" && req.user.role !== "student") {
      return res
        .status(403)
        .json({ success: false, message: "Only students can apply" });
    }

    const { skillCardId } = req.body || {};
    if (skillCardId) {
      const sc = await SkillCard.findById(skillCardId);
      if (!sc)
        return res
          .status(400)
          .json({ success: false, message: "SkillCard not found" });
      if (sc.user && sc.user.toString() !== req.user.id)
        return res
          .status(403)
          .json({ success: false, message: "SkillCard does not belong to you" });
    }

    const alreadyApplied = gig.applicants.some(
      (a) => a.toString() === req.user.id
    );
    if (alreadyApplied)
      return res
        .status(400)
        .json({ success: false, message: "Already applied" });

    gig.applicants.push(req.user.id);
    await gig.save();

    const Application = require("../models/Application");
    const newApp = new Application({
      gig: gig._id,
      applicant: req.user.id,
      skillCard: skillCardId || null,
      status: "Interested",
    });
    await newApp.save();

    if (gig.createdBy) {
      await User.findByIdAndUpdate(gig.createdBy, {
        $inc: { popularityScore: 1 },
      });
    }

    try {
      const io = req.app?.get?.("io");
      if (io && gig.createdBy) {
        io.to(gig.createdBy.toString()).emit("gig:applicant", {
          gigId: gig._id,
          applicant: { id: req.user.id, name: req.user.name || "" },
          skillCardId: skillCardId || null,
        });
      }
    } catch (e) {
      console.warn("applyToGig: io emit failed", e.message);
    }

    return res.json({ success: true, message: "Applied successfully" });
  } catch (err) {
    console.error("applyToGig error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


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

const getAppliedGigs = async (req, res) => {
  try {
    console.log("Fetching applications for user:", req.user.id);

    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: "gig",
        populate: { path: "createdBy", select: "name" },
      })
      .populate("skillCard");

    console.log("Found applications:", applications.length);
    res.json({ applications });
  } catch (error) {
    console.error("Error in getAppliedGigs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllApplicantsForProvider = async (req, res) => {
  try {
    const gigs = await Gig.find({ createdBy: req.user.id }).select("_id title");

    const gigIds = gigs.map((g) => g._id);

    const applications = await Application.find({ gig: { $in: gigIds } })
      .populate({
        path: "gig",
        select: "title",
      })
      .populate({
        path: "applicant",
        select: "name email role",
      })
      .populate({
        path: "skillCard",
        select: "title",
        select: "title level skills", 
      });

    return res.json({ applications });
  } catch (err) {
    console.error("Error in getAllApplicantsForProvider:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
/* const migrateApplications = async (req, res) => {
  try {
    const gigs = await Gig.find().populate("applicants");
    let count = 0;

    for (const gig of gigs) {
      for (const applicant of gig.applicants) {
        const exists = await Application.findOne({
          gig: gig._id,
          applicant: applicant._id,
        });
        if (!exists) {
          await Application.create({
            gig: gig._id,
            applicant: applicant._id,
            status: "Interested",
          });
          count++;
        }
      }
    }

    res.json({ success: true, message: `${count} applications synced.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};*/

module.exports = {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
  applyToGig,
  viewApplicants,
  getAppliedGigs,
  getAllApplicantsForProvider,
  //migrateApplications,
};
