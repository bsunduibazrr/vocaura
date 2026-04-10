import { Word } from "@prisma/client";
import { WordLevel } from "../models/word";
import { prisma } from "../db/prisma";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const FALLBACK_TRANSLATIONS: Record<string, string> = {
  resilient: "тэсвэртэй",
  crucial: "чухал",
  decline: "буурах",
  assume: "таамаглах",
  allocate: "хуваарилах",
  benefit: "ашиг тус",
  challenge: "сорилт",
  commission: "комисс",
  comprise: "бүрдэх",
  conflict: "зөрчил",
  consequence: "үр дагавар",
  consume: "хэрэглэх",
  context: "нөхцөл байдал",
  contribute: "хувь нэмэр оруулах",
  controversy: "маргаан",
  convert: "хөрвүүлэх",
  cooperate: "хамтрах",
  criteria: "шалгуур",
  decline: "буурах",
  demonstrate: "харуулах",
  economy: "эдийн засаг",
  emerge: "бий болох",
  enhance: "сайжруулах",
  environment: "байгаль орчин",
  estimate: "тооцоолох",
  evidence: "нотолгоо",
  exclude: "хасах",
  expand: "өргөжүүлэх",
  factor: "хүчин зүйл",
  finance: "санхүү",
  global: "дэлхийн",
  impact: "нөлөө",
  income: "орлого",
  indicate: "заах",
  influence: "нөлөөлөх",
  infrastructure: "дэд бүтэц",
  innovation: "шинэчлэл",
  isolate: "тусгаарлах",
  maintain: "хадгалах",
  major: "гол",
  maximise: "дээдлэх",
  minimize: "багасгах",
  occur: "тохиолдох",
  persuade: "ятгах",
  policy: "бодлого",
  proportion: "хувь хэмжээ",
  reliable: "найдвартай",
  significant: "ач холбогдолтой",
  strategy: "стратеги",
  sustain: "тогтвортой байлгах",
  technology: "технологи",
  trend: "хандлага"
};

export interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  funnyHint: string;
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("AI disabled");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ text: string }>;
  };
  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error("Claude API returned empty response");
  }
  return text;
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    try {
      const firstArray = raw.indexOf("[");
      const firstObj = raw.indexOf("{");
      const start =
        firstArray === -1
          ? firstObj
          : firstObj === -1
          ? firstArray
          : Math.min(firstArray, firstObj);
      const lastArray = raw.lastIndexOf("]");
      const lastObj = raw.lastIndexOf("}");
      const end =
        lastArray === -1
          ? lastObj
          : lastObj === -1
          ? lastArray
          : Math.max(lastArray, lastObj);
      if (start >= 0 && end > start) {
        const sliced = raw.slice(start, end + 1);
        return JSON.parse(sliced) as T;
      }
      return fallback;
    } catch (innerError) {
      return fallback;
    }
  }
}

export async function generateDailyWords(count: number, level: WordLevel): Promise<Word[]> {
  if (!ANTHROPIC_API_KEY) return [];
  const system = "You are an IELTS vocabulary expert. Always respond with valid JSON only.";
  const user = `Generate ${count} unique IELTS ${level} vocabulary words that are commonly tested in the Academic module. Return ONLY a JSON array with no markdown formatting: [{"english":"word","mongolian":"орчуулга","level":"${level}","example":"Example sentence."}]`;
  const raw = await callClaude(system, user);
  const parsed = safeJsonParse<Word[]>(raw, []);
  return parsed.filter((item) => item.english && item.mongolian) as Word[];
}

export async function generateFunnyQuiz(words: Word[]): Promise<QuizQuestion[]> {
  if (!ANTHROPIC_API_KEY) return [];
  const system = "You are a witty Mongolian IELTS tutor who creates memorable quizzes.";
  const list = words.map((w) => ({ english: w.english, mongolian: w.mongolian, level: w.level }));
  const user = `Create quiz questions for these IELTS words: ${JSON.stringify(list)}. Make the questions funny and memorable for Mongolian students. Use humor but keep educational value. Return ONLY JSON: [{"question":"...","correctAnswer":"...","options":["A","B","C","D"],"funnyHint":"Mongolian funny hint"}]`;
  const raw = await callClaude(system, user);
  const parsed = safeJsonParse<QuizQuestion[]>(raw, []);
  return parsed.filter((q) => q.question && q.correctAnswer && Array.isArray(q.options));
}

export async function generateFunnyFeedback(score: number, total: number, wrongWords: string[]): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "Сайн оролдлого! Маргааш илүү сайн хийнэ ээ.";
  }
  const system = "You are a savage but caring Mongolian IELTS tutor. Respond in Mongolian.";
  const user = `Оюутан ${score}/${total} авлаа. Буруу хариулсан үгс: ${wrongWords.join(", ")}. 2-3 өгүүлбэрийн хошин боловч урамшуулсан feedback өг. Монгол хэлний хэллэг ашигла.`;
  const raw = await callClaude(system, user);
  return raw.trim();
}

export async function suggestTranslation(
  query: string,
  userId?: string,
): Promise<{ english: string; mongolian: string } | null> {
  if (!query.trim()) return null;
  if (!ANTHROPIC_API_KEY) {
    const normalized = query.trim();
    const found = await prisma.word.findFirst({
      where: {
        english: { equals: normalized, mode: "insensitive" },
        deletedAt: null,
        ...(userId ? { userId } : {})
      },
      orderBy: { addedAt: "desc" }
    });
    if (found?.mongolian) {
      return { english: found.english, mongolian: found.mongolian };
    }
    const fallback = FALLBACK_TRANSLATIONS[normalized.toLowerCase()];
    if (fallback) {
      return { english: normalized, mongolian: fallback };
    }
    return null;
  }
  const system = "You are an IELTS vocabulary expert. Always respond with valid JSON only.";
  const user = `Provide a Mongolian translation suggestion for this IELTS word: "${query}". Return ONLY JSON: {"english":"${query}","mongolian":"..."}`;
  const raw = await callClaude(system, user);
  const parsed = safeJsonParse<{ english: string; mongolian: string } | null>(raw, null);
  if (!parsed || !parsed.mongolian) return null;
  return parsed;
}

export async function generateExampleSentence(
  english: string,
  mongolian?: string,
): Promise<{ example: string } | null> {
  if (!english.trim()) return null;
  if (!ANTHROPIC_API_KEY) return null;
  const system = "You are an IELTS vocabulary tutor. Always respond with valid JSON only.";
  const user = `Create ONE short, natural English example sentence using the word "${english}". Keep it IELTS-appropriate. Return ONLY JSON: {"example":"..."}.`;
  const raw = await callClaude(system, user);
  const parsed = safeJsonParse<{ example: string } | null>(raw, null);
  if (!parsed || !parsed.example) return null;
  return parsed;
}
