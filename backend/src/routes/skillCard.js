const express = require("express");
const router = express.Router();

router.use((req, res, next) => {
  console.log(">>> skillCard route middleware:", req.method, req.originalUrl);
  next();
});

const { body } = require("express-validator");
const authMiddleware = require("../middleware/auth");
const runValidation = require("../middleware/validate");
const skillCardController = require("../controllers/skillCardController");

// ✅ POST create SkillCard (auth + validation + 3-card limit)
router.post(
  "/",
  authMiddleware,
  [body("title").notEmpty().withMessage("Title is required")],
  runValidation,
  skillCardController.createSkillCard
);

// ✅ GET all SkillCards for logged-in user
router.get("/", authMiddleware, skillCardController.getSkillCards);

// ✅ PUT update SkillCard
router.put("/:id", authMiddleware, skillCardController.updateSkillCard);

// ✅ DELETE SkillCard
router.delete("/:id", authMiddleware, skillCardController.deleteSkillCard);

module.exports = router;
