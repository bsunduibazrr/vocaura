import { prisma } from "../db/prisma";
import { getProgress } from "./progressService";
import { getDayBounds, DEFAULT_TIMEZONE } from "./timeService";

const achievements = [
  { key: "words_100", title: "100 үг цээжилсэн", description: "100 үг нэмсэн амжилт" },
  { key: "streak_7", title: "7 хоногийн streak", description: "7 өдөр дараалан суралцсан" }
];

export async function ensureAchievements(userId: string) {
  const existing = await prisma.achievement.findMany({ where: { userId } });
  const existingKeys = new Set(existing.map((a) => a.key));

  const totalWords = await prisma.word.count({ where: { userId, deletedAt: null } });
  if (totalWords >= 100 && !existingKeys.has("words_100")) {
    await prisma.achievement.create({
      data: { ...achievements.find((a) => a.key === "words_100")!, userId }
    });
  }

  const progress = await getProgress(userId);
  if (progress.streak >= 7 && !existingKeys.has("streak_7")) {
    await prisma.achievement.create({
      data: { ...achievements.find((a) => a.key === "streak_7")!, userId }
    });
  }
}

export async function listAchievements(userId: string) {
  return prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: "desc" } });
}
