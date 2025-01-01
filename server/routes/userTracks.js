// routes/userTracks.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save audio files in 'uploads/audio' and images in 'uploads/images'
    if (file.fieldname === 'audio') {
      cb(null, 'uploads/audio/');
    } else if (file.fieldname === 'coverArt') {
      cb(null, 'uploads/images/');
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: function (req, file, cb) {
    // Use the original file name or generate a unique one
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer with storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit files to 100MB
  fileFilter: function (req, file, cb) {
    // Accept only audio files for 'audio' field and image files for 'coverArt'
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid audio file type'), false);
      }
    } else if (file.fieldname === 'coverArt') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image file type'), false);
      }
    } else {
      cb(new Error('Invalid field name'), false);
    }
  }
});

// GET /api/user/tracks - Get user's library
router.get('/tracks', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ library: user.library });
  } catch (error) {
    console.error('Error fetching library:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/user/tracks - Add a track to user's library
// Use multer middleware to handle file uploads
router.post('/tracks', authMiddleware, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'coverArt', maxCount: 1 }
]), async (req, res) => {
  try {
    const { trackName, artistName } = req.body;
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
    const coverArtFile = req.files['coverArt'] ? req.files['coverArt'][0] : null;

    // Basic validation
    if (!trackName || !artistName || !audioFile) {
      return res.status(400).json({ message: 'Missing required track information or audio file' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construct URLs for the uploaded files
    const audioUrl = `${req.protocol}://${req.get('host')}/uploads/audio/${audioFile.filename}`;
    const coverArtUrl = coverArtFile ? `${req.protocol}://${req.get('host')}/uploads/images/${coverArtFile.filename}` : null;

    // Create new track
    const newTrack = {
      trackName,
      artistName,
      audioUrl,
      coverArtUrl
    };

    // Add to user's library
    user.library.push(newTrack);
    await user.save();

    return res.status(201).json({ message: 'Track added successfully', library: user.library });
  } catch (error) {
    console.error('Error adding track:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
