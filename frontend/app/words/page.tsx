"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWordsByDate } from "../../lib/api";
import type { Word } from "../../lib/types";
import { useAuth } from "../../components/AuthProvider";
import AuthGate from "../../components/AuthGate";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function WordsArchivePage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(todayString());
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    const fromQuery = searchParams.get("date");
    if (fromQuery) setDate(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setWords([]);
          return;
        }
        const [active] = await Promise.all([fetchWordsByDate(date)]);
        setWords(active);
      } catch (error) {
        setWords([]);
      }
    };
    load();
  }, [date, user]);

  if (!authLoading && !user) {
    return (
      <AuthGate
        title="Sign in to browse word history"
        message="Your saved words are tied to your account."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl">New Words</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-lg font-display">Words added</h3>
          <div className="mt-4 space-y-3">
            {words.length === 0 && <p className="text-sm text-muted">No words.</p>}
            {words.map((word) => (
              <div key={word.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-text">{word.english}</p>
                  <p className="text-xs text-muted">{word.mongolian}</p>
                </div>
                <span className="text-xs text-muted">{word.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
