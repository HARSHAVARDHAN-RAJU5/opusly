const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requirements: [{ type: String }], // your version
    stipend: { type: String }, // your version
    price: { type: Number }, // optional field if you want monetary amount
    durationDays: { type: Number }, // optional field
    tags: [String], // optional search tags
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gig', gigSchema);
