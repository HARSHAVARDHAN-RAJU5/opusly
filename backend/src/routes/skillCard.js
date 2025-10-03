const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const runValidation = require('../middleware/validate');
const skillCardController = require('../controllers/skillCardController');

router.post(
  '/',
  authMiddleware,
  [body('title').notEmpty().withMessage('Title is required')],
  runValidation,
  skillCardController.createSkillCard
);

router.get('/', authMiddleware, skillCardController.getSkillCards);
router.put('/:id', authMiddleware, skillCardController.updateSkillCard);
router.delete('/:id', authMiddleware, skillCardController.deleteSkillCard);

module.exports = router;
