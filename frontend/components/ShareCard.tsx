"use client";

import { useRef } from "react";

interface ShareCardProps {
  score: number;
  total: number;
  feedback: string;
}

export default function ShareCard({ score, total, feedback }: ShareCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  const handleShare = async (target: HTMLDivElement | null) => {
    if (!target) return;
    const canvas = await import("html2canvas").then((m) => m.default(target));
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "ielts-quiz.png", { type: "image/png" });
      if (navigator.share) {
        try {
          await navigator.share({ files: [file], title: "Vocaura Quiz" });
          return;
        } catch (error) {
          // ignore
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ielts-quiz.png";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-4">
      <div ref={ref} className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs text-muted">Vocaura</p>
        <p className="mt-2 font-display text-3xl text-accent">{score}/{total}</p>
        <p className="mt-2 text-sm text-text">{feedback}</p>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface">
        <div
          ref={storyRef}
          className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden bg-black"
          style={{ width: 360, height: 640 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--accent),0.35),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(var(--accent2),0.25),transparent_60%),radial-gradient(circle_at_20%_80%,rgba(var(--accent3),0.2),transparent_55%)]" />
          <div className="absolute inset-0 opacity-40 noise-pulse" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Vocaura</p>
              <p className="text-3xl font-display text-accent">Quiz Result</p>
            </div>
            <div className="space-y-3 text-center">
              <p className="text-6xl font-display text-text">{score}/{total}</p>
              <p className="text-sm text-text opacity-90">{feedback}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>@ielts.vocab</span>
              <span>22:00 Challenge</span>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => handleShare(ref.current)}
        className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm text-accent"
      >
        Share result
      </button>
      <button
        type="button"
        onClick={() => handleShare(storyRef.current)}
        className="rounded-full border border-accent2 bg-accent2/10 px-4 py-2 text-sm text-accent2"
      >
        Instagram Story template
      </button>
    </div>
  );
}
