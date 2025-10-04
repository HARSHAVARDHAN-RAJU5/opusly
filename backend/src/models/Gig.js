const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    location: String,
    stipend: String,
    duration: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creatorRole: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gig', gigSchema);
