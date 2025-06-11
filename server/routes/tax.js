import express from 'express';
import Income from '../models/Income.js';
import axios from 'axios';
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

// POST /api/tax/estimate
import User from '../models/User.js';
router.post('/estimate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.plan !== 'pro') {
      return res.status(403).json({ message: 'AI Tax Estimator is a Pro feature. Upgrade to Pro to access this feature.' });
    }
    // Get all income for user
    const incomes = await Income.find({ user: req.userId });
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    // Simple US freelance tax estimate (Self-Employment Tax + Federal Income Tax)
    // Self-employment tax: 15.3%, Federal: 10% for simplicity
    const selfEmploymentTax = totalIncome * 0.153;
    const federalTax = totalIncome * 0.10;
    const estimatedTax = selfEmploymentTax + federalTax;
    // Get tax tips from AI
    const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful tax advisor for US freelancers.' },
        { role: 'user', content: `My total freelance income this year is $${totalIncome}. What are some simple tax tips I should know?` }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}` }
    });
    const tips = aiRes.data.choices[0].message.content;
    res.json({ totalIncome, estimatedTax, tips });
  } catch (err) {
    res.status(500).json({ message: 'Error estimating tax', error: err.message });
  }
});

export default router;
