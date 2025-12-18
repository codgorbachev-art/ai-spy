export type ViewState = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'SCAN' | 'RESULT' | 'SUBSCRIPTION' | 'PROFILE';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'ULTRA';

export interface User {
  id: string;
  email?: string;
  name: string;
  username?: string; // Telegram username
  telegramId?: string;
  photoUrl?: string; // Telegram avatar
  plan: SubscriptionPlan;
  scansLeft: number; // For free tier
  allergies: string[];
  settings: {
    notifications: boolean;
    darkMode: boolean;
  }
}

export interface HistoryItem {
  id: string;
  date: string;
  productName: string;
  score: string;
  status: 'safe' | 'warning' | 'danger';
  rawResult: ScanResult; // Store full result to reopen it
}

export interface Additive {
  code: string; // e.g., "E202" or name "Palm Oil"
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface ScanResult {
  id: string;
  productName?: string;
  status: 'safe' | 'warning' | 'danger';
  score: string;
  verdict: string;
  details: string; // Summary text
  nutrients: {
    label: string;
    value: string;
    status: 'good' | 'bad' | 'neutral';
    percentage?: number; // 0-100 for visualization
  }[];
  additives: Additive[];
  pros: string[];
  cons: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  RESULT = 'RESULT',
}