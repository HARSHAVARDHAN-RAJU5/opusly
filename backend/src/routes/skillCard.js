// src/routes/skillCard.js
const express = require('express');
const router = express.Router();

// update these paths if your files live elsewhere
const skillCardController = require('../controllers/skillCardController');
const authMiddleware = require('../middleware/auth'); // make sure this path is correct

// Optional: small logger so you get the same console lines you had earlier
router.use((req, res, next) => {
  if (req.baseUrl && req.baseUrl.includes('skillcard')) {
    console.log(`>>> skillCard route middleware: ${req.method} ${req.baseUrl}${req.path}`);
  }
  next();
});

// GET /api/skillcard - list user's skillcards
router.get('/', authMiddleware, skillCardController.getSkillCards);

// POST /api/skillcard - create
router.post('/', authMiddleware, skillCardController.createSkillCard);

// PUT /api/skillcard/:id - update
router.put('/:id', authMiddleware, skillCardController.updateSkillCard);

// DELETE /api/skillcard/:id - delete
router.delete('/:id', authMiddleware, skillCardController.deleteSkillCard);

module.exports = router;
