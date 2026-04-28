"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  words: string[];
  intervalMs?: number;
};

/**
 * Cycles through a list of words, rendering each inline within flowing
 * text. The slot reserves width for the longest word so surrounding text
 * doesn't reflow with each swap, and each transition is a soft upward
 * slide + blur fade.
 */
export function CyclingWord({ words, intervalMs = 2800 }: Props) {
  const [i, setI] = useState(0);

  useEffect(() => {
    // Allow callers (e.g. our headless screenshot script) to lock the
    // cycling word to a specific value via `?cycleWord=designing`.
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get(
        "cycleWord",
      );
      if (param) {
        const idx = words.findIndex(
          (w) => w.toLowerCase() === param.toLowerCase(),
        );
        if (idx >= 0) {
          setI(idx);
          return; // skip auto-cycling
        }
      }
    }
    if (words.length <= 1) return;
    const id = setInterval(
      () => setI((prev) => (prev + 1) % words.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [words, intervalMs]);

  const widest = words.reduce(
    (a, b) => (a.length >= b.length ? a : b),
    words[0] ?? "",
  );

  return (
    <span
      className="relative inline-block align-baseline"
      // Reserve the max-width so layout never reflows on swap.
      style={{ minWidth: `${widest.length}ch` }}
    >
      {/* Invisible sizing twin holds the slot width */}
      <span aria-hidden className="invisible">
        {widest}
      </span>

      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={words[i]}
          initial={{ y: "40%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-40%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 whitespace-nowrap"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
