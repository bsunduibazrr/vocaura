"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddWordForm from "../../components/AddWordForm";
import type { Word } from "../../lib/types";
import { fetchTodayWords } from "../../lib/api";
import { FiHome, FiZap, FiBarChart2 } from "react-icons/fi";
import { motion } from "framer-motion";
import ParallaxWrap from "../../components/ParallaxWrap";
import { useUser } from "@clerk/nextjs";
import AuthGate from "../../components/AuthGate";
import { useLanguage } from "../../components/LanguageProvider";

export default function AddPage() {
  const { user, isLoaded } = useUser();
  const { language } = useLanguage();
  const authLoading = !isLoaded;
  const [todayWords, setTodayWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const copy =
    language === "mn"
      ? {
          authTitle: "Үг нэмэхийн тулд нэвтэрнэ үү",
          authMessage: "Өөрийн хувийн үгийн сангаа үүсгэхийн тулд бүртгэлтэй байна.",
          links: [
            { href: "/", label: "Нүүр рүү буцах", icon: <FiHome /> },
            { href: "/quiz", label: "Шалгалт руу очих", icon: <FiZap /> },
            { href: "/stats", label: "Статистик харах", icon: <FiBarChart2 /> },
          ],
        }
      : {
          authTitle: "Sign in to add words",
          authMessage: "Create your account to build a personal vocabulary deck.",
          links: [
            { href: "/", label: "Back to Home", icon: <FiHome /> },
            { href: "/quiz", label: "Go to Quiz", icon: <FiZap /> },
            { href: "/stats", label: "View Stats", icon: <FiBarChart2 /> },
          ],
        };

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setTodayWords([]);
          return;
        }
        const words = await fetchTodayWords();
        setTodayWords(words);
      } catch (error) {
        setTodayWords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!authLoading && !user) {
    return (
      <AuthGate
        title={copy.authTitle}
        message={copy.authMessage}
      />
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="h-72 rounded-2xl border border-border bg-surface animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <AddWordForm todayWords={todayWords} onChange={setTodayWords} />
      <motion.div
        className="mx-auto max-w-3xl px-6 grid gap-3 md:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {copy.links.map((item) => (
          <motion.div key={item.href} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <ParallaxWrap className="parallax-soft">
              <Link
                href={item.href}
                className="block rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-text transition hover:border-accent hover:text-accent"
              >
                <span className="inline-flex items-center gap-2">{item.icon} {item.label}</span>
              </Link>
            </ParallaxWrap>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
