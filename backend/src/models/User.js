const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User schema definition
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ['student', 'provider'],
      default: 'student',
    },
    bio: String,
    profilePic: String,
    education: [
      {
        degree: String,
        institution: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    jobTitle: String,
    links: [String],
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    popularityScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

//password checking
// Hash password before saving
const SALT_ROUNDS = 12;

userSchema.pre('save', async function (next) {
  try {
    // only hash if password was added/modified
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password and __v when converting to JSON (sent to clients)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Export model
const User = mongoose.model('User', userSchema);
module.exports = User;


