import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  code: string;
  type: 'attendance' | 'verification' | 'password_reset';
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['attendance', 'verification', 'password_reset'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // Document will be automatically deleted when expired
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3,
  },
}, {
  timestamps: true,
});

// Create indexes for faster queries
otpSchema.index({ userId: 1, type: 1 });
otpSchema.index({ bookingId: 1 });

// Static method to generate OTP
otpSchema.statics.generateOTP = async function(
  userId: mongoose.Types.ObjectId,
  bookingId: mongoose.Types.ObjectId,
  type: 'attendance' | 'verification' | 'password_reset'
): Promise<IOtp> {
  // Generate a 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration to 10 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  return this.create({
    userId,
    bookingId,
    code,
    type,
    expiresAt,
  });
};

// Method to verify OTP
otpSchema.methods.verifyOTP = async function(inputCode: string): Promise<boolean> {
  if (this.isUsed || this.attempts >= 3 || Date.now() > this.expiresAt.getTime()) {
    return false;
  }

  this.attempts += 1;
  await this.save();

  if (this.code === inputCode) {
    this.isUsed = true;
    await this.save();
    return true;
  }

  return false;
};

export default mongoose.models.Otp || mongoose.model<IOtp>('Otp', otpSchema); 