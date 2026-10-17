"use client";

import { LazyMotion, m } from "motion/react";
import { useState } from "react";

export interface PocMotionButtonProps {
  label?: string;
  onPress?: () => void;
}

const loadFeatures = () =>
  import("motion/react").then((res) => res.domAnimation);

/**
 * Isolated Proof of Concept for Motion with React 19 + Vinext (RSC/SSR).
 * Uses LazyMotion with dynamic loadFeatures and m component to guarantee tree-shaking
 * and separate animation runtime into an async chunk fetched on demand.
 */
export function PocMotionButton({ label = "探索升學指南", onPress }: PocMotionButtonProps) {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive((prev) => !prev);
    onPress?.();
  };

  return (
    <LazyMotion features={loadFeatures} strict>
      <m.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-pressed={active}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <m.span
          animate={{ rotate: active ? 180 : 0, scale: active ? 1.15 : 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          aria-hidden="true"
        >
          ✦
        </m.span>
        <span>{label}</span>
      </m.button>
    </LazyMotion>
  );
}
