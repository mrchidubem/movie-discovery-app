const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        token: generateToken(user._id),
        message: 'User registered successfully'
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Send back user data and token
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      },
      token: generateToken(user._id),
      message: 'Logged in successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { displayName, photoURL },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Upload user photo
// @route   POST /api/users/upload-photo
// @access  Private
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert the file buffer to a base64 string
    const photoURL = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    res.json({ photoURL });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadPhoto
}; 