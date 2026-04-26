"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWordsByDate } from "../../lib/api";
import type { Word } from "../../lib/types";
import { useUser } from "@clerk/nextjs";
import AuthGate from "../../components/AuthGate";
import { useLanguage } from "../../components/LanguageProvider";

export const dynamic = "force-dynamic";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function WordsArchiveContent() {
  const { user, isLoaded } = useUser();
  const { language } = useLanguage();
  const authLoading = !isLoaded;
  const searchParams = useSearchParams();
  const [date, setDate] = useState(todayString());
  const [words, setWords] = useState<Word[]>([]);
  const copy =
    language === "mn"
      ? {
          authTitle: "Үгийн түүхээ харахын тулд нэвтэрнэ үү",
          authMessage: "Таны хадгалсан үгс аккаунттай чинь холбоотой.",
          title: "Шинэ үгс",
          wordsAdded: "Нэмсэн үгс",
          empty: "Үг алга байна.",
        }
      : {
          authTitle: "Sign in to browse word history",
          authMessage: "Your saved words are tied to your account.",
          title: "New Words",
          wordsAdded: "Words added",
          empty: "No words.",
        };

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
        title={copy.authTitle}
        message={copy.authMessage}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl">{copy.title}</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-lg font-display">{copy.wordsAdded}</h3>
          <div className="mt-4 space-y-3">
            {words.length === 0 && <p className="text-sm text-muted">{copy.empty}</p>}
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

export default function WordsArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="h-40 rounded-2xl border border-border bg-surface animate-pulse" />
        </div>
      }
    >
      <WordsArchiveContent />
    </Suspense>
  );
}
