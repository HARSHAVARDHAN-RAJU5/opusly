const { calculatePopularity } = require('../utils/popularity');

router.get('/popularity/me', authMiddleware, async (req, res, next) => {
  try {
    const score = await calculatePopularity(req.user.id);
    res.json({ score });
  } catch (err) {
    next(err);
  }
});
