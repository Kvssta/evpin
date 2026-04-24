"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import { softTick } from "@/lib/ui-sounds";

export type UtilizationDay = {
  /** Short week label, e.g. "18 Apr — 24 Apr". */
  label: string;
  /** 0..1 height ratio */
  pct: number;
  /** Average cars charged per day that week — shown in the tooltip. */
  cars: number;
};

type Props = {
  /** 4 weekly aggregates covering the last 30 days. */
  weeks: UtilizationDay[];
  /** Total height of the bar area in px. */
  height?: number;
};

const LOW_DAY_THRESHOLD = 50;
/** Red bar for weeks averaging under the low-usage threshold. */
const LOW_BAR = "#ff6b6b";
const WHITE_BAR = "rgba(255,255,255,1)";

/**
 * Weekly utilisation chart shown inside the station popup. Renders 4
 * bars for the last 4 weeks (≈30 days) with the week's date range below.
 * - Bars default to white; weeks averaging < 50 EVs/day render in red
 *   to flag low utilisation.
 * - Hovering a bar shows a round pill tooltip with the total EVs that
 *   week.
 */
export function UtilizationBars({ weeks, height = 40 }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const playHover = useSound(softTick);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[14px] leading-5 text-white">
          Utilization (last 30 days)
        </p>
      </div>

      <div
        className="relative flex items-end gap-[4px]"
        style={{ height }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {weeks.map((d, i) => {
          const active = i === hoveredIndex;
          const isLowWeek = d.cars < LOW_DAY_THRESHOLD;
          const barColor = isLowWeek ? LOW_BAR : WHITE_BAR;
          return (
            <div
              key={i}
              className="relative flex-1"
              style={{ height: "100%" }}
              onMouseEnter={() => {
                setHoveredIndex(i);
                playHover();
              }}
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-[2px]"
                style={{
                  height: "100%",
                  backgroundColor: "rgba(255,255,255,0.10)",
                }}
              />
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: Math.max(0.08, d.pct) }}
                transition={{
                  duration: 0.45,
                  delay: 0.2 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformOrigin: "bottom",
                  height: "100%",
                  backgroundColor: barColor,
                  opacity: active ? 1 : 0.9,
                }}
                className="absolute inset-x-0 bottom-0 rounded-[2px] transition-[background-color,opacity] duration-150"
              />

              <AnimatePresence>
                {active && (
                  <motion.div
                    key="tip"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full px-[10px] py-[3px] text-[12px] font-medium leading-4"
                    style={{
                      color: "#0c0c09",
                      backgroundColor: "rgba(255,255,255,0.95)",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                    }}
                  >
                    {d.cars.toLocaleString()} EVs
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium leading-4 text-white/50">
        {weeks.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
