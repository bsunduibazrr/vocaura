import { Router } from "express";
import { prisma } from "../db/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, createdAt: user.createdAt.toISOString() });
});

router.post("/claim-legacy", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.word.updateMany({
      where: { userId: null },
      data: { userId: req.userId }
    });
    res.json({ claimed: result.count });
  } catch (error) {
    next(error);
  }
});

export default router;
