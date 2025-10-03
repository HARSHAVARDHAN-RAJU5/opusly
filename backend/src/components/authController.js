const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

/**
 * POST /api/auth/signup
 * Body: { name, email, password, role? }
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const user = new User({
      name,
      email,
      password, // will be hashed by model pre-save
      role,
    });

    await user.save();

    const token = createToken(user);
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = createToken(user);
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected — requires auth middleware to set req.user
 */
exports.me = async (req, res, next) => {
  try {
    // auth middleware will set req.user = { id, role, ... }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};
