const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['student', 'provider'], default: 'student' },

    bio: String,
    linkedin: String,
    profilePic: String,

    education: [
      {
        institution: String,
        degree: String,
        from: String,
        to: String,
        pursuing: { type: Boolean, default: false },
      },
    ],

    skills: [String],
    jobTitle: String,
    links: [String],

    visibility: { type: String, enum: ['public', 'private'], default: 'public' },

    // IMPORTANT
    popularityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SALT_ROUNDS = 12;

userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.__v;

  obj.popularity = obj.popularityScore ?? 0;

  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
