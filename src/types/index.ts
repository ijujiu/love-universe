export interface Partner {
  name: string;
  avatar: string;
}

export interface Anniversary {
  id: string;
  title: string;
  date: string;
  emoji: string;
  dateType?: 'solar' | 'lunar';
}

export type ConnectionStatus = 'offline' | 'waiting' | 'connected' | 'disconnected';

export interface Couple {
  id: string;
  partnerA: Partner;
  partnerB: Partner | null;
  startDate: string;
  pairCode: string;
  encryptionKey?: string;
  anniversaries: Anniversary[];
  createdAt: string;
  myRole: 'A' | 'B';
  connectionStatus: ConnectionStatus;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  photoData?: string;
  voiceData?: { data: string; duration: number };
  emoji: string;
  author?: 'A' | 'B';
  createdAt: string;
}

export type MediaType = 'image' | 'voice' | 'text';

export interface CapsuleMedia {
  type: MediaType;
  content: string;
  duration?: number;
}

export interface Capsule {
  id: string;
  title: string;
  content: string;
  media: CapsuleMedia[];
  author: 'A' | 'B';
  createdAt: string;
  unlockDate: string;
  isUnlocked: boolean;
}

export interface CheckIn {
  id: string;
  partner: 'A' | 'B';
  time: string;
  note?: string;
}

export interface Wish {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  progressA: number;
  progressB: number;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
  badge: string;
  checkIns: CheckIn[];
  createdBy: 'A' | 'B';
  createdAt: string;
}

export type MoodType = 'sunny' | 'cloudy' | 'overcast' | 'rainy' | 'stormy';

export interface MoodEntry {
  date: string;
  moodA: MoodType | null;
  noteA?: string;
  moodB: MoodType | null;
  noteB?: string;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  generatedAt: string;
  stats: {
    togetherDays: number;
    moodMatchDays: number;
    completedWishes: number;
    totalCheckIns: number;
    newMilestones: number;
    avgMoodA: number;
    avgMoodB: number;
  };
  moodTrend: MoodType[];
  aiInsight: string;
  highlights: string[];
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  proximityEnabled: boolean;
  autoGenerateReport: boolean;
}

export const moodConfig: Record<MoodType, { emoji: string; label: string; color: string; score: number }> = {
  sunny: { emoji: '☀️', label: '晴天', color: '#ffd93d', score: 5 },
  cloudy: { emoji: '⛅', label: '多云', color: '#a8d8ea', score: 4 },
  overcast: { emoji: '☁️', label: '阴天', color: '#95a5a6', score: 3 },
  rainy: { emoji: '🌧️', label: '小雨', color: '#74b9ff', score: 2 },
  stormy: { emoji: '⛈️', label: '雷雨', color: '#6c5ce7', score: 1 },
};
