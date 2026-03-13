import { Word } from "@prisma/client";
import { QuizQuestion } from "./aiService";

export type ModeQuestion =
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

export function buildSpellingQuestions(words: Word[]): ModeQuestion[] {
  return words.slice(0, 10).map((word) => ({
    type: "spelling",
    prompt: `"${word.mongolian}" үгийг англиар бичнэ үү`,
    correctAnswer: word.english,
    funnyHint: "Дуугаар бодоод бичээрэй!"
  }));
}

export function buildFillBlankQuestions(words: Word[]): ModeQuestion[] {
  return words
    .filter((word) => word.example && word.example.toLowerCase().includes(word.english.toLowerCase()))
    .slice(0, 10)
    .map((word) => ({
      type: "fill",
      prompt: (word.example || "").replace(new RegExp(word.english, "gi"), "____"),
      correctAnswer: word.english,
      funnyHint: "Жишээгээр нь таагаарай!"
    }));
}

export function toModeQuestions(mcq: QuizQuestion[]): ModeQuestion[] {
  return mcq.map((q) => ({
    type: "mcq",
    question: q.question,
    correctAnswer: q.correctAnswer,
    options: q.options,
    funnyHint: q.funnyHint
  }));
}

export function buildBossBattle(mcq: QuizQuestion[], words: Word[]): ModeQuestion[] {
  const spelling = buildSpellingQuestions(words).slice(0, 6);
  const fill = buildFillBlankQuestions(words).slice(0, 6);
  const mixed = [...toModeQuestions(mcq).slice(0, 6), ...spelling, ...fill];
  return mixed.slice(0, 15);
}
