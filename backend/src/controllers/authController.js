const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// helper to create JWT
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// signup
// signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already exists' });

    // Create user with plain password — model's pre('save') will hash it
    const user = await User.create({
      name,
      email,
      password, // do NOT hash here
      role,
    });

    const token = createToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // 🔥 direct bcrypt compare (not custom method)
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = createToken(user);
    res.status(200).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
