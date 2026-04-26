"use client";

import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { DayStats } from "../lib/types";
import { useLanguage } from "./LanguageProvider";

interface StatsChartProps {
  data: DayStats[];
  period: "week" | "month";
}

const dayMap: Record<string, string> = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun"
};

function formatLabel(date: string) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  return dayMap[day] || day;
}

export default function StatsChart({ data, period }: StatsChartProps) {
  const { language } = useLanguage();
  const copy =
    language === "mn"
      ? { words: "Үгс", score: "Оноо", day: "Өдөр" }
      : { words: "Words", score: "Score", day: "Day" };

  return (
    <div className="h-[360px] w-full rounded-2xl border border-border bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--border) / 0.07)" strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickFormatter={period === "week" ? formatLabel : (value) => value.slice(5)}
            tick={{ fill: "rgb(var(--muted))" }}
          />
          <YAxis tick={{ fill: "rgb(var(--muted))" }} />
          <Tooltip
            contentStyle={{
              background: "rgb(var(--surface2))",
              border: "1px solid rgb(var(--border) / 0.07)",
              borderRadius: 12,
              color: "rgb(var(--text))"
            }}
            formatter={(value, name) => [value, name === "wordsAdded" ? copy.words : copy.score]}
            labelFormatter={(label) => `${copy.day}: ${label}`}
          />
          <Bar dataKey="wordsAdded" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="quizScore" stroke="rgb(var(--accent3))" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
