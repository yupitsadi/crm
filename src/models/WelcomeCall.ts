import mongoose from 'mongoose';

// Define the interface for Welcome Call status
interface IWelcomeCall {
  childId: string;
  status: string;
  updatedBy?: string;
  updatedAt: Date;
}

// Define the Mongoose schema
const WelcomeCallSchema = new mongoose.Schema<IWelcomeCall>(
  {
    childId: {
      type: String,
      required: [true, 'Child ID is required'],
      index: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'done'],
      default: 'pending'
    },
    updatedBy: {
      type: String
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create and export the model
export default mongoose.models.WelcomeCall || mongoose.model<IWelcomeCall>('WelcomeCall', WelcomeCallSchema); 