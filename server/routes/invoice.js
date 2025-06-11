import express from 'express';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
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

// POST /api/invoice/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const { client, description, amount } = req.body;
    const user = await User.findById(req.userId);
    // Check invoice limits for free users
    if (user.plan === 'free') {
      // Count invoices this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const invoiceCount = await Invoice.countDocuments({ user: req.userId, date: { $gte: startOfMonth } });
      if (invoiceCount >= 5) {
        return res.status(403).json({ message: 'Free plan: max 5 invoices per month. Upgrade to Pro for unlimited invoices.' });
      }
    }
    // Find or create client by name for this user
    let clientDoc = await Client.findOne({ user: req.userId, name: client });
    if (!clientDoc) {
      if (user.plan === 'free') {
        // Enforce client limit (already enforced in client API, but double check)
        const clientCount = await Client.countDocuments({ user: req.userId });
        if (clientCount >= 3) {
          return res.status(403).json({ message: 'Free plan: max 3 clients. Upgrade to Pro for more.' });
        }
      }
      clientDoc = new Client({ user: req.userId, name: client });
      await clientDoc.save();
    }
    let invoiceText = '';
    let aiGenerated = false;
    if (user.plan === 'pro') {
      // AI invoice generation
      try {
        const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a professional invoice assistant.' },
            { role: 'user', content: `Generate a professional invoice summary for client ${client} for: ${description}, amount: $${amount}` }
          ]
        }, {
          headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}` }
        });
        invoiceText = aiRes.data.choices[0].message.content;
        aiGenerated = true;
      } catch (err) {
        invoiceText = '';
      }
    } else {
      // Standard template for free users
      invoiceText = `Service: ${description}\nAmount Due: $${amount}\nThank you for your business!`;
    }
    // Generate PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);
      // Save invoice to DB
      const invoice = new Invoice({
        user: req.userId,
        client: clientDoc._id,
        description,
        amount,
        paymentStatus: 'unpaid',
        aiGenerated,
      });
      await invoice.save();
      res.set({ 'Content-Type': 'application/pdf' });
      res.send(pdfData);
    });
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Client: ${client}`);
    doc.text(`Description: ${description}`);
    doc.text(`Amount: $${amount}`);
    doc.moveDown();
    doc.text(invoiceText);
    // Branding for free plan
    if (user.plan === 'free') {
      doc.moveDown();
      doc.fontSize(10).fillColor('gray').text('Powered by Freelancer Finance Tracker', { align: 'center' });
    }
    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error generating invoice', error: err.message });
  }
});

// CSV export (Pro only)
router.get('/export-csv', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.plan !== 'pro') {
      return res.status(403).json({ message: 'CSV export is a Pro feature. Upgrade to Pro to export your data.' });
    }
    const invoices = await Invoice.find({ user: req.userId }).populate('client');
    const csv = stringify(invoices.map(inv => ({
      Date: inv.date ? inv.date.toISOString().split('T')[0] : '',
      Client: inv.client && inv.client.name ? inv.client.name : inv.client,
      Description: inv.description,
      Amount: inv.amount,
      PaymentStatus: inv.paymentStatus,
      AiGenerated: inv.aiGenerated ? 'Yes' : 'No'
    })), { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting CSV' });
  }
});

export default router;
