import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  workshopId: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'credit_card' | 'cash' | 'bank_transfer';
  attendance: boolean;
  attendanceVerifiedBy?: mongoose.Types.ObjectId;
  attendanceVerifiedAt?: Date;
  price: number;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workshopId: {
    type: Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'cash', 'bank_transfer'],
  },
  attendance: {
    type: Boolean,
    default: false,
  },
  attendanceVerifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  attendanceVerifiedAt: Date,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  specialRequirements: String,
}, {
  timestamps: true,
});

// Index for faster queries
bookingSchema.index({ userId: 1, workshopId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema); 