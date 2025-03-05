import { Document } from 'mongoose';

export interface Workshop extends Document {
  title: string;
  date: Date;
  capacity: number;
  registeredParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Add more interfaces as needed for your CRM 