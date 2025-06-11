import express from 'express';
import jwt from 'jsonwebtoken';
import nodeCron from 'node-cron';

const router = express.Router();

// For demo: Static US quarterly tax deadlines
const TAX_DEADLINES = [
  { label: 'Q2 2025', date: '2025-06-15' },
  { label: 'Q3 2025', date: '2025-09-15' },
  { label: 'Q4 2025', date: '2026-01-15' },
];

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

// GET /api/notifications/tax-deadlines
router.get('/tax-deadlines', auth, (req, res) => {
  // In a real app, deadlines could be personalized
  res.json({ deadlines: TAX_DEADLINES });
});

export default router;
