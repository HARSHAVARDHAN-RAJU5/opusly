const mongoose = require("mongoose");

const skillCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    level: {
      type: String,
      default: "Beginner",
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // All users who endorsed this SkillCard
    endorsedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillCard", skillCardSchema);
