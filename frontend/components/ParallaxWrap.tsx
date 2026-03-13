"use client";

import { ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface ParallaxWrapProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export default function ParallaxWrap({ children, className, intensity = 16 }: ParallaxWrapProps) {
  const reduceMotion = useReducedMotion();
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rotateX = useSpring(mvY, { stiffness: 220, damping: 20 });
  const rotateY = useSpring(mvX, { stiffness: 220, damping: 20 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotX = ((y - midY) / midY) * -intensity;
    const rotY = ((x - midX) / midX) * intensity;
    mvX.set(rotY);
    mvY.set(rotX);
  };

  const handleLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  return (
    <motion.div
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}
