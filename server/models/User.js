import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  subscription: {
    stripeId: { type: String }, // for future payment integration
    status: { type: String },
    renewalDate: { type: Date },
  }
});

export default mongoose.model('User', UserSchema);
