import express from 'express';
import Client from '../models/Client.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { stringify } from 'csv-stringify/sync';

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

// Helper: enforce client limit for free users
async function canAddClient(userId) {
  const user = await User.findById(userId);
  if (user.plan === 'pro') return true;
  const count = await Client.countDocuments({ user: userId });
  return count < 3;
}

// Create client
router.post('/', auth, async (req, res) => {
  try {
    if (!(await canAddClient(req.userId))) {
      return res.status(403).json({ message: 'Free plan: max 3 clients. Upgrade to Pro for more.' });
    }
    const { name, email, company } = req.body;
    const client = new Client({ user: req.userId, name, email, company });
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ user: req.userId });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, company } = req.body;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, email, company },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!client) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
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
    const clients = await Client.find({ user: req.userId });
    const csv = stringify(clients.map(c => ({
      Name: c.name,
      Email: c.email,
      Company: c.company,
      Created: c.createdAt ? c.createdAt.toISOString().split('T')[0] : ''
    })), { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting CSV' });
  }
});

export default router;
