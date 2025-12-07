import { Type } from "@google/genai";

export enum AppModule {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  IMAGES = 'IMAGES',
  SCOUT = 'SCOUT',
  ANALYTICS = 'ANALYTICS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  groundingMetadata?: any;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface AnalyticsData {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  summary: string;
}

// Schema for Analytics JSON
export const analyticsSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    xAxisLabel: { type: Type.STRING },
    yAxisLabel: { type: Type.STRING },
    summary: { type: Type.STRING },
    data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER },
        },
      },
    },
  },
  required: ["title", "xAxisLabel", "yAxisLabel", "data", "summary"],
};
