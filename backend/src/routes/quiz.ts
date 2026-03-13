import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { buildModeQuestions } from "../services/quizService";
import { generateFunnyFeedback } from "../services/aiService";
import { DEFAULT_TIMEZONE, getDayBounds, getZonedDateString } from "../services/timeService";
import { isQuizAvailable, setQuizAvailable } from "../services/schedulerService";
import { addXp } from "../services/progressService";
import { ensureAchievements } from "../services/achievementService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const quizCache = new Map<string, ReturnType<typeof buildModeQuestions>>();

router.get("/generate", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const dateKey = getZonedDateString(new Date(), DEFAULT_TIMEZONE);
    const mode = String(req.query.mode ?? "standard") as "standard" | "spelling" | "fill" | "boss";
    const cacheKey = `${req.userId}:${dateKey}:${mode}`;
    const cached = quizCache.get(cacheKey);
    if (cached) {
      res.json(await cached);
      return;
    }

    let words;
    if (mode === "boss") {
      const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      words = await prisma.word.findMany({ where: { addedAt: { gte: from }, userId: req.userId, deletedAt: null } });
    } else {
      const { start, end } = getDayBounds(new Date(), DEFAULT_TIMEZONE);
      words = await prisma.word.findMany({
        where: { addedAt: { gte: start, lt: end }, userId: req.userId, deletedAt: null }
      });
    }

    const questionsPromise = buildModeQuestions(mode, words);
    quizCache.set(cacheKey, questionsPromise);
    res.json(await questionsPromise);
  } catch (error) {
    next(error);
  }
});

const submitSchema = z.object({
  answers: z.array(
    z.object({
      question: z.string(),
      selected: z.string(),
      correctAnswer: z.string()
    })
  )
});

router.post("/submit", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { answers } = submitSchema.parse(req.body);
    const total = answers.length;
    const correct = answers.filter((a) => a.selected === a.correctAnswer);
    const wrong = answers.filter((a) => a.selected !== a.correctAnswer);
    const score = correct.length;
    const wrongWords = wrong.map((a) => a.correctAnswer);

    let feedback = "Сайн оролдлого! Маргааш илүү сайн хийнэ ээ.";
    try {
      feedback = await generateFunnyFeedback(score, total, wrongWords);
    } catch (error) {
      feedback = "Өнөөдөр жаахан будилавч маргааш хошин байдлаар хожино!";
    }

    const dateKey = getZonedDateString(new Date(), DEFAULT_TIMEZONE);
    await prisma.quizResult.create({
      data: {
        date: dateKey,
        score,
        totalWords: total,
        correctWords: JSON.stringify(correct.map((a) => a.correctAnswer)),
        wrongWords: JSON.stringify(wrongWords),
        userId: req.userId
      }
    });
    await addXp(req.userId!, score * 5);
    await ensureAchievements(req.userId!);

    setQuizAvailable(dateKey, true);

    res.json({
      score,
      total,
      feedback
    });
  } catch (error) {
    next(error);
  }
});

router.get("/result/today", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const dateKey = getZonedDateString(new Date(), DEFAULT_TIMEZONE);
    const result = await prisma.quizResult.findFirst({
      where: { date: dateKey, userId: req.userId },
      orderBy: { takenAt: "desc" }
    });
    if (!result) {
      res.json(null);
      return;
    }
    res.json({
      ...result,
      correctWords: JSON.parse(result.correctWords) as string[],
      wrongWords: JSON.parse(result.wrongWords) as string[],
      takenAt: result.takenAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const dateKey = getZonedDateString(new Date(), DEFAULT_TIMEZONE);
    let available = isQuizAvailable(dateKey);
    if (!available) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: DEFAULT_TIMEZONE,
        hour: "2-digit",
        hour12: false
      });
      const hour = Number(formatter.format(new Date()));
      if (hour >= 22) {
        available = true;
        setQuizAvailable(dateKey, true);
      }
    }
    res.json({ available });
  } catch (error) {
    next(error);
  }
});

export default router;
