import { Router } from "express";
import { prisma } from "../db/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const order = String(req.query.order ?? "asc");
    const words = await prisma.word.findMany({
      where: { deletedAt: null, userId: req.userId },
      orderBy: { mastery: order === "desc" ? "desc" : "asc" },
      take: limit
    });
    res.json(words.map((word) => ({ ...word, addedAt: word.addedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

export default router;
