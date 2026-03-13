import { Router } from "express";
import { getProgress, levelLabel, updateStreak } from "../services/progressService";
import { calculateStreak } from "../services/statsService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const progress = await getProgress(req.userId!);
    res.json({
      xp: progress.xp,
      level: progress.level,
      levelLabel: levelLabel(progress.level),
      streak: progress.streak,
      longestStreak: progress.longestStreak
    });
  } catch (error) {
    next(error);
  }
});

router.post("/sync-streak", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const streak = await calculateStreak(req.userId!);
    const updated = await updateStreak(req.userId!, streak);
    res.json({
      xp: updated.xp,
      level: updated.level,
      levelLabel: levelLabel(updated.level),
      streak: updated.streak,
      longestStreak: updated.longestStreak
    });
  } catch (error) {
    next(error);
  }
});

export default router;
