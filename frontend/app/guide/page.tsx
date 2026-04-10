"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiInfo, FiPlusCircle, FiRefreshCw, FiZap, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { FaRegLightbulb } from "react-icons/fa";

const sections = [
  {
    title: "What this app is",
    en: "Vocaura is a focused vocabulary trainer designed for daily practice. You add new words, review them using spaced repetition, and test yourself through multiple quiz types. The goal is simple: build long‑term memory, not short‑term cramming.",
    mn: "Vocaura нь өдөр тутмын дадлагад зориулагдсан үгийн сангийн апп юм. Та шинэ үг нэмээд, spaced repetition‑оор давтаж, олон төрлийн шалгалтаар өөрийгөө сорих боломжтой. Зорилго нь богино хугацааны цээжлэл бус урт хугацааны тогтоолт юм."
  },
  {
    title: "Daily flow (recommended)",
    en: "Each day, add a few words, review the queue, and take a quiz whenever you are ready. This habit keeps your review load stable and your memory strong. If you skip a day, your streak resets and the review queue grows.",
    mn: "Өдөр бүр хэдэн үг нэмээд, review‑оо хийж, бэлэн болсон үедээ quiz‑аа өгвөл хамгийн үр дүнтэй. Энэ дадал нь давталтын ачааллыг тогтвортой байлгаж, ой тогтоолтыг хүчтэй болгоно. Өдөр алгасвал streak reset болно, review queue өснө."
  },
  {
    title: "How to add words",
    en: "Go to Add Words. Enter English and Mongolian, optionally add an example sentence, then save. The word immediately appears in Today’s list, is scheduled for review, and becomes eligible for quizzes.",
    mn: "Add Words хэсэг рүү орж англи, монгол үгээ оруулна. Хүсвэл жишээ өгүүлбэр нэмээд хадгална. Үг нь шууд Today’s list‑д харагдаж, review‑д орж, quiz‑д ашиглагдана."
  },
  {
    title: "Spaced repetition (review queue)",
    en: "The review panel is based on spaced repetition. After seeing a word, rate it (Again/Hard/Good/Easy). The system schedules the next review date based on your performance, so you focus more on weak words and less on mastered ones.",
    mn: "Review хэсэг нь spaced repetition‑оор ажиллана. Үг бүрийг Again/Hard/Good/Easy гэж үнэлэхэд систем дараагийн давталтын өдрийг автоматаар тооцно. Ингэснээр сул үгсээ илүү давтаж, эзэмшсэн үгсээ цөөрүүлнэ."
  },
  {
    title: "Quiz modes",
    en: "Choose from Fun Quiz (MCQ), Spelling (type the English word from Mongolian), Fill‑in (complete a sentence), and Boss Battle (weekly mixed challenge). You can also turn on Timed mode for pressure or Speaking mode to answer with voice.",
    mn: "Fun Quiz (сонгох асуулт), Spelling (монголоос англи үгийг бичих), Fill‑in (өгүүлбэрийн хоосон орон бөглөх), Boss Battle (7 хоногийн холимог шалгалт) горимоос сонгоно. Хүсвэл Timed mode‑ыг асааж дарамттай шалгалт өгч, Speaking mode‑оор дуугаар хариулж болно."
  },
  {
    title: "Quiz availability",
    en: "You can take quizzes any time. As soon as you add words, they become eligible for quiz generation and you can refresh for a new set of questions.",
    mn: "Quiz‑ээ хүссэн үедээ өгч болно. Үг нэммэгц тэр үгс шууд quiz-д оролцох боломжтой бөгөөд шинэ асуултын багц үүсгэж refresh хийж болно."
  },
  {
    title: "Stats and mastery",
    en: "The Stats page shows your weekly/monthly progress, heatmap activity, weak words, and mastery score. Use this to identify gaps and adjust your study plan.",
    mn: "Stats хэсэгт 7 хоног/сарын ахиц, heatmap идэвх, сул үгс, mastery score харагдана. Үүгээр хоцрогдолтой хэсгээ тодорхойлж төлөвлөгөөгөө засна."
  },
  {
    title: "Tips to get the best results",
    en: "Focus on consistency over volume. Add fewer words but review daily. Use example sentences, and say the word out loud. If a word feels hard, rate it ‘Again’ and trust the system to bring it back.",
    mn: "Их хэмжээнээс илүү тогтмол байдал чухал. Үг бага нэмсэн ч өдөр бүр review хий. Жишээ өгүүлбэр ашиглаж, үгийг дуугаар хэл. Хэцүү санагдсан үгийг ‘Again’ гэж үнэлээд системийг дага."
  }
];

const icons = [FiInfo, FiCalendar, FiPlusCircle, FiRefreshCw, FiZap, FiCalendar, FiTrendingUp, FaRegLightbulb];

export default function GuidePage() {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl">How to use Vocaura</h1>
        <p className="text-sm text-muted">
          A clear walkthrough of how the app works, the daily routine, and how quizzes and reviews behave.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => {
          const Icon = icons[idx % icons.length] ?? FiInfo;
          return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border bg-surface p-6 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface2 text-accent">
                <Icon />
              </span>
              <h2 className="font-display text-xl">{section.title}</h2>
            </div>
            <p className="text-sm text-text">{section.en}</p>
            <button
              type="button"
              onClick={() => setOpen((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs text-muted hover:text-accent"
            >
              {open[idx] ? "Hide translation" : "Show translation"}
            </button>
            {open[idx] && <p className="text-sm text-muted">{section.mn}</p>}
          </motion.div>
        )})}
      </div>
    </div>
  );
}
