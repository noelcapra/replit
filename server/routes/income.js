import express from 'express';
import Income from '../models/Income.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { stringify } from 'csv-stringify/sync';

const router = express.Router();

// Auth middleware
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

// Create income entry
router.post('/', auth, async (req, res) => {
  try {
    const { date, client, amount, paymentStatus } = req.body;
    const income = new Income({
      user: req.userId,
      date,
      client,
      amount,
      paymentStatus,
    });
    await income.save();
    res.status(201).json(income);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all income entries for user
router.get('/', auth, async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.userId }).sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// CSV export (Pro only)
router.get('/export-csv', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.plan !== 'pro') {
      return res.status(403).json({ message: 'CSV export is a Pro feature. Upgrade to Pro to export your data.' });
    }
    const incomes = await Income.find({ user: req.userId }).sort({ date: -1 });
    const csv = stringify(incomes.map(i => ({
      Date: i.date.toISOString().split('T')[0],
      Client: i.client,
      Amount: i.amount,
      PaymentStatus: i.paymentStatus
    })), { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="income.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting CSV' });
  }
});

// Update income entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, client, amount, paymentStatus } = req.body;
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { date, client, amount, paymentStatus },
      { new: true }
    );
    if (!income) return res.status(404).json({ message: 'Not found' });
    res.json(income);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete income entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!income) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
