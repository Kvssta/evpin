"use client";

import { useSound } from "@web-kits/audio/react";
import { pinClick } from "@/lib/ui-sounds";

type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  /** If true, slightly darkens the pin (used when another pin is active). */
  dimmed?: boolean;
  /** If true, renders the pin in red to signal a low-quality station. */
  warning?: boolean;
};

export function ChargingPin({ onClick, active, dimmed, warning }: Props) {
  // Station-click sound: a quick, short pure-sine blip (920 Hz, ~60 ms
  // decay). No-ops if sound is disabled globally via SoundProvider.
  const playClick = useSound(pinClick);
  // Default cursor on pins is `grab`; flips to `grabbing` while pressed.
  // In create mode a global rule overrides this with `cursor: none`.
  const base =
    "relative grid size-8 cursor-grab active:cursor-grabbing place-items-center rounded-full backdrop-blur-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 transition-[background-color,transform,box-shadow,filter] duration-150";

  // White zap on regular pins, red zap on warning (low-rated) pins. The
  // active-state ring matches: white ring on regular, red ring on
  // warning — strong contrast against their respective pin bodies.
  const RED_ICON = "#ff6b6b";
  const RED_RING = "rgba(255, 107, 107, 1)";

  // Warning pins use a red-tinted shadow stack so the depth cue stays
  // in the same colour world as the body.
  const warningShadowBase =
    "0 1px 2px rgba(100, 20, 20, 0.35), 0 4px 8px rgba(100, 20, 20, 0.30), 0 10px 20px rgba(120, 25, 25, 0.28), 0 18px 32px rgba(120, 25, 25, 0.18)";
  const regularShadowBase =
    "0 1px 2px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.18), 0 10px 20px rgba(0,0,0,0.22), 0 18px 32px rgba(0,0,0,0.14)";

  const shadow = active
    ? warning
      ? `inset 0 0 0 1px ${RED_RING}, ${warningShadowBase}`
      : `inset 0 0 0 1px rgba(255,255,255,1), ${regularShadowBase}`
    : warning
      ? warningShadowBase
      : regularShadowBase;

  // Active state ONLY changes the inset ring — pin's base colour never
  // shifts on click. Warning (low-rated) pins stay red; regular pins
  // keep their black/30 translucent body. Icon colour is set via `style`
  // so warning pins get the red zap; regular pins the white zap.
  const color = warning
    ? "bg-[rgba(140,20,20,0.85)] hover:bg-[rgba(140,20,20,0.95)]"
    : "bg-black/30 hover:bg-black/55";

  return (
    <button
      type="button"
      onClick={(e) => {
        playClick();
        onClick?.(e);
      }}
      aria-label="Charging station"
      aria-pressed={active}
      data-active={active ? "true" : "false"}
      style={{
        filter: dimmed ? "brightness(0.8) saturate(0.9)" : undefined,
        // Warning (low-rated) pins get a red zap; regular pins white.
        color: warning ? RED_ICON : "#ffffff",
        boxShadow: shadow,
      }}
      className={`${base} ${color}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 16"
        fill="none"
        aria-hidden
        className="pointer-events-none"
      >
        <path
          d="M9 0.667C9 -0.156 7.923 -0.484 7.459 0.195L0.739 10.278C0.376 10.832 0.773 11.5 1.438 11.5H5V15.333C5 16.156 6.077 16.484 6.541 15.805L13.261 5.722C13.624 5.168 13.227 4.5 12.562 4.5H9V0.667Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
