import { prisma } from "../db/prisma";
import { DEFAULT_TIMEZONE, getRecentDateStrings, getZonedDateString } from "./timeService";

export async function getWordsCountByDate(days: number, userId: string): Promise<Record<string, number>> {
  const fromDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const words = await prisma.word.findMany({
    where: { addedAt: { gte: fromDate }, deletedAt: null, userId },
    select: { addedAt: true }
  });

  const counts: Record<string, number> = {};
  for (const word of words) {
    const dateKey = getZonedDateString(word.addedAt, DEFAULT_TIMEZONE);
    counts[dateKey] = (counts[dateKey] ?? 0) + 1;
  }
  return counts;
}

export async function getQuizScoreByDate(days: number, userId: string): Promise<Record<string, number>> {
  const fromDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const results = await prisma.quizResult.findMany({
    where: { takenAt: { gte: fromDate }, userId }
  });
  const scores: Record<string, number> = {};
  for (const result of results) {
    scores[result.date] = result.score;
  }
  return scores;
}

export async function calculateStreak(userId: string): Promise<number> {
  const counts = await getWordsCountByDate(60, userId);
  const dates = getRecentDateStrings(60, DEFAULT_TIMEZONE).reverse();
  let streak = 0;
  for (const dateKey of dates) {
    if ((counts[dateKey] ?? 0) > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export async function getHeatmap(days: number, userId: string): Promise<Array<{ date: string; count: number }>> {
  const counts = await getWordsCountByDate(days, userId);
  const dates = getRecentDateStrings(days, DEFAULT_TIMEZONE);
  return dates.map((date) => ({ date, count: counts[date] ?? 0 }));
}
