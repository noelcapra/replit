import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String },
  company: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Client', ClientSchema);
