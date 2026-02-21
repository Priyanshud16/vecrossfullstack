const express = require('express');
const auth = require('../middleware/auth');
const Annotation = require('../models/Annotation');
const router = express.Router();

// Get all annotations for current user
router.get('/', auth, async (req, res) => {
  try {
    const annotations = await Annotation.find({ user: req.user.id });
    res.json(annotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get annotation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const annotation = await Annotation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }
    
    res.json(annotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create annotation
router.post('/', auth, async (req, res) => {
  try {
    const { rectangles } = req.body;
    
    const annotation = new Annotation({
      user: req.user.id,
      rectangles,
    });
    
    await annotation.save();
    res.json(annotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update annotation
router.put('/:id', auth, async (req, res) => {
  try {
    const { rectangles } = req.body;
    
    let annotation = await Annotation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }
    
    annotation.rectangles = rectangles;
    annotation.updatedAt = Date.now();
    
    await annotation.save();
    res.json(annotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete annotation
router.delete('/:id', auth, async (req, res) => {
  try {
    const annotation = await Annotation.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }
    
    res.json({ message: 'Annotation deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;