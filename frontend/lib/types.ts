export type WordLevel = "B1" | "B2";

export interface Word {
  id: string;
  english: string;
  mongolian: string;
  level: WordLevel;
  example?: string | null;
  addedAt: string;
  isAutoAdded: boolean;
  source: "user" | "auto";
  repetitions?: number;
  interval?: number;
  ease?: number;
  nextReviewAt?: string | null;
  lastReviewedAt?: string | null;
  correctCount?: number;
  wrongCount?: number;
  mastery?: number;
}

export type QuizQuestion =
  | {
      type: "mcq";
      question: string;
      correctAnswer: string;
      options: string[];
      funnyHint: string;
    }
  | {
      type: "spelling" | "fill";
      prompt: string;
      correctAnswer: string;
      funnyHint?: string;
    };

export interface QuizResult {
  score: number;
  total: number;
  feedback: string;
}

export interface DayStats {
  date: string;
  wordsAdded: number;
  quizScore: number | null;
}

export interface TodayStats {
  date: string;
  wordsAdded: number;
  quizScore: number | null;
  totalWords: number | null;
  streak: number;
}

export interface Progress {
  xp: number;
  level: number;
  levelLabel: string;
  streak: number;
  longestStreak: number;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}
