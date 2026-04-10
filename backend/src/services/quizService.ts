import { Word } from "@prisma/client";
import { QuizQuestion, generateFunnyQuiz } from "./aiService";
import { buildBossBattle, buildFillBlankQuestions, buildSpellingQuestions, toModeQuestions, ModeQuestion } from "./quizModes";

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildLocalQuizQuestions(words: Word[]): QuizQuestion[] {
  const clean = words.filter((word) => word.english && word.mongolian);
  if (clean.length === 0) {
    return [];
  }

  const pool = shuffle(clean);

  return pool.slice(0, Math.min(10, pool.length)).map((word, index) => {
    const distractors = shuffle(
      clean
        .filter((item) => item.id !== word.id && item.mongolian !== word.mongolian)
        .map((item) => item.mongolian)
    ).slice(0, 3);

    const options = shuffle([word.mongolian, ...distractors]);

    return {
      question: `${index + 1}. "${word.english}" гэдэг үгийн хамгийн ойр утга аль нь вэ?`,
      correctAnswer: word.mongolian,
      options,
      funnyHint: `"${word.english}"-ийг цээжлэхгүй бол дараа нь чамайг дахиад барина шүү.`
    };
  });
}

export async function buildQuizQuestions(words: Word[]): Promise<QuizQuestion[]> {
  if (words.length === 0) return [];
  try {
    const ai = await generateFunnyQuiz(words);
    if (ai.length >= 3) {
      return shuffle(ai).slice(0, Math.min(10, ai.length));
    }
    return buildLocalQuizQuestions(words);
  } catch (error) {
    return buildLocalQuizQuestions(words);
  }
}

export async function buildModeQuestions(
  mode: "standard" | "spelling" | "fill" | "boss",
  words: Word[]
): Promise<ModeQuestion[]> {
  if (mode === "spelling") return buildSpellingQuestions(words);
  if (mode === "fill") {
    const fill = buildFillBlankQuestions(words);
    return fill.length > 0 ? fill : buildSpellingQuestions(words);
  }
  if (mode === "boss") {
    const mcq = await buildQuizQuestions(words);
    return buildBossBattle(mcq, words);
  }
  const mcq = await buildQuizQuestions(words);
  return toModeQuestions(mcq);
}
