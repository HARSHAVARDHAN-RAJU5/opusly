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
  getAppliedGigs,
  getAllApplicantsForProvider,
  updateUserPopularity
  //migrateApplications,
} = require('../controllers/gigController');

const authModule = require('../middleware/auth');
const router = express.Router();

const authMiddleware =
  typeof authModule === 'function'
    ? authModule
    : (authModule &&
        (authModule.authMiddleware || authModule.default || authModule)) ||
      ((req, res, next) =>
        res
          .status(500)
          .json({ success: false, message: 'Auth middleware missing' }));


const safe = (fn) => (req, res, next) => {
  if (!fn || typeof fn !== 'function') {
    return next(new Error('Missing controller handler'));
  }
  return fn(req, res, next);
};

router.post('/', authMiddleware, safe(createGig));      
router.get('/', authMiddleware, safe(getAllGigs));      
router.get('/my', authMiddleware, safe(getMyGigs));  
router.get('/applied', authMiddleware, safe(getAppliedGigs));
router.get('/all-applicants', authMiddleware, safe(getAllApplicantsForProvider)); 
router.post('/:id/apply', authMiddleware, safe(applyToGig));
router.get('/:id/applicants', authMiddleware, safe(viewApplicants)); 
router.put('/:id', authMiddleware, safe(updateGig));    
router.delete('/:id', authMiddleware, safe(deleteGig)); 
router.get('/:id', authMiddleware, safe(getGigById)); 
router.get('/popularity/:id', authMiddleware, safe(getUserPopularity));




//router.get('/migrate-applications', safe(migrateApplications));


module.exports = router;
