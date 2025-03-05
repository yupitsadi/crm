import mongoose, { Schema, Document, Model } from "mongoose";
import { getWorkshopDb } from "@/lib/db";

interface BaseDescriptionItem {
  type: "paragraph" | "list";
}

interface ParagraphDescription extends BaseDescriptionItem {
  type: "paragraph";
  content: string;
}

interface ListDescription extends BaseDescriptionItem {
  type: "list";
  content: string;
  subpoints?: string[];
}

type DescriptionItem = ParagraphDescription | ListDescription;

export interface WorkshopDocument extends Document {
  _id: mongoose.Types.ObjectId;
  theme: string;
  date: {
    time_slots: string[];
    list_datetime: Date;
  };
  date_of_workshop: string;
  duration: number;
  rate: number;
  video_url: string;
  description: DescriptionItem[];
  location: {
    address: string;
    city: string;
    country: string;
  };
  likes: number;
  rating: number;
  children_enrolled: number;
  kit_name: string;
  meta: string;
  workshop_url: string;
}

const WorkshopSchema = new Schema<WorkshopDocument>({
  theme: { type: String, required: true },
  date: {
    time_slots: { type: [String], required: true },
    list_datetime: { type: Date, required: true },
  },
  date_of_workshop: { type: String, required: true },
  duration: { type: Number, required: true },
  rate: { type: Number, required: true },
  video_url: { type: String, required: true },
  description: [
    {
      type: { type: String, enum: ["paragraph", "list"], required: true },
      content: { type: String, required: true },
      subpoints: { type: [String], required: false },
    },
  ],
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
  },
  likes: { type: Number, required: true, default: 0 },
  rating: { type: Number, required: true, default: 0 },
  children_enrolled: { type: Number, required: true, default: 0 },
  kit_name: { type: String, required: true },
  meta: { type: String, required: true },
  workshop_url: { type: String, required: true },
});

// Function to get workshop model with proper connection
export async function getWorkshopModel(): Promise<Model<WorkshopDocument>> {
  const connection = await getWorkshopDb();
  
  // Check if model exists in this connection to avoid model overwrite warnings
  return connection.models.workshop || 
         connection.model<WorkshopDocument>('workshop', WorkshopSchema, 'workshop_details');
}

// Static model for direct imports
// This is a convenience for cases where we don't need to await the connection
export const workshop = (mongoose.models.workshop as Model<WorkshopDocument>) || 
  mongoose.model<WorkshopDocument>('workshop', WorkshopSchema, 'workshop_details'); 