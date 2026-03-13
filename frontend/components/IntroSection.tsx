"use client";

import { useState } from "react";

const items = [
  {
    title: "What this app does",
    en: "Vocaura helps you capture new words, review them with spaced repetition, and test yourself with multiple quiz modes so the words stick long‑term.",
    mn: "Vocaura нь шинэ үг цуглуулах, spaced repetition‑аар давтах, олон төрлийн шалгалтаар өөрийгөө сорих боломж олгож, үгийг урт хугацаанд тогтоход тусална."
  },
  {
    title: "How to add words",
    en: "Go to Add Words, enter English and Mongolian, optionally add an example sentence, and save. The word immediately becomes part of your review queue and quizzes.",
    mn: "Add Words хэсэг рүү орж англи ба монгол үгээ бичээд, шаардлагатай бол жишээ өгүүлбэр нэмээд хадгална. Хадгалсан үг нь шууд review болон quiz‑д орно."
  },
  {
    title: "How reviews work",
    en: "The review panel uses spaced repetition. Rate each word (Again/Hard/Good/Easy) and the system schedules the next review based on your performance.",
    mn: "Review хэсэг нь spaced repetition‑ээр ажиллана. Үг бүрийг (Again/Hard/Good/Easy) гэж үнэлэхэд дараагийн давталтын хугацааг автоматаар тооцно."
  },
  {
    title: "How quizzes work",
    en: "Choose a quiz mode (Fun, Spelling, Fill‑in, Boss battle), optionally enable Timed or Speaking mode, and complete the questions. Your score and feedback appear at the end.",
    mn: "Quiz горимоо (Fun, Spelling, Fill‑in, Boss battle) сонгоод, хүсвэл Timed эсвэл Speaking горимыг асаана. Асуултуудыг дуусгахад оноо, feedback харагдана."
  }
];

export default function IntroSection() {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl">Quick Guide</h2>
        <p className="text-sm text-muted">A short walkthrough of how the app works.</p>
      </div>
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={item.title} className="space-y-2">
            <h3 className="text-lg font-display">{item.title}</h3>
            <p className="text-sm text-text">{item.en}</p>
            <button
              type="button"
              onClick={() => setOpen((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs text-muted hover:text-accent"
            >
              {open[idx] ? "Hide translation" : "Show translation"}
            </button>
            {open[idx] && (
              <p className="text-sm text-muted">{item.mn}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
