"use client";

import { useLanguage } from "./LanguageProvider";

const items = [
  {
    title: { en: "What this app does", mn: "Энэ апп юу хийдэг вэ" },
    en: "Vocaura helps you capture new words, review them with spaced repetition, and test yourself with multiple quiz modes so the words stick long‑term.",
    mn: "Vocaura нь шинэ үг цуглуулах, spaced repetition‑аар давтах, олон төрлийн шалгалтаар өөрийгөө сорих боломж олгож, үгийг урт хугацаанд тогтоход тусална."
  },
  {
    title: { en: "How to add words", mn: "Үг хэрхэн нэмэх вэ" },
    en: "Go to Add Words, enter English and Mongolian, optionally add an example sentence, and save. The word immediately becomes part of your review queue and quizzes.",
    mn: "Add Words хэсэг рүү орж англи ба монгол үгээ бичээд, шаардлагатай бол жишээ өгүүлбэр нэмээд хадгална. Хадгалсан үг нь шууд review болон quiz‑д орно."
  },
  {
    title: { en: "How reviews work", mn: "Давтлага хэрхэн ажиллах вэ" },
    en: "The review panel uses spaced repetition. Rate each word (Again/Hard/Good/Easy) and the system schedules the next review based on your performance.",
    mn: "Review хэсэг нь spaced repetition‑ээр ажиллана. Үг бүрийг (Again/Hard/Good/Easy) гэж үнэлэхэд дараагийн давталтын хугацааг автоматаар тооцно."
  },
  {
    title: { en: "How quizzes work", mn: "Шалгалт хэрхэн ажиллах вэ" },
    en: "Choose a quiz mode (Fun, Spelling, Fill‑in, Boss battle), optionally enable Timed or Speaking mode, and complete the questions. Your score and feedback appear at the end.",
    mn: "Quiz горимоо (Fun, Spelling, Fill‑in, Boss battle) сонгоод, хүсвэл Timed эсвэл Speaking горимыг асаана. Асуултуудыг дуусгахад оноо, feedback харагдана."
  }
];

export default function IntroSection() {
  const { language } = useLanguage();
  const copy =
    language === "mn"
      ? { title: "Товч заавар", subtitle: "Апп хэрхэн ажилладгийг богинохон тайлбарлав." }
      : { title: "Quick Guide", subtitle: "A short walkthrough of how the app works." };

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl">{copy.title}</h2>
        <p className="text-sm text-muted">{copy.subtitle}</p>
      </div>
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={item.title.en} className="space-y-2">
            <h3 className="text-lg font-display">{item.title[language]}</h3>
            <p className="text-sm text-text">{item[language]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
