"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AppLanguage = "mn" | "en";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<AppLanguage>("mn");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem("vocaura-language");
    if (saved === "mn" || saved === "en") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("vocaura-language", language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
