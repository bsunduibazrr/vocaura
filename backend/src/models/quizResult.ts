export interface QuizResultDTO {
  id: string;
  date: string; // YYYY-MM-DD in Asia/Ulaanbaatar
  score: number;
  totalWords: number;
  correctWords: string[];
  wrongWords: string[];
  takenAt: string;
}
