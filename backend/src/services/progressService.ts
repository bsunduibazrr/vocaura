import { prisma } from "../db/prisma";

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function levelLabel(level: number): string {
  if (level <= 1) return "Beginner";
  if (level <= 3) return "Elementary";
  if (level <= 5) return "Intermediate";
  if (level <= 7) return "Upper-Intermediate";
  return "Advanced";
}

export async function getProgress(userId: string) {
  const existing = await prisma.userProgress.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProgress.create({ data: { userId } });
}

export async function addXp(userId: string, amount: number) {
  const progress = await getProgress(userId);
  const nextXp = Math.max(0, progress.xp + amount);
  const nextLevel = levelFromXp(nextXp);
  return prisma.userProgress.update({
    where: { id: progress.id },
    data: { xp: nextXp, level: nextLevel }
  });
}

export async function updateStreak(userId: string, streak: number) {
  const progress = await getProgress(userId);
  return prisma.userProgress.update({
    where: { id: progress.id },
    data: {
      streak,
      longestStreak: Math.max(progress.longestStreak, streak)
    }
  });
}
