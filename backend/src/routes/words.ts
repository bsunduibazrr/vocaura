import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { getDayBounds, DEFAULT_TIMEZONE, getMonthBounds } from "../services/timeService";
import { generateExampleSentence, suggestTranslation } from "../services/aiService";
import { addXp } from "../services/progressService";
import { ensureAchievements } from "../services/achievementService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const createWordSchema = z.object({
  english: z.string().trim().min(1),
  mongolian: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  level: z.enum(["B1", "B2"]).optional(),
  example: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  autoFill: z.boolean().optional()
});

const updateWordSchema = z.object({
  english: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  mongolian: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  level: z.enum(["B1", "B2"]).optional(),
  example: z.preprocess(emptyToUndefined, z.string().trim().optional())
});

router.get("/today", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { start, end } = getDayBounds(new Date(), DEFAULT_TIMEZONE);
    const words = await prisma.word.findMany({
      where: { addedAt: { gte: start, lt: end }, deletedAt: null, userId: req.userId },
      orderBy: { addedAt: "desc" }
    });
    res.json(words.map((word) => ({
      ...word,
      addedAt: word.addedAt.toISOString()
    })));
  } catch (error) {
    next(error);
  }
});

router.get("/all", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const [total, words] = await Promise.all([
      prisma.word.count({ where: { deletedAt: null, userId: req.userId } }),
      prisma.word.findMany({
        where: { deletedAt: null, userId: req.userId },
        skip,
        take: limit,
        orderBy: { addedAt: "desc" }
      })
    ]);

    res.json({
      total,
      page,
      limit,
      data: words.map((word) => ({
        ...word,
        addedAt: word.addedAt.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get("/weak", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 10), 30);
    const words = await prisma.word.findMany({
      where: { deletedAt: null, userId: req.userId },
      orderBy: [{ wrongCount: "desc" }, { addedAt: "desc" }],
      take: limit
    });
    res.json(words.map((word) => ({ ...word, addedAt: word.addedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

router.get("/suggest", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const query = String(req.query.q ?? "");
    const suggestion = await suggestTranslation(query, req.userId);
    res.json(suggestion ?? { english: query, mongolian: "" });
  } catch (error) {
    res.json({ english: String(req.query.q ?? ""), mongolian: "" });
  }
});

router.get("/example", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const english = String(req.query.english ?? "").trim();
    const mongolian = String(req.query.mongolian ?? "").trim();
    if (!english) {
      res.status(400).json({ error: "english is required" });
      return;
    }
    const generated = await generateExampleSentence(english, mongolian);
    if (!generated?.example) {
      res.json({ example: "" });
      return;
    }
    res.json({ example: generated.example });
  } catch (error) {
    res.json({ example: "" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = createWordSchema.parse(req.body);
    const allowAutoFill = parsed.autoFill !== false;
    let resolvedMongolian = parsed.mongolian?.trim() ?? "";
    if (!resolvedMongolian && allowAutoFill) {
      const suggestion = await suggestTranslation(parsed.english, req.userId);
      resolvedMongolian = suggestion?.mongolian?.trim() ?? "";
    }
    if (!resolvedMongolian) {
      res.status(400).json({ error: "mongolian is required" });
      return;
    }

    let resolvedExample = parsed.example?.trim() ?? "";
    if (!resolvedExample && allowAutoFill) {
      const generated = await generateExampleSentence(parsed.english, resolvedMongolian);
      resolvedExample = generated?.example?.trim() ?? "";
    }

    const word = await prisma.word.create({
      data: {
        english: parsed.english,
        mongolian: resolvedMongolian,
        level: parsed.level ?? "B2",
        example: resolvedExample || undefined,
        source: "user",
        isAutoAdded: false,
        nextReviewAt: new Date(),
        userId: req.userId
      }
    });
    await addXp(req.userId!, 10);
    await ensureAchievements(req.userId!);
    res.status(201).json({
      ...word,
      addedAt: word.addedAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id;
    const existing = await prisma.word.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    await prisma.word.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/by-date", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const date = String(req.query.date ?? "");
    if (!date) {
      res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
      return;
    }
    const [year, month, day] = date.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
    const words = await prisma.word.findMany({
      where: { addedAt: { gte: start, lt: end }, deletedAt: null, userId: req.userId },
      orderBy: { addedAt: "desc" }
    });
    res.json(words.map((word) => ({ ...word, addedAt: word.addedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

router.get("/by-month", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month) {
      res.status(400).json({ error: "year and month are required" });
      return;
    }
    const { start, end } = getMonthBounds(year, month, DEFAULT_TIMEZONE);
    const words = await prisma.word.findMany({
      where: { addedAt: { gte: start, lt: end }, deletedAt: null, userId: req.userId },
      orderBy: { addedAt: "desc" }
    });
    res.json(words.map((word) => ({ ...word, addedAt: word.addedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

router.get("/archived", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const date = String(req.query.date ?? "");
    if (!date) {
      res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
      return;
    }
    const [year, month, day] = date.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
    const words = await prisma.word.findMany({
      where: { addedAt: { gte: start, lt: end }, deletedAt: { not: null }, userId: req.userId },
      orderBy: { addedAt: "desc" }
    });
    res.json(words.map((word) => ({ ...word, addedAt: word.addedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/restore", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id;
    const existing = await prisma.word.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    const word = await prisma.word.update({ where: { id }, data: { deletedAt: null } });
    res.json({ ...word, addedAt: word.addedAt.toISOString() });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id;
    const parsed = updateWordSchema.parse(req.body);
    const existing = await prisma.word.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    const updated = await prisma.word.update({
      where: { id },
      data: {
        english: parsed.english,
        mongolian: parsed.mongolian,
        level: parsed.level,
        example: parsed.example
      }
    });
    res.json({
      ...updated,
      addedAt: updated.addedAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
