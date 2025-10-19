// DEBUG login - replace existing login handler with this (src/controllers/authController.js)
const bcrypt = require('bcryptjs'); // safe cross-platform
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res, next) => {
  try {
    console.log('[AUTH DEBUG] login called', { body: req.body });
    let { email, password } = req.body;
    if (!email || !password) {
      console.log('[AUTH DEBUG] missing email/password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    email = String(email).trim().toLowerCase();
    const user = await User.findOne({ email });
    console.log('[AUTH DEBUG] found user?', !!user, user ? { id: user._id, email: user.email, role: user.role } : null);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    console.log('[AUTH DEBUG] storedPwdSample:', typeof user.password === 'string' ? user.password.slice(0,6) : user.password);
    const ok = await bcrypt.compare(String(password), user.password);
    console.log('[AUTH DEBUG] bcrypt.compare result:', ok);

    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Auth login error:', err);
    next(err);
  }
};
