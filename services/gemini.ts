import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// The API key is injected via process.env.API_KEY environment variable.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for model names to ensure consistency
export const MODELS = {
  TEXT: 'gemini-2.5-flash-latest',
  TEXT_PRO: 'gemini-3-pro-preview',
  LIVE: 'gemini-2.5-flash-native-audio-preview-09-2025',
  IMAGE: 'gemini-2.5-flash-image',
  IMAGE_HIGH_QUALITY: 'gemini-3-pro-image-preview',
};
