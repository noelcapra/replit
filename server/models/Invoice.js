import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  pdfUrl: { type: String }, // for future cloud storage
  aiGenerated: { type: Boolean, default: false },
});

export default mongoose.model('Invoice', InvoiceSchema);
