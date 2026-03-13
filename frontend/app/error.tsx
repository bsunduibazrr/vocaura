"use client";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="rounded-2xl border border-border bg-surface p-10">
        <h2 className="font-display text-2xl text-text">Something went wrong</h2>
        <p className="mt-3 text-muted">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full border border-accent bg-accent/10 px-5 py-2 text-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
