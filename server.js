// 1. Import Packages
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all requests (so Nexuscore.html can call the API from anywhere)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Success: Connected to MongoDB! 🎉');
  } catch (error) {
    console.error('Error: MongoDB connection failed. 😭', error.message);
    process.exit(1);
  }
};
connectDB();

// Define a Mongoose schema and model for videos
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnail: { type: String, required: true }, // Add thumbnail field
  link: { type: String, required: true },      // Add link field
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);

// Test route
app.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.send(`Server is running... MongoDB connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
});

// --- CRUD API Endpoints ---

// CREATE a new video (expects { title, thumbnail, link } in body)
app.post('/api/videos', async (req, res) => {
  try {
    const { title, thumbnail, link } = req.body;
    if (!title || !thumbnail || !link) {
      return res.status(400).json({ error: 'Title, thumbnail, and link are required.' });
    }
    const newVideo = new Video({ title, thumbnail, link });
    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    // Return videos with id field for frontend compatibility
    const videosWithId = videos.map(v => ({
      id: v._id,
      title: v.title,
      thumbnail: v.thumbnail,
      link: v.link,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    }));
    res.json(videosWithId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ a single video by ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found.' });
    res.json({
      id: video._id,
      title: video.title,
      thumbnail: video.thumbnail,
      link: video.link,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a video by ID (expects { title, thumbnail, link } in body)
app.put('/api/videos/:id', async (req, res) => {
  try {
    const { title, thumbnail, link } = req.body;
    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      { title, thumbnail, link },
      { new: true, runValidators: true }
    );
    if (!updatedVideo) return res.status(404).json({ error: 'Video not found.' });
    res.json({
      id: updatedVideo._id,
      title: updatedVideo.title,
      thumbnail: updatedVideo.thumbnail,
      link: updatedVideo.link,
      createdAt: updatedVideo.createdAt,
      updatedAt: updatedVideo.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a video by ID
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const deletedVideo = await Video.findByIdAndDelete(req.params.id);
    if (!deletedVideo) return res.status(404).json({ error: 'Video not found.' });
    res.json({ message: 'Video deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});