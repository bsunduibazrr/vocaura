import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { buildModeQuestions } from "../services/quizService";
import { generateFunnyFeedback } from "../services/aiService";
import { DEFAULT_TIMEZONE, getDayBounds, getZonedDateString } from "../services/timeService";
import { addXp } from "../services/progressService";
import { ensureAchievements } from "../services/achievementService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/generate", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const mode = String(req.query.mode ?? "standard") as "standard" | "spelling" | "fill" | "boss";

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

    res.json(await buildModeQuestions(mode, words));
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
    res.json({ available: true });
  } catch (error) {
    next(error);
  }
});

export default router;
