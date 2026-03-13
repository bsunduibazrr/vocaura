import { Word } from "@prisma/client";
import { QuizQuestion, generateFunnyQuiz } from "./aiService";
import { buildBossBattle, buildFillBlankQuestions, buildSpellingQuestions, toModeQuestions, ModeQuestion } from "./quizModes";

const fallbackQuestions: QuizQuestion[] = [
  {
    question: "'Diligent' гэдэг үгийн хамгийн зөв утга аль нь вэ?",
    correctAnswer: "Шаргуу хөдөлмөрч",
    options: ["Шаргуу хөдөлмөрч", "Залхуу", "Өндөр", "Тэнэг"],
    funnyHint: "Шаргуу байвал шалгалтын оноо өөрөө дээшлэнэ!"
  },
  {
    question: "'Scarce' гэдэг нь ямар утгатай вэ?",
    correctAnswer: "Ховор",
    options: ["Ховор", "Хатуу", "Баян", "Урт"],
    funnyHint: "Манайд ч заримдаа бяслаг 'scarce' байдаг шүү."
  },
  {
    question: "'Benefit' гэдэг үгийг зөв сонго?",
    correctAnswer: "Ашиг тус",
    options: ["Ашиг тус", "Алдагдал", "Айдас", "Сандрал"],
    funnyHint: "Шинэ үг сурах нь том benefit."
  }
];

export async function buildQuizQuestions(words: Word[]): Promise<QuizQuestion[]> {
  if (words.length === 0) return fallbackQuestions;
  try {
    const ai = await generateFunnyQuiz(words);
    if (ai.length >= 3) return ai;
    return [...ai, ...fallbackQuestions].slice(0, Math.max(3, words.length));
  } catch (error) {
    return fallbackQuestions;
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
