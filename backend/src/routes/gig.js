// src/routes/gig.js
const express = require('express');
const {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
} = require('../controllers/gigController');

const authModule = require('../middleware/auth');

const router = express.Router();

// resolve auth middleware whether middleware/auth exports a function or an object
const authMiddleware = (typeof authModule === 'function')
  ? authModule
  : (authModule && (authModule.authMiddleware || authModule.default || authModule))
  || ((req, res, next) => res.status(500).json({ success: false, message: 'Auth middleware missing' }));

// safe wrapper to ensure controller exists
const safe = (fn) => (req, res, next) => {
  if (!fn || typeof fn !== 'function') return next(new Error('Missing controller handler'));
  return fn(req, res, next);
};

router.post('/', authMiddleware, safe(createGig));
router.get('/', authMiddleware, safe(getAllGigs));
router.get('/:id', authMiddleware, safe(getGigById));
router.put('/:id', authMiddleware, safe(updateGig));
router.delete('/:id', authMiddleware, safe(deleteGig));

module.exports = router;
