import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { signToken, requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const userCount = await prisma.user.count();
    if (userCount === 1) {
      await prisma.word.updateMany({ where: { userId: null }, data: { userId: user.id } });
    }
    const token = signToken(user.id);
    res.json({ token, email: user.email });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }
    const userCount = await prisma.user.count();
    if (userCount === 1) {
      await prisma.word.updateMany({ where: { userId: null }, data: { userId: user.id } });
    }
    const token = signToken(user.id);
    res.json({ token, email: user.email });
  } catch (error) {
    next(error);
  }
});

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
