"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

const QUOTE = `"We almost dropped $800K on a site that looked perfect on paper. EVpin showed the station two miles away was at 4% utilization. One search paid for years of subscription."`;

function Word({
  children,
  progress,
  start,
  end,
}: {
  children: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  // Interpolate color across the word's scroll window.
  const color = useTransform(progress, [start, end], ["#ababa8", "#0c0c09"]);
  return <motion.span style={{ color }}>{children}</motion.span>;
}

export function ScrollTestimonial() {
  // Use a taller sentinel than the visible content so scrollYProgress has a
  // meaningful range even at tall viewports. The text is `sticky` inside so
  // it stays centered while the outer wrapper scrolls past, driving the
  // word-by-word color sweep reliably.
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    // 0 when wrapper top hits viewport bottom, 1 when wrapper bottom hits
    // viewport top — the full range across the pinned region.
    offset: ["start end", "end start"],
  });

  const tokens = QUOTE.split(/(\s+)/);
  const words = tokens.filter((t) => t.trim() !== "");
  const wordCount = words.length;

  let wordIndex = 0;

  return (
    <section
      ref={ref}
      className="w-full"
      style={{ backgroundColor: "hsl(255, 25%, 98%)" }}
    >
      {/* Wrapper is 130 vh (down from 200 vh) — still gives ~30 vh of
          scroll range to drive the word-by-word colour sweep, but with
          much less empty space above and below the pinned content. */}
      <div className="relative h-[130vh]">
        <div className="sticky top-0 flex h-screen w-full items-center justify-center">
          <div className="flex w-[1280px] max-w-full flex-col items-center px-6">
            <div className="flex w-[768px] max-w-full flex-col items-center gap-8">
              <p className="text-center text-[40px] font-semibold leading-[56px] tracking-[-0.8px]">
                {tokens.map((tok, i) => {
                  if (tok.trim() === "") {
                    return <span key={i}>{tok}</span>;
                  }
                  const idx = wordIndex++;
                  // Concentrate the colour sweep within the middle 60% of
                  // the scroll window so it's easy to trigger.
                  const ANIM_START = 0.15;
                  const ANIM_END = 0.75;
                  const span = (ANIM_END - ANIM_START) / Math.max(1, wordCount);
                  const start = ANIM_START + idx * span;
                  const end = Math.min(ANIM_END, start + span * 2.2);
                  return (
                    <Word
                      key={i}
                      progress={scrollYProgress}
                      start={start}
                      end={end}
                    >
                      {tok}
                    </Word>
                  );
                })}
              </p>

              <div className="flex flex-col items-center text-[14px] leading-5">
                <p className="font-medium text-neutral-950">
                  Nikola Kostadinovic
                </p>
                <p className="font-medium" style={{ color: "#5b5b4b" }}>
                  CEO of Adria Studio
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
