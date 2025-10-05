// src/models/Gig.js
const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    location: String,

    // internship fields (provider → student)
    stipend: String,
    duration: String,

    // freelance fields (student → provider)
    rate: String,
    availability: String,
    skills: [String],

    // ownership
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedByRole: { type: String, enum: ['student', 'provider'], required: true },
    gigType: { type: String, enum: ['internship', 'freelance'], required: true },

    // applicants
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gig', gigSchema);
