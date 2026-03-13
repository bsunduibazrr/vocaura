import { Router } from "express";
import { ensureAchievements, listAchievements } from "../services/achievementService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await ensureAchievements(req.userId!);
    const items = await listAchievements(req.userId!);
    res.json(items.map((a) => ({ ...a, unlockedAt: a.unlockedAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

export default router;
