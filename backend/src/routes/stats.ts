import { Router } from "express";
import { prisma } from "../db/prisma";
import { DEFAULT_TIMEZONE, getDayBounds, getRecentDateStrings, getZonedDateString } from "../services/timeService";
import { calculateStreak, getQuizScoreByDate, getWordsCountByDate } from "../services/statsService";
import { updateStreak } from "../services/progressService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// helper functions moved to services/statsService

router.get("/today", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const dateKey = getZonedDateString(new Date(), DEFAULT_TIMEZONE);
    const { start, end } = getDayBounds(new Date(), DEFAULT_TIMEZONE);
    const [wordCount, quizResult, streak] = await Promise.all([
      prisma.word.count({ where: { addedAt: { gte: start, lt: end }, userId: req.userId, deletedAt: null } }),
      prisma.quizResult.findFirst({ where: { date: dateKey, userId: req.userId }, orderBy: { takenAt: "desc" } }),
      calculateStreak(req.userId!)
    ]);
    await updateStreak(req.userId!, streak);

    res.json({
      date: dateKey,
      wordsAdded: wordCount,
      quizScore: quizResult ? quizResult.score : null,
      totalWords: quizResult ? quizResult.totalWords : null,
      streak
    });
  } catch (error) {
    next(error);
  }
});

router.get("/week", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const dates = getRecentDateStrings(7, DEFAULT_TIMEZONE);
    const [wordCounts, quizScores] = await Promise.all([
      getWordsCountByDate(7, req.userId!),
      getQuizScoreByDate(7, req.userId!)
    ]);

    res.json(
      dates.map((date) => ({
        date,
        wordsAdded: wordCounts[date] ?? 0,
        quizScore: quizScores[date] ?? null
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/month", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const dates = getRecentDateStrings(30, DEFAULT_TIMEZONE);
    const [wordCounts, quizScores] = await Promise.all([
      getWordsCountByDate(30, req.userId!),
      getQuizScoreByDate(30, req.userId!)
    ]);

    res.json(
      dates.map((date) => ({
        date,
        wordsAdded: wordCounts[date] ?? 0,
        quizScore: quizScores[date] ?? null
      }))
    );
  } catch (error) {
    next(error);
  }
});

export default router;
