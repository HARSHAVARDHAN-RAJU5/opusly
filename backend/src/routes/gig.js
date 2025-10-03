const express = require('express');
const {
  createGig,
  getGigs,
  applyToGig,
  deleteGig,
} = require('../controllers/gigController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// create a gig
router.post('/', authMiddleware, createGig);

// list gigs
router.get('/', getGigs);

// apply to a gig
router.post('/:id/apply', authMiddleware, applyToGig);

// delete a gig (provider only)
router.delete('/:id', authMiddleware, deleteGig);

module.exports = router;
