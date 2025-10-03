const express = require('express');
const { signup, login, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/authValidators');
const { calculatePopularity } = require('../utils/popularity');

const router = express.Router();

// signup
router.post('/signup', validate(signupSchema), signup);

// login
router.post('/login', validate(loginSchema), login);

// get current user
router.get('/me', authMiddleware, me);

// get my popularity score
router.get('/popularity/me', authMiddleware, async (req, res, next) => {
  try {
    const score = await calculatePopularity(req.user.id);
    res.json({ score });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
