import { Router } from "express";
import { getHeatmap } from "../services/statsService";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const days = Math.min(Number(req.query.days ?? 90), 365);
    const data = await getHeatmap(days, req.userId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
