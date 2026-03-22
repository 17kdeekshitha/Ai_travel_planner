const User = require('../models/User');
const jwt = require('jsonwebtoken');

const createToken = (user) => {
  return jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const isValidGmailEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(String(email || '').trim());
};

const buildUserPayload = (user) => {
  const fallbackName = String(user.email || '').split('@')[0] || 'User';
  return {
    name: String(user.name || '').trim() || fallbackName,
    email: user.email,
    profilePhoto: user.profilePhoto || ''
  };
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!isValidGmailEmail(email)) {
    return res.status(400).json({ message: 'Only @gmail.com email addresses are allowed' });
  }

  try {
    console.log('Registration attempt for:', email);
    let user = await User.findOne({ email });
    if (user) {
      console.log('Email already exists:', email);
      return res.status(400).json({ message: "Email already exists" });
    }

    user = new User({ name, email, password });
    await user.save();
    console.log('User registered successfully:', email);

    const token = createToken(user);
    res.json({ token, user: buildUserPayload(user) });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!isValidGmailEmail(email)) {
    return res.status(400).json({ message: 'Only @gmail.com email addresses are allowed' });
  }

  try {
    console.log('Login attempt for:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log('User found, comparing password');
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = createToken(user);
    console.log('Login successful for:', email);
    res.json({ token, user: buildUserPayload(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: buildUserPayload(user) });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateProfilePhoto = async (req, res) => {
  const { profilePhoto } = req.body;

  if (typeof profilePhoto !== 'string' || !profilePhoto.startsWith('data:image/')) {
    return res.status(400).json({ message: 'Invalid profile photo format' });
  }

  if (profilePhoto.length > 2_500_000) {
    return res.status(400).json({ message: 'Profile photo is too large' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email: req.email },
      { profilePhoto },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: buildUserPayload(user) });
  } catch (err) {
    console.error('Update profile photo error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getCurrentUser, updateProfilePhoto };
