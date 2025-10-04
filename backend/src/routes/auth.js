// src/routes/auth.js
const express = require('express');
const { signup, login, me } = require('../controllers/authController');
const authModule = require('../middleware/auth');
const validate = require('../middleware/validate');
const validators = require('../validators/authValidators') || {};
const popularity = require('../utils/popularity') || {};
const rateLimiterModule = require('../middleware/rateLimiter') || {};

const router = express.Router();

// resolve auth middleware whether file exported a function or an object
const authMiddleware = (typeof authModule === 'function')
  ? authModule
  : (authModule && authModule.authMiddleware)
  || ((req, res, next) => res.status(500).json({ success: false, message: 'Auth middleware missing' }));

// optional rate limiter (fallback no-op)
const authLimiter = rateLimiterModule.authLimiter || ((req, res, next) => next());

// helper to use validate(schema) only if both validate and schema exist
const optValidate = (schema) => {
  if (typeof validate === 'function' && schema) {
    return validate(schema);
  }
  return (req, res, next) => next();
};

// signup
router.post(
  '/signup',
  authLimiter,
  optValidate(validators.signupSchema),
  signup
);

// login
router.post(
  '/login',
  authLimiter,
  optValidate(validators.loginSchema),
  login
);

// me
router.get('/me', authMiddleware, me);

// popularity
router.get(
  '/popularity/me',
  authMiddleware,
  async (req, res, next) => {
    try {
      if (!popularity || typeof popularity.calculatePopularity !== 'function') {
        return next(new Error('calculatePopularity not available'));
      }
      const score = await popularity.calculatePopularity(req.user.id);
      res.json({ score });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
