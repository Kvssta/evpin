"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import { notification, errorSound } from "@/lib/ui-sounds";
import { StationPopup, type Placement } from "./station-popup";
import { useMode } from "./mode-context";

/**
 * Right-half "drop a pin" interactive layer.
 *
 * - When the cursor is over the layer (roughly the right half of the hero)
 *   it switches to a crosshair, inviting the user to drop a pin anywhere
 *   on the map.
 * - On click, we sample the pixel colour from the basemap PNG via an
 *   offscreen canvas to decide whether the click landed on ocean or land.
 * - A popup using the same `StationPopup` form factor opens at the click
 *   location — neighborhoods get a neutral 3–5 rating with neighborhood +
 *   EV adoption stats, while ocean clicks get a 0/5 blue popup with shark
 *   amount + water saltiness.
 */

const NEIGHBORHOODS = [
  { name: "Mission Bay", zip: "94158" },
  { name: "Hayes Valley", zip: "94102" },
  { name: "The Castro", zip: "94114" },
  { name: "Nob Hill", zip: "94109" },
  { name: "Potrero Hill", zip: "94107" },
  { name: "Noe Valley", zip: "94114" },
  { name: "Bernal Heights", zip: "94110" },
  { name: "SoMa", zip: "94103" },
  { name: "North Beach", zip: "94133" },
  { name: "Glen Park", zip: "94131" },
];

const OCEAN_NAMES = [
  { name: "Pacific Ocean", zip: "Offshore" },
  { name: "Gulf of the Farallones", zip: "Coastal Waters" },
  { name: "Point Lobos Waters", zip: "California Coast" },
  { name: "Baker Beach Swells", zip: "San Francisco Bay Waters" },
];

type Click = {
  x: number;
  y: number;
  type: "land" | "ocean";
  data: {
    rating: string;
    address: string;
    city: string;
    metrics: Array<{
      label: string;
      level: "LOW" | "MED" | "HIGH";
      filled: number;
      detailPrefix?: string;
      detailSuffix?: string;
      number?: number;
      format?: (n: number) => string;
    }>;
    regional?: {
      level: "LOW" | "MED" | "HIGH";
      filled: number;
      percent: number;
    };
  };
  placement: Placement;
  offsetX: number;
  offsetY: number;
};

const EDGE_GUARD = 24;

/** Clamp the popup so it's at least EDGE_GUARD px from the viewport AND
 *  the hero section edges. Hero has overflow:hidden so we must keep the
 *  popup inside it, not just inside the viewport. */
function clampedOffsetViewport(
  clientX: number,
  clientY: number,
  placement: Placement,
  heroRect: DOMRect | null,
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minX = Math.max(EDGE_GUARD, (heroRect?.left ?? 0) + EDGE_GUARD);
  const maxX = Math.min(
    vw - POPUP_W - EDGE_GUARD,
    (heroRect?.right ?? vw) - POPUP_W - EDGE_GUARD,
  );
  const minY = Math.max(EDGE_GUARD, (heroRect?.top ?? 0) + EDGE_GUARD);
  const maxY = Math.min(
    vh - POPUP_H - EDGE_GUARD,
    (heroRect?.bottom ?? vh) - POPUP_H - EDGE_GUARD,
  );

  if (placement === "top" || placement === "bottom") {
    const desiredLeft = clientX - POPUP_W / 2;
    const clamped = Math.max(minX, Math.min(maxX, desiredLeft));
    return { offsetX: clamped - desiredLeft, offsetY: 0 };
  }
  const desiredTop = clientY - POPUP_H / 2;
  const clamped = Math.max(minY, Math.min(maxY, desiredTop));
  return { offsetX: 0, offsetY: clamped - desiredTop };
}

const commas = (n: number) => n.toLocaleString();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateLandData(): Click["data"] {
  const n = NEIGHBORHOODS[randInt(0, NEIGHBORHOODS.length - 1)];
  const score = randInt(30, 50) / 10; // 3.0 - 5.0
  const neighbourhoodFilled = score >= 4.5 ? 3 : score >= 3.8 ? 2 : 1;
  const adoptionFilled = randInt(1, 3);
  const stationsFilled = randInt(1, 3);
  const levelLabel = (n: number) =>
    n === 3 ? "HIGH" : n === 2 ? "MED" : "LOW";
  return {
    rating: `${score.toFixed(1)}/5`,
    address: n.name,
    city: `San Francisco, CA ${n.zip}`,
    metrics: [
      {
        label: "Neighborhood rating",
        level: levelLabel(neighbourhoodFilled) as "LOW" | "MED" | "HIGH",
        filled: neighbourhoodFilled,
        number: score,
        format: (v: number) => `${v.toFixed(1)}/5`,
        detailSuffix: " avg. review",
      },
      {
        label: "EV adoption",
        level: levelLabel(adoptionFilled) as "LOW" | "MED" | "HIGH",
        filled: adoptionFilled,
        number: randInt(8, 32),
        format: (v: number) => `${v}%`,
        detailSuffix: " penetration",
      },
      {
        label: "Nearby stations",
        level: levelLabel(stationsFilled) as "LOW" | "MED" | "HIGH",
        filled: stationsFilled,
        number: randInt(18, 360),
        format: commas,
        detailSuffix: " DCFC ports within 5mi",
      },
    ],
    // Regional utilisation — share of nearby chargers currently in use.
    regional: (() => {
      const percent = randInt(20, 90);
      const filled = percent >= 65 ? 3 : percent >= 35 ? 2 : 1;
      const level = (filled === 3 ? "HIGH" : filled === 2 ? "MED" : "LOW") as
        | "LOW"
        | "MED"
        | "HIGH";
      return { level, filled, percent };
    })(),
    // Utilisation chart is reserved for existing stations only; create-mode
    // placements don't have historical usage data yet.
  };
}

function generateOceanData(): Click["data"] {
  const n = OCEAN_NAMES[randInt(0, OCEAN_NAMES.length - 1)];
  const sharkFilled = randInt(1, 3);
  const saltFilled = randInt(1, 3);
  const levelLabel = (n: number) =>
    n === 3 ? "HIGH" : n === 2 ? "MED" : "LOW";
  return {
    rating: "0/5",
    address: n.name,
    city: n.zip,
    metrics: [
      {
        label: "Shark amount",
        level: levelLabel(sharkFilled) as "LOW" | "MED" | "HIGH",
        filled: sharkFilled,
        number: randInt(12, 380),
        format: commas,
        detailSuffix: " sharks within 5mi",
      },
      {
        label: "Water saltiness",
        level: levelLabel(saltFilled) as "LOW" | "MED" | "HIGH",
        filled: saltFilled,
        number: randInt(30, 40) / 10,
        format: (v: number) => `${v.toFixed(1)}%`,
        detailSuffix: " salinity",
      },
    ],
  };
}

// Popup geometry for smart placement inside the section.
const POPUP_W = 326;
const POPUP_H = 360;
const GAP = 15;
// Placeholder pin matches the charging station pin size.
const PIN_SIZE = 32;
// Distance from the anchor (click centre) to the popup edge. Matches
// bottom-[calc(100%+15px)] used for real station pins.
const POPUP_OFFSET = GAP + PIN_SIZE / 2;

function pickPlacement(x: number, y: number, w: number, h: number): Placement {
  const spaceTop = y;
  const spaceBottom = h - y;
  const spaceLeft = x;
  const spaceRight = w - x;

  // Only pick top/bottom if the popup's width also fits horizontally
  // centred on the click point; same for left/right needing vertical fit.
  const fitsHorizontally = x - POPUP_W / 2 >= 8 && w - (x + POPUP_W / 2) >= 8;
  const fitsVertically = y - POPUP_H / 2 >= 8 && h - (y + POPUP_H / 2) >= 8;

  if (spaceBottom >= POPUP_H + GAP && fitsHorizontally) return "bottom";
  if (spaceTop >= POPUP_H + GAP && fitsHorizontally) return "top";
  if (spaceRight >= POPUP_W + GAP && fitsVertically) return "right";
  if (spaceLeft >= POPUP_W + GAP && fitsVertically) return "left";

  // Degenerate: pick whichever side has the most raw space.
  const options: Array<[Placement, number]> = [
    ["top", spaceTop],
    ["bottom", spaceBottom],
    ["right", spaceRight],
    ["left", spaceLeft],
  ];
  options.sort((a, b) => b[1] - a[1]);
  return options[0][0];
}

const placementStyle = (p: Placement) => {
  switch (p) {
    case "top":
      return { bottom: POPUP_OFFSET, transform: "translateX(-50%)", left: 0 } as const;
    case "bottom":
      return { top: POPUP_OFFSET, transform: "translateX(-50%)", left: 0 } as const;
    case "left":
      return { right: POPUP_OFFSET, transform: "translateY(-50%)", top: 0 } as const;
    case "right":
      return { left: POPUP_OFFSET, transform: "translateY(-50%)", top: 0 } as const;
  }
};

export function ClickableMap() {
  const { mode, setPopupOpen } = useMode();
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<{
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
  } | null>(null);
  const [click, setClick] = useState<Click | null>(null);
  const playNotification = useSound(notification);
  const playError = useSound(errorSound);

  // Drop any open popup and clear the crosshair zone when the user
  // leaves create mode.
  useEffect(() => {
    if (mode !== "create") {
      setClick(null);
      if (layerRef.current) layerRef.current.dataset.crosshairZone = "false";
    }
  }, [mode]);

  // Report popup state so the parallax layer can freeze and the custom
  // cursor can yield to the native cursor while a popup is visible.
  useEffect(() => {
    setPopupOpen("click", !!click);
    // Also clear the crosshair zone while the popup is open so the custom
    // cursor fades out and the native cursor comes back.
    if (layerRef.current) {
      if (click) layerRef.current.dataset.crosshairZone = "false";
    }
    return () => setPopupOpen("click", false);
  }, [click, setPopupOpen]);

  // Preload basemap into an offscreen canvas for pixel sampling.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/figma/basemap-new.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvasRef.current = {
        ctx,
        w: img.naturalWidth,
        h: img.naturalHeight,
      };
    };
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!click) return;
    const onDocClick = () => setClick(null);
    const id = setTimeout(() => {
      document.addEventListener("click", onDocClick);
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClick(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [click]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only "create" mode places pins — explore mode is strictly for
    // interacting with existing charging stations.
    if (mode !== "create") return;
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    if (!layer) return;

    const rect = layer.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Determine ocean vs land via pixel sampling, with a positional
    // fallback if the canvas isn't ready yet.
    let isOcean = cx < rect.width * 0.08; // far left fallback
    if (canvas) {
      const imgAspect = canvas.w / canvas.h;
      const sectionAspect = rect.width / rect.height;
      let scale: number;
      let offsetX = 0;
      let offsetY = 0;
      if (sectionAspect > imgAspect) {
        // object-cover: width limiting
        scale = rect.width / canvas.w;
        offsetY = (canvas.h * scale - rect.height) / 2;
      } else {
        scale = rect.height / canvas.h;
        offsetX = (canvas.w * scale - rect.width) / 2;
      }
      const imgX = Math.min(
        canvas.w - 1,
        Math.max(0, (cx + offsetX) / scale),
      );
      const imgY = Math.min(
        canvas.h - 1,
        Math.max(0, (cy + offsetY) / scale),
      );
      try {
        const [r, g, b] = canvas.ctx.getImageData(
          Math.floor(imgX),
          Math.floor(imgY),
          1,
          1,
        ).data;
        // Blue dominates on ocean pixels in this basemap.
        isOcean = b > 140 && b > r * 1.08 && b > g * 0.92 && r < 200;
      } catch {
        /* canvas tainted, fall through to heuristic */
      }
    }

    const data = isOcean ? generateOceanData() : generateLandData();
    // Land → success notification chime. Ocean → error sound to signal
    // "you can't place a station in the water".
    if (isOcean) {
      playError();
    } else {
      playNotification();
    }
    const placement = pickPlacement(cx, cy, rect.width, rect.height);
    // `rect` is the layer's rect inside the hero, which conveniently is
    // also the hero section's content rect (the ClickableMap is
    // `inset-0` inside the section). Use it as the hero rect clamp.
    const off = clampedOffsetViewport(
      e.clientX,
      e.clientY,
      placement,
      rect,
    );

    setClick({
      x: cx,
      y: cy,
      type: isOcean ? "ocean" : "land",
      data,
      placement,
      offsetX: off.offsetX,
      offsetY: off.offsetY,
    });
  }, [mode, playNotification, playError]);

  return (
    <div
      ref={layerRef}
      // Full-width overlay. We flip `data-crosshair-zone` on/off based on
      // the cursor's horizontal position — the CrosshairCursor component
      // picks that up and paints the custom SVG on the right half. When a
      // popup is open, the whole layer lifts above the pins (z-10) and the
      // sticky nav (z-50) so the popup renders on top.
      className={`absolute inset-0 ${click ? "z-[60]" : "z-[8]"}`}
      // Tell downstream components whether this layer is "armed" (create
      // mode). The CrosshairCursor reads this so it only takes over the
      // native cursor while in create mode.
      data-create-mode={mode === "create" ? "true" : "false"}
      onClick={handleClick}
      onMouseMove={(e) => {
        // Explore mode keeps the native cursor — don't toggle the zone.
        // Also keep the native cursor while a popup is open so the user
        // can interact with the popup without the custom cursor on top.
        if (mode !== "create" || click) return;
        const el = e.currentTarget;
        el.dataset.crosshairZone = "true";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.dataset.crosshairZone = "false";
      }}
    >
      <AnimatePresence>
        {click && (
          <div
            key={`${click.x}-${click.y}`}
            className="absolute z-[60]"
            style={{ left: click.x, top: click.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Placeholder pin — only for land clicks. Same 32×32 size as
                real station pins, and z-10 so it sits above the popup's
                drop shadow. We animate only opacity + scale on the wrapper
                (animating `filter` on the parent short-circuits
                `backdrop-filter` on the child), and keep a real backdrop
                blur on the inner disc so the map behind it blurs. */}
            {click.type === "land" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute left-0 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
              >
                <div
                  className="grid place-items-center rounded-full"
                  style={{
                    width: PIN_SIZE,
                    height: PIN_SIZE,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(10px) saturate(1.1)",
                    WebkitBackdropFilter: "blur(10px) saturate(1.1)",
                    boxShadow:
                      "0 1px 1px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.09), 0 5px 3px rgba(0,0,0,0.05), 0 9px 4px rgba(0,0,0,0.01)",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="3 4"
                    />
                  </svg>
                </div>
              </motion.div>
            )}

            {/* Wrapper gives the popup an anchor point at the clicked
                coord. The inner popup positions itself relative to that
                anchor using `placementStyle`. z-[60] puts it above the
                pins layer (z-10) and the sticky nav (z-50). */}
            <div
              className="z-[60]"
              style={{
                position: "absolute",
                ...placementStyle(click.placement),
              }}
            >
              <StationPopup
                rating={click.data.rating}
                address={click.data.address}
                city={click.data.city}
                metrics={click.data.metrics}
                regional={click.data.regional}
                placement={click.placement}
                offsetX={click.offsetX}
                offsetY={click.offsetY}
                variant={click.type === "ocean" ? "ocean" : undefined}
                hideCta={click.type === "ocean"}
                onClose={() => setClick(null)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
