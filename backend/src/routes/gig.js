// src/routes/gig.js
const express = require('express');
const {
  createGig,
  getAllGigs,
  getMyGigs,
  getGigById,
  updateGig,
  deleteGig,
  applyToGig,
  viewApplicants,
} = require('../controllers/gigController');

const authModule = require('../middleware/auth');
const router = express.Router();

// --- Resolve auth middleware safely ---
const authMiddleware =
  typeof authModule === 'function'
    ? authModule
    : (authModule &&
        (authModule.authMiddleware || authModule.default || authModule)) ||
      ((req, res, next) =>
        res
          .status(500)
          .json({ success: false, message: 'Auth middleware missing' }));

// --- Safe wrapper to avoid undefined controllers ---
const safe = (fn) => (req, res, next) => {
  if (!fn || typeof fn !== 'function') {
    return next(new Error('Missing controller handler'));
  }
  return fn(req, res, next);
};

// ---------- GIG CRUD ----------
router.post('/', authMiddleware, safe(createGig));      // create gig
router.get('/', authMiddleware, safe(getAllGigs));      // get all gigs
router.get('/my', authMiddleware, safe(getMyGigs));     // get gigs created by current user
router.get('/:id', authMiddleware, safe(getGigById));   // get single gig
router.put('/:id', authMiddleware, safe(updateGig));    // update gig
router.delete('/:id', authMiddleware, safe(deleteGig)); // delete gig

// ---------- APPLICATION ROUTES ----------
router.post('/:id/apply', authMiddleware, safe(applyToGig));          // student applies to gig
router.get('/:id/applicants', authMiddleware, safe(viewApplicants));  // provider views applicants

module.exports = router;
