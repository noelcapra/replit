import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import incomeRoutes from './routes/income.js';
import invoiceRoutes from './routes/invoice.js';
import taxRoutes from './routes/tax.js';
import notificationRoutes from './routes/notification.js';
import clientRoutes from './routes/client.js';
import reportRoutes from './routes/report.js';
import subscriptionRoutes from './routes/subscription.js';
import onboardingRoutes from './routes/onboarding.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clients', clientRoutes);

app.use('/api/report', reportRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/onboarding', onboardingRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
