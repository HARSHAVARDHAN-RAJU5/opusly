const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postedByRole: { type: String, enum: ['student', 'provider'], default: 'provider' },

    gigType: { type: String, default: 'gig' },

    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    skills: [{ type: String }],

    stipend: { type: String, default: '' },
    duration: { type: String, default: '' },

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
