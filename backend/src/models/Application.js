// models/Application.js
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillCard: { type: mongoose.Schema.Types.ObjectId, ref: "SkillCard" },
    status: { type: String, default: "Interested" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
