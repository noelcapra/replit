import express from 'express';
import Onboarding from '../models/Onboarding.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// GET /api/onboarding
router.get('/', auth, async (req, res) => {
  try {
    let onboarding = await Onboarding.findOne({ user: req.userId });
    if (!onboarding) {
      onboarding = new Onboarding({ user: req.userId });
      await onboarding.save();
    }
    res.json(onboarding.checklist);
  } catch (err) {
    res.status(500).json({ message: 'Error loading onboarding' });
  }
});

// POST /api/onboarding
router.post('/', auth, async (req, res) => {
  try {
    let onboarding = await Onboarding.findOne({ user: req.userId });
    if (!onboarding) {
      onboarding = new Onboarding({ user: req.userId });
    }
    onboarding.checklist = { ...onboarding.checklist, ...req.body };
    await onboarding.save();
    res.json(onboarding.checklist);
  } catch (err) {
    res.status(500).json({ message: 'Error updating onboarding' });
  }
});

export default router;
