import { Types } from 'mongoose';

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

export type DescriptionItem = ParagraphDescription | ListDescription;

export interface Workshop {
  _id: string | Types.ObjectId;
  theme: string;
  date: {
    time_slots: string[];
    list_datetime: Date | string;
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