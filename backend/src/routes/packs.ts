import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/export", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const days = Math.min(Number(req.query.days ?? 7), 365);
    const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    const words = await prisma.word.findMany({
      where: { addedAt: { gte: from }, userId: req.userId, deletedAt: null },
      orderBy: { addedAt: "desc" }
    });
    res.json({
      title: `Vocaura Pack (${days} days)`,
      items: words.map((w) => ({
        english: w.english,
        mongolian: w.mongolian,
        level: w.level,
        example: w.example
      }))
    });
  } catch (error) {
    next(error);
  }
});

const importSchema = z.object({
  title: z.string().optional(),
  items: z.array(
    z.object({
      english: z.string().min(1),
      mongolian: z.string().min(1),
      level: z.enum(["B1", "B2"]).optional(),
      example: z.string().optional()
    })
  )
});

router.post("/import", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = importSchema.parse(req.body);
    const data = parsed.items.map((item) => ({
      english: item.english,
      mongolian: item.mongolian,
      level: item.level ?? "B2",
      example: item.example,
      source: "user",
      isAutoAdded: false,
      nextReviewAt: new Date(),
      userId: req.userId
    }));
    const result = await prisma.word.createMany({ data });
    res.json({ inserted: result.count });
  } catch (error) {
    next(error);
  }
});

export default router;
