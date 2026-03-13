import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const submitSchema = z.object({
  wordId: z.string(),
  rating: z.enum(["again", "hard", "good", "easy"])
});

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeNextReview(
  rating: "again" | "hard" | "good" | "easy",
  current: { repetitions: number; interval: number; ease: number }
) {
  let { repetitions, interval, ease } = current;

  if (rating === "again") {
    repetitions = 0;
    interval = 1;
    ease = clamp(ease - 0.2, 1.3, 3.0);
  } else {
    repetitions = repetitions + 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * ease);

    if (rating === "hard") ease = clamp(ease - 0.15, 1.3, 3.0);
    if (rating === "good") ease = clamp(ease + 0.05, 1.3, 3.0);
    if (rating === "easy") ease = clamp(ease + 0.15, 1.3, 3.0);
  }

  const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  return { repetitions, interval, ease, nextReviewAt };
}

router.get("/queue", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 10), 30);
    const now = new Date();
    const words = await prisma.word.findMany({
      where: {
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
        deletedAt: null,
        userId: req.userId
      },
      orderBy: [{ nextReviewAt: "asc" }, { addedAt: "asc" }],
      take: limit
    });
    res.json(words.map((w) => ({ ...w, addedAt: w.addedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

router.post("/submit", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { wordId, rating } = submitSchema.parse(req.body);
    const word = await prisma.word.findFirst({ where: { id: wordId, userId: req.userId } });
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }

    const next = computeNextReview(rating, {
      repetitions: word.repetitions,
      interval: word.interval,
      ease: word.ease
    });

    const masteryBase = Math.min(100, Math.round(word.mastery + (rating === "again" ? -8 : rating === "hard" ? 2 : rating === "good" ? 6 : 10)));

    const updated = await prisma.word.update({
      where: { id: wordId },
      data: {
        repetitions: next.repetitions,
        interval: next.interval,
        ease: next.ease,
        nextReviewAt: next.nextReviewAt,
        lastReviewedAt: new Date(),
        correctCount: rating === "again" ? word.correctCount : word.correctCount + 1,
        wrongCount: rating === "again" ? word.wrongCount + 1 : word.wrongCount,
        mastery: clamp(masteryBase, 0, 100)
      }
    });

    res.json({
      ...updated,
      addedAt: updated.addedAt.toISOString(),
      nextReviewAt: updated.nextReviewAt?.toISOString() ?? null,
      lastReviewedAt: updated.lastReviewedAt?.toISOString() ?? null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
