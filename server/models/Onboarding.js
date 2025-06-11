import mongoose from 'mongoose';

const OnboardingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  checklist: {
    profile: { type: Boolean, default: false },
    client: { type: Boolean, default: false },
    income: { type: Boolean, default: false },
    invoice: { type: Boolean, default: false },
    tax: { type: Boolean, default: false },
    referral: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('Onboarding', OnboardingSchema);
