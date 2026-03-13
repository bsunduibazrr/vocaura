import { Router } from "express";
import { prisma } from "../db/prisma";
import { generateDailyWords } from "../services/aiService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/inject", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [b2Words, b1Words] = await Promise.all([
      generateDailyWords(5, "B2"),
      generateDailyWords(5, "B1")
    ]);

    const words = [...b2Words, ...b1Words].map((word) => ({
      english: word.english,
      mongolian: word.mongolian,
      level: word.level || "B2",
      example: word.example,
      isAutoAdded: true,
      source: "auto",
      userId: req.userId
    }));

    if (words.length === 0) {
      res.status(200).json({ inserted: 0 });
      return;
    }

    const result = await prisma.word.createMany({ data: words });
    res.status(200).json({ inserted: result.count });
  } catch (error) {
    next(error);
  }
});

export default router;
