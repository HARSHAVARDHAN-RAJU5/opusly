const mongoose = require("mongoose");

const skillCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    level: { type: String, default: "Beginner" },
    skills: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillCard", skillCardSchema);
