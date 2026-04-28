"use client";

import { useEffect, useState } from "react";

/**
 * "The system of evaluating EV Charging sites is fragmented." section.
 *
 * Renders a centred headline + sub-copy followed by a wide rounded
 * card with a faint pink radial wash and a single glassy search pill
 * floating in the middle. The search pill plays an endless type /
 * pause / erase cycle through a list of fragmented research queries
 * to make the point that the current workflow scatters across many
 * unrelated tools.
 */

const QUERIES: readonly string[] = [
  "Zoning laws California",
  "Parcel owners near 1 Infinite Loop",
  "Traffic volume around 1 Infinite Loop",
  "Dining places close to 1 Infinite Loop",
  "Flood maps California, Q1 2026",
  "EV adoption rates by ZIP code",
  "Permit timelines, Cupertino CA",
  "Avg. utility kWh near Stevens Creek",
];

const TYPE_MS = 55;
const ERASE_MS = 28;
const HOLD_DONE_MS = 1100;
const HOLD_EMPTY_MS = 280;

export function FragmentedSection() {
  const { text } = useTypingCarousel(QUERIES);

  return (
    <section
      className="relative w-full bg-white"
      style={{ paddingTop: 132, paddingBottom: 132 }}
    >
      <div className="mx-auto flex w-[1280px] max-w-full flex-col gap-12 px-6">
        {/* Header — same proportions as the UnifiedSystemSection below
            (36 px headline on the left, 16 px paragraph on the right)
            so the two sections read as a single thought. */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <h2
            className="w-[640px] max-w-full text-[36px] font-semibold leading-[48px] tracking-[-0.72px]"
            style={{ color: "#1d1d16" }}
          >
            The system of evaluating EV Charging sites is fragmented.
          </h2>
          <p
            className="w-[504px] max-w-full text-[16px] leading-6"
            style={{ color: "#5b5b4b" }}
          >
            The entire process of looking up data, vetting it, and coming
            up with a proposal is a long, painful process.
          </p>
        </div>

        {/* Pink-tinted card. The radial wash sits behind the search
            pill — a tall, thin ellipse so the colour reads as a soft
            vertical bar rather than a halo. */}
        <div
          className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-2xl"
          style={{ backgroundColor: "#f7f7f7" }}
        >
          <SearchPill text={text} />
        </div>
      </div>
    </section>
  );
}

function SearchPill({ text }: { text: string }) {
  return (
    <div
      className="flex h-12 w-[358px] max-w-[calc(100%-32px)] items-center gap-[10px] overflow-hidden rounded-full pl-3 pr-4 py-[10px]"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.48)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <SearchIcon />
      <p
        className="flex-1 truncate text-[16px] font-medium leading-6 text-white"
        style={{ fontFeatureSettings: "'cv08' 1" }}
      >
        {text}
        <Caret />
      </p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="size-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 21L17.05 17.05M19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Caret() {
  return (
    <span
      aria-hidden
      className="ml-[1px] inline-block h-[18px] w-[2px] translate-y-[3px] align-middle"
      style={{
        backgroundColor: "white",
        animation: "search-caret-blink 1s steps(2, end) infinite",
      }}
    />
  );
}

/**
 * Cycles through `queries`, typing each one, holding it briefly, then
 * deleting it character-by-character before moving on to the next.
 * Returns the current visible text.
 */
function useTypingCarousel(queries: readonly string[]) {
  const [text, setText] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let qIdx = 0;
    let charIdx = 0;
    type Phase = "typing" | "holding" | "erasing" | "between";
    let phase: Phase = "typing";

    const schedule = (ms: number, fn: () => void) => {
      timeout = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const tick = () => {
      const q = queries[qIdx];
      if (phase === "typing") {
        if (charIdx < q.length) {
          charIdx += 1;
          setText(q.slice(0, charIdx));
          schedule(TYPE_MS, tick);
        } else {
          phase = "holding";
          schedule(HOLD_DONE_MS, tick);
        }
      } else if (phase === "holding") {
        phase = "erasing";
        schedule(ERASE_MS, tick);
      } else if (phase === "erasing") {
        if (charIdx > 0) {
          charIdx -= 1;
          setText(q.slice(0, charIdx));
          schedule(ERASE_MS, tick);
        } else {
          phase = "between";
          schedule(HOLD_EMPTY_MS, tick);
        }
      } else {
        qIdx = (qIdx + 1) % queries.length;
        phase = "typing";
        tick();
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [queries]);

  return { text };
}
