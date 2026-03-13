import cron from "node-cron";
import { prisma } from "../db/prisma";
import { generateDailyWords } from "./aiService";
import { DEFAULT_TIMEZONE, getDayBounds, getZonedDateString } from "./timeService";

const quizAvailability = new Map<string, boolean>();

export function setQuizAvailable(date: string, value: boolean): void {
  quizAvailability.set(date, value);
}

export function isQuizAvailable(date: string): boolean {
  return quizAvailability.get(date) ?? false;
}

export function startSchedulers(timeZone = DEFAULT_TIMEZONE): void {
  cron.schedule(
    "0 17 * * *",
    async () => {
      try {
        const { start, end } = getDayBounds(new Date(), timeZone);
        const users = await prisma.user.findMany({ select: { id: true } });
        if (users.length === 0) return;

        const eligibleUserIds: string[] = [];
        for (const user of users) {
          const todayCount = await prisma.word.count({
            where: { addedAt: { gte: start, lt: end }, source: "user", deletedAt: null, userId: user.id }
          });
          if (todayCount === 0) eligibleUserIds.push(user.id);
        }

        if (eligibleUserIds.length === 0) return;

        const [b2Words, b1Words] = await Promise.all([
          generateDailyWords(5, "B2"),
          generateDailyWords(5, "B1")
        ]);

        const baseWords = [...b2Words, ...b1Words].map((word) => ({
          english: word.english,
          mongolian: word.mongolian,
          level: word.level || "B2",
          example: word.example,
          isAutoAdded: true,
          source: "auto"
        }));

        if (baseWords.length > 0) {
          const data = eligibleUserIds.flatMap((userId) =>
            baseWords.map((word) => ({ ...word, userId }))
          );
          await prisma.word.createMany({ data });
        }
      } catch (error) {
        // swallow errors so cron continues running
      }
    },
    { timezone: timeZone }
  );

  cron.schedule(
    "0 22 * * *",
    async () => {
      try {
        const date = getZonedDateString(new Date(), timeZone);
        setQuizAvailable(date, true);
      } catch (error) {
        // ignore
      }
    },
    { timezone: timeZone }
  );
}
