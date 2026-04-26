import type {
  Word,
  QuizQuestion,
  QuizResult,
  DayStats,
  TodayStats,
} from "./types";
import { getAuthToken } from "./authToken";
import { log } from "console";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  console.log(token, "here is token");

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || "Request failed";
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch (error) {
      // ignore
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function claimLegacyWords(): Promise<{ claimed: number }> {
  return request("/api/auth/claim-legacy", { method: "POST" });
}

export async function fetchTodayWords(): Promise<Word[]> {
  return request<Word[]>("/api/words/today");
}

export async function fetchAllWords(
  page = 1,
  limit = 20,
): Promise<{ total: number; page: number; limit: number; data: Word[] }> {
  return request(`/api/words/all?page=${page}&limit=${limit}`);
}

export async function addWord(payload: {
  english: string;
  mongolian?: string;
  level: "B1" | "B2";
  example?: string;
  autoFill?: boolean;
}): Promise<Word> {
  return request<Word>("/api/words", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteWord(id: string): Promise<void> {
  await request<void>(`/api/words/${id}`, { method: "DELETE" });
}

export async function updateWord(
  id: string,
  payload: {
    english?: string;
    mongolian?: string;
    level?: "B1" | "B2";
    example?: string;
  },
): Promise<Word> {
  return request<Word>(`/api/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function suggestWord(
  query: string,
): Promise<{ english: string; mongolian: string }> {
  return request(`/api/words/suggest?q=${encodeURIComponent(query)}`);
}

export async function generateExample(payload: {
  english: string;
  mongolian?: string;
}): Promise<{ example: string }> {
  const params = new URLSearchParams({ english: payload.english });
  if (payload.mongolian) params.set("mongolian", payload.mongolian);
  return request(`/api/words/example?${params.toString()}`);
}

export async function fetchQuizQuestions(
  mode: "standard" | "spelling" | "fill" | "boss" = "standard",
): Promise<QuizQuestion[]> {
  return request<QuizQuestion[]>(`/api/quiz/generate?mode=${mode}`);
}

export async function submitQuiz(payload: {
  answers: { question: string; selected: string; correctAnswer: string }[];
}): Promise<QuizResult> {
  return request<QuizResult>("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchQuizResultToday(): Promise<{
  score: number;
  totalWords: number;
  feedback?: string;
} | null> {
  return request("/api/quiz/result/today");
}

export async function fetchQuizStatus(): Promise<{ available: boolean }> {
  return request("/api/quiz/status");
}

export async function fetchTodayStats(): Promise<TodayStats> {
  return request<TodayStats>("/api/stats/today");
}

export async function fetchWeekStats(): Promise<DayStats[]> {
  return request<DayStats[]>("/api/stats/week");
}

export async function fetchMonthStats(): Promise<DayStats[]> {
  return request<DayStats[]>("/api/stats/month");
}

export async function fetchReviewQueue(limit = 5): Promise<Word[]> {
  return request<Word[]>(`/api/review/queue?limit=${limit}`);
}

export async function submitReview(payload: {
  wordId: string;
  rating: "again" | "hard" | "good" | "easy";
}): Promise<Word> {
  return request<Word>("/api/review/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchWeakWords(limit = 6): Promise<Word[]> {
  return request<Word[]>(`/api/words/weak?limit=${limit}`);
}

export async function fetchProgress(): Promise<import("./types").Progress> {
  return request("/api/progress");
}

export async function fetchAchievements(): Promise<
  import("./types").Achievement[]
> {
  return request("/api/achievements");
}

export async function fetchHeatmap(
  days = 90,
): Promise<import("./types").HeatmapDay[]> {
  return request(`/api/stats/heatmap?days=${days}`);
}

export async function fetchMastery(
  limit = 10,
  order: "asc" | "desc" = "asc",
): Promise<Word[]> {
  return request(`/api/words/mastery?limit=${limit}&order=${order}`);
}

export async function fetchWordsByDate(date: string): Promise<Word[]> {
  return request(`/api/words/by-date?date=${date}`);
}

export async function fetchArchivedByDate(date: string): Promise<Word[]> {
  return request(`/api/words/archived?date=${date}`);
}

export async function restoreWord(id: string): Promise<Word> {
  return request(`/api/words/${id}/restore`, { method: "POST" });
}

export async function fetchWordsByMonth(
  year: number,
  month: number,
): Promise<Word[]> {
  return request(`/api/words/by-month?year=${year}&month=${month}`);
}
