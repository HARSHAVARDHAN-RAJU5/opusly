// scripts/resetPassword.js
// Usage: node scripts/resetPassword.js
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.DB_URI;
  if (!mongoUri) {
    console.error('No MONGO_URI found in .env — please ensure your backend .env has the DB connection string.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const email = 'kxvinaya@gmail.com';
  const newPassword = '12345678';

  // adjust path if your User model is elsewhere
  const User = require('../src/models/User');

  const user = await User.findOne({ email });
  if (!user) {
    console.error('No user found with email:', email);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Set plain password and save so model's pre-save hook hashes it correctly
  user.password = newPassword;
  await user.save();

  console.log('✅ Password reset (clean) for', email);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
