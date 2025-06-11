import express from 'express';
import Income from '../models/Income.js';
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

// GET /api/report/income-by-client
router.get('/income-by-client', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.plan !== 'pro') {
      return res.status(403).json({ message: 'Advanced reporting is a Pro feature. Upgrade to Pro to access.' });
    }
    const data = await Income.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$client', total: { $sum: '$amount' } } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error generating report' });
  }
});

// GET /api/report/income-by-month
router.get('/income-by-month', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.plan !== 'pro') {
      return res.status(403).json({ message: 'Advanced reporting is a Pro feature. Upgrade to Pro to access.' });
    }
    const data = await Income.aggregate([
      { $match: { user: user._id } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: '$amount' }
      } },
      { $sort: { '_id': 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error generating report' });
  }
});

export default router;
