"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.98, filter: "blur(8px)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 1.01, filter: "blur(8px)" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative"
      >
        {!reduceMotion && <div className="trailing-glow" />}
        {!reduceMotion && <div className="noise-pulse" />}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
