export const DEFAULT_TIMEZONE = process.env.TIMEZONE || "Asia/Ulaanbaatar";

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return asUtc - date.getTime();
}

export function getZonedDateString(date = new Date(), timeZone = DEFAULT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

export function getDayBounds(date = new Date(), timeZone = DEFAULT_TIMEZONE): { start: Date; end: Date } {
  const dateString = getZonedDateString(date, timeZone);
  const [year, month, day] = dateString.split("-").map(Number);
  const utcStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offset = getTimeZoneOffsetMs(utcStart, timeZone);
  const start = new Date(utcStart.getTime() - offset);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function getRecentDateStrings(days: number, timeZone = DEFAULT_TIMEZONE): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    result.push(getZonedDateString(date, timeZone));
  }
  return result.reverse();
}

export function getMonthBounds(year: number, month: number, timeZone = DEFAULT_TIMEZONE): { start: Date; end: Date } {
  const utcStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const offset = getTimeZoneOffsetMs(utcStart, timeZone);
  const start = new Date(utcStart.getTime() - offset);
  const utcEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const end = new Date(utcEnd.getTime() - offset);
  return { start, end };
}
