// src/routes/skillCard.js
const express = require("express");
const router = express.Router();

const skillCardController = require("../controllers/skillCardController");
const authMiddleware = require("../middleware/auth");


router.use((req, res, next) => {
  console.log(`>>> SKILLCARD ROUTE: ${req.method} ${req.originalUrl}`);
  next();
});

router.get("/", authMiddleware, skillCardController.getSkillCards);
router.post("/", authMiddleware, skillCardController.createSkillCard);
router.put("/:id", authMiddleware, skillCardController.updateSkillCard);
router.delete("/:id", authMiddleware, skillCardController.deleteSkillCard);

router.post("/:id/endorse", authMiddleware, skillCardController.endorseSkill);
router.post("/:id/unendorse", authMiddleware, skillCardController.unendorseSkill);

module.exports = router;
