import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

// POST /api/subscription/upgrade
router.post('/upgrade', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { plan: 'pro' });
    res.json({ message: 'Upgraded to Pro!' });
  } catch (err) {
    res.status(500).json({ message: 'Error upgrading plan' });
  }
});

// POST /api/subscription/downgrade
router.post('/downgrade', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { plan: 'free' });
    res.json({ message: 'Downgraded to Free.' });
  } catch (err) {
    res.status(500).json({ message: 'Error downgrading plan' });
  }
});

// GET /api/subscription/plan
router.get('/plan', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ plan: user.plan });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching plan' });
  }
});

export default router;
