const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },

    // who created the gig
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postedByRole: { type: String, enum: ['student', 'provider'], default: 'provider' },

    // type: internship / freelance / gig
    gigType: { type: String, default: 'gig' },

    // applicants contains user ObjectId references
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // required/desired skills
    skills: [{ type: String }],

    // provider fields
    stipend: { type: String, default: '' },
    duration: { type: String, default: '' },

    // student fields
    rate: { type: String, default: '' },
    availability: { type: String, default: '' },

    // generic metadata
    isActive: { type: Boolean, default: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// simple static helper if needed later
gigSchema.statics.safeCreate = function (data) {
  return this.create(data);
};

module.exports = mongoose.model('Gig', gigSchema);
