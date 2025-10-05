// src/routes/gig.js
const express = require('express');
const {
  createGig,
  getAllGigs,
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
router.post('/', authMiddleware, safe(createGig));      // provider/student creates gig
router.get('/', authMiddleware, safe(getAllGigs));      // anyone fetches gigs
router.get('/:id', authMiddleware, safe(getGigById));   // single gig
router.put('/:id', authMiddleware, safe(updateGig));    // only creator edits
router.delete('/:id', authMiddleware, safe(deleteGig)); // only creator deletes

// ---------- APPLICATION ROUTES ----------
router.post('/:id/apply', authMiddleware, safe(applyToGig));          // student applies
router.get('/:id/applicants', authMiddleware, safe(viewApplicants));  // provider views applicants

module.exports = router;
