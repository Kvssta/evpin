"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * "Unified system for assessing and proposing EV charging sites"
 * tabs-style section. Renders three feature cards side by side. The
 * active card expands to fill the remaining space; inactive cards
 * sit at 240 px and lose their saturation. Hovering an inactive card
 * grows it by 40 px.
 *
 * The active card auto-cycles every 12 seconds. The user can also
 * cycle with arrow keys, shift+scroll over the section, or by
 * clicking a card.
 */

type SectionDef = {
  id: string;
  title: string;
  description: string;
  /** Inactive-state background image. */
  bg: string;
  /** Optional render function for the ACTIVE state — overlays go on top
   *  of the bg. The active section uses the design-mode map + popup;
   *  the others currently only render the bg. */
  ActiveOverlay?: () => ReactNode;
};

const SECTIONS: SectionDef[] = [
  {
    id: "utilization",
    title: "Up-to-date data",
    description:
      "From scouting a location to sending the final report, EVPin keeps the proposal process.",
    bg: "/figma/unified-section-map.png",
    ActiveOverlay: DesignModeMapOverlay,
  },
  {
    id: "contact",
    title: "Contact the owner easily",
    description:
      "From scouting a location to sending the final report, EVPin keeps the proposal process.",
    bg: "/figma/unified-section-2.png",
  },
  {
    id: "aerial",
    title: "True-to-scale designer",
    description:
      "From scouting a location to sending the final report, EVPin keeps the proposal process.",
    bg: "/figma/unified-section-3.png",
  },
  {
    id: "propose",
    title: "Propose easily",
    description:
      "From scouting a location to sending the final report, EVPin keeps the proposal process.",
    bg: "/figma/unified-section-propose.png",
  },
  {
    id: "utility",
    title: "Discover Utility maps",
    description:
      "From scouting a location to sending the final report, EVPin keeps the proposal process.",
    bg: "/figma/unified-section-pin.png",
  },
];

const CYCLE_MS = 12_000;

// Card width tokens. The row is intentionally wider than the
// 1280 px container — the cards stick out past the container's right
// edge when the first card is active, and pan left as the user picks
// later cards (so the leftmost cards slide outside the container's
// left boundary instead of compressing).
const CARD_W_INACTIVE = 240;
const CARD_W_HOVER = 280;
const CARD_W_ACTIVE = 720;
const CARD_GAP = 24;
const CARD_STRIDE = CARD_W_INACTIVE + CARD_GAP;
const ROW_WIDTH =
  CARD_W_ACTIVE + 4 * CARD_W_INACTIVE + 4 * CARD_GAP;
const CONTAINER_MAX = 1280;
const CONTAINER_PX = 24;

/**
 * Translate-X for the cards row. Naively translating by
 * `-activeIndex * stride` snaps multiple states to the same row
 * position once the cap kicks in (the last card lands in the same
 * place as the first). Instead the pan ramps linearly from 0 at the
 * first card to the cap at the last card, so every active state has
 * a unique horizontal position and the row pans further right
 * progressively rather than jumping there.
 */
function computePanX(activeIndex: number, contentWidth: number) {
  if (activeIndex <= 0) return 0;
  const lastIndex = SECTIONS.length - 1;
  const maxPan = Math.max(0, ROW_WIDTH - contentWidth);
  return -(activeIndex / lastIndex) * maxPan;
}

export function UnifiedSystemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tickProgress, setTickProgress] = useState(0);
  const lastSwitchRef = useRef<number>(0);
  // Width of the visible 1280 px container minus its 24 px horizontal
  // padding — the surface the row is panning across. Tracked from
  // the viewport so the pan cap stays correct on narrow screens.
  const [contentWidth, setContentWidth] = useState(
    CONTAINER_MAX - 2 * CONTAINER_PX,
  );
  useEffect(() => {
    const measure = () => {
      const vp = Math.min(window.innerWidth, CONTAINER_MAX);
      setContentWidth(Math.max(0, vp - 2 * CONTAINER_PX));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Initialise lastSwitchRef on mount so the timer starts cleanly.
  useEffect(() => {
    lastSwitchRef.current = performance.now();
  }, []);

  const switchTo = useCallback((id: string) => {
    setActiveId(id);
    lastSwitchRef.current = performance.now();
    setTickProgress(0);
  }, []);

  const cycleBy = useCallback(
    (delta: number) => {
      const idx = SECTIONS.findIndex((s) => s.id === activeId);
      const next =
        SECTIONS[
          (idx + delta + SECTIONS.length) % SECTIONS.length
        ];
      switchTo(next.id);
    },
    [activeId, switchTo],
  );

  // 60 fps tick driving the timer ring + auto-advance.
  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      const elapsed = performance.now() - lastSwitchRef.current;
      const progress = Math.min(1, elapsed / CYCLE_MS);
      setTickProgress(progress);
      if (progress >= 1) {
        const idx = SECTIONS.findIndex((s) => s.id === activeId);
        const next =
          SECTIONS[(idx + 1) % SECTIONS.length];
        setActiveId(next.id);
        lastSwitchRef.current = performance.now();
        setTickProgress(0);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [activeId]);

  // Track whether the section is in viewport so keyboard / wheel
  // shortcuts only fire when it's actually visible.
  const inViewRef = useRef(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inViewRef.current = e.isIntersecting;
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inViewRef.current) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycleBy(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cycleBy(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleBy]);

  // Shift+scroll cycles between sections, debounced so a single
  // scroll-flick doesn't blast through multiple cards.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let lastFire = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      const now = performance.now();
      if (now - lastFire < 250) return;
      const delta = e.deltaY || e.deltaX;
      if (Math.abs(delta) < 4) return;
      e.preventDefault();
      lastFire = now;
      cycleBy(delta > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [cycleBy]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white"
      style={{
        paddingTop: 128,
        paddingBottom: 128,
        // The cards row is intentionally wider than the 1280 px
        // container; clipping happens at the section/page level so
        // overflow doesn't introduce a body-level horizontal scroll
        // bar but cards can still spill past the container edges.
        overflowX: "clip",
      }}
    >
      <div className="mx-auto flex w-[1280px] max-w-full flex-col gap-16 px-6">
        {/* Header */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <h2
            className="w-[640px] max-w-full text-[36px] font-semibold leading-[48px] tracking-[-0.72px]"
            style={{ color: "#1d1d16" }}
          >
            That&rsquo;s why we designed a unified experience for assessing and proposing EV Charging sites
          </h2>
          <p
            className="w-[504px] max-w-full text-[16px] leading-6"
            style={{ color: "#5b5b4b" }}
          >
            From scouting a location to sending the final report, EVPin
            keeps the proposal process connected and moving forward.
          </p>
        </div>

        {/* Cards row.
            The row is wider than the 1280 px container — when the
            first card is active it sticks out past the right edge
            (visible until the section's overflow-clip cuts it off at
            the screen edge). Selecting any card further right pans
            the row left so the new active card lands at the
            container's left edge, while the previously-leading cards
            slide off past the left boundary. */}
        <div
          className="flex items-stretch gap-6"
          style={{
            width: "max-content",
            transform: `translateX(${computePanX(
              SECTIONS.findIndex((s) => s.id === activeId),
              contentWidth,
            )}px)`,
            transition: "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            const isHovered = hoverId === s.id && !isActive;
            return (
              <SectionCard
                key={s.id}
                section={s}
                isActive={isActive}
                isHovered={isHovered}
                tickProgress={tickProgress}
                onClick={() => switchTo(s.id)}
                onHoverStart={() => setHoverId(s.id)}
                onHoverEnd={() =>
                  setHoverId((prev) => (prev === s.id ? null : prev))
                }
              />
            );
          })}
        </div>

        {/* Bottom CTA — gray surface with a faint lightning-bolt
            watermark tucked behind the button on the right. */}
        <div
          className="relative flex w-full items-center justify-between gap-8 overflow-hidden rounded-2xl px-10 py-8"
          style={{ backgroundColor: "hsl(255, 25%, 98%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/cta-vector.svg"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={{
              width: 200,
              height: 242,
              right: 11,
              top: -53,
            }}
          />
          <p
            className="relative w-[480px] max-w-full text-[30px] font-semibold leading-[44px] tracking-[-0.6px]"
            style={{ color: "#1d1d16" }}
          >
            Decide your next EV Charging location in hours, not weeks.
          </p>
          <button
            type="button"
            className="relative flex h-10 cursor-pointer items-center justify-center rounded-full bg-black px-4 text-[14px] font-medium leading-5 text-white transition-colors duration-150 hover:bg-neutral-800"
          >
            Try EVPin for free
          </button>
        </div>
      </div>
    </section>
  );
}

function SectionCard({
  section,
  isActive,
  isHovered,
  tickProgress,
  onClick,
  onHoverStart,
  onHoverEnd,
}: {
  section: SectionDef;
  isActive: boolean;
  isHovered: boolean;
  tickProgress: number;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  // Fixed widths so the row's total layout stays predictable and the
  // panning translate lands the active card at a known position:
  //  - active: 720 px
  //  - hovered (inactive): 280 px
  //  - default (inactive): 240 px
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="flex shrink-0 cursor-pointer flex-col gap-6"
      style={{
        width: isActive
          ? CARD_W_ACTIVE
          : isHovered
            ? CARD_W_HOVER
            : CARD_W_INACTIVE,
        transition: "width 360ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        className="relative h-[481px] w-full overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "hsl(255, 25%, 98%)",
          // Saturation easing:
          //  - active card: full colour (1)
          //  - hovered inactive: ~70% saturated, smooths in alongside
          //    the 40 px width expansion
          //  - default inactive: fully desaturated (0)
          // The same 360 ms cubic-bezier matches the width transition
          // so saturation and expansion play in lockstep.
          filter: isActive
            ? "saturate(1)"
            : isHovered
              ? "saturate(0.7)"
              : "saturate(0)",
          transition:
            "filter 360ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={section.bg}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover object-center"
        />
        {isActive && section.ActiveOverlay && <section.ActiveOverlay />}
        {isActive && <Timer key={section.id} progress={tickProgress} />}
      </div>

      <div className="flex w-full flex-col gap-1">
        <p
          className="line-clamp-1 text-[16px] font-medium leading-6"
          style={{
            color: "#1d1d16",
            fontFeatureSettings: "'cv08' 1",
          }}
        >
          {section.title}
        </p>
        {/* Description — always reserves a 24 px tall row so toggling
            between cards never re-flows the row's vertical layout.
            Only revealed for the ACTIVE card; blurs in from a softer
            state. Kept on a single line so the text doesn't ladder
            while the card width animates open. */}
        <p
          className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] leading-5"
          style={{
            color: "#5b5b4b",
            height: 20,
            opacity: isActive ? 1 : 0,
            filter: isActive ? "blur(0px)" : "blur(6px)",
            transition: "opacity 360ms ease, filter 360ms ease",
          }}
          aria-hidden={!isActive}
        >
          {section.description}
        </p>
      </div>
    </div>
  );
}

/**
 * 40 px circular progress badge at the top centre of the active card.
 * The ring fills clockwise as the 12-second cycle plays out.
 */
function Timer({ progress }: { progress: number }) {
  // Timer ring thicker and updated every animation frame — no CSS
  // transition, so the progress is dead-smooth instead of stepping
  // every 80 ms. The wrapper plays a one-shot fade + un-blur entrance
  // via the Web Animations API on mount so each click of a step
  // reveals the loader with a soft entrance. Driving it imperatively
  // (rather than via a CSS animation or motion's animate prop)
  // sidesteps the parent's 60 fps progress re-renders, which would
  // otherwise risk re-applying the animation property and pinning
  // the entrance at frame 0.
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof el.animate !== "function") return;
    el.animate(
      [
        { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)" },
      ],
      { duration: 360, easing: "ease-out", fill: "forwards" },
    );
  }, []);
  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute z-20 grid size-10 place-items-center rounded-full"
      style={{
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(43, 43, 34, 0.5)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: 0,
        filter: "blur(8px)",
      }}
      aria-hidden
    >
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle
          cx="14"
          cy="14"
          r={radius}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="3.5"
          fill="none"
        />
        <circle
          cx="14"
          cy="14"
          r={radius}
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 14 14)"
        />
      </svg>
    </div>
  );
}

/**
 * Active overlay for the first section — a non-interactive recreation
 * of the design-mode map popup using the same visual language as the
 * StationPopup / ClickableMap components, but without the close
 * button or the "Design your station" CTA.
 */
function DesignModeMapOverlay() {
  return (
    <>
      {/* Station popup — styled to match StationPopup but without the
          close button or CTA, since this is a static showcase. */}
      <div
        className="pointer-events-none absolute z-10 flex w-[326px] max-w-[calc(100%-32px)] flex-col gap-4 rounded-[20px] p-4 text-white"
        style={{
          left: "50%",
          top: "calc(50% + 31.5px)",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(43, 43, 34, 0.68)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow:
            "0 9px 21px rgba(0,0,0,0.10), 0 37px 37px rgba(0,0,0,0.09), 0 84px 51px rgba(0,0,0,0.05)",
        }}
      >
        {/* Rating pill */}
        <div className="flex h-5 items-center">
          <div className="rounded-full bg-white px-2 py-[2px]">
            <p className="text-[14px] font-medium leading-5 text-neutral-950">
              4.4/5
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col leading-5">
          <p className="text-[14px] font-medium text-white">
            Neighborhood&nbsp;&nbsp;in San Francisco
          </p>
          <p className="text-[14px] font-medium text-white/50">
            Cupertino, CA 95014
          </p>
        </div>

        <Metric label="EV adoption" filled={3} level="HIGH" detail="22% penetration" />
        <Metric
          label="Nearby stations"
          filled={2}
          level="MED"
          detail="251 DCFC ports within 5mi"
        />
        <Metric
          label="Avg. daily traffic"
          filled={3}
          level="HIGH"
          detail="58,353 vehicles"
        />
      </div>
    </>
  );
}

function Metric({
  label,
  filled,
  level,
  detail,
}: {
  label: string;
  filled: number;
  level: "LOW" | "MED" | "HIGH";
  detail: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex h-5 items-center justify-between">
        <p className="text-[14px] font-medium leading-5 text-white">{label}</p>
        <div className="flex h-5 items-center gap-2">
          <div className="flex h-5 items-center gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-[11px] rounded-[2px]"
                style={{
                  backgroundColor:
                    i < filled
                      ? "rgba(255,255,255,1)"
                      : "rgba(255,255,255,0.24)",
                }}
              />
            ))}
          </div>
          <p className="text-[12px] font-bold leading-4 tracking-wide text-white">
            {level}
          </p>
        </div>
      </div>
      <p className="text-[14px] font-medium leading-5 text-white/50">
        {detail}
      </p>
    </div>
  );
}
