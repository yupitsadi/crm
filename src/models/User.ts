import mongoose from 'mongoose';
import { getCrmDb } from '@/lib/db';
import { Schema } from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'customer';
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer',
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Remove password when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export async function getUserModel() {
  const conn = await getCrmDb();
  return conn.models.User || conn.model<IUser>('User', userSchema);
}

// For backward compatibility
const userExports = {
  getUserModel
};

export default userExports; 