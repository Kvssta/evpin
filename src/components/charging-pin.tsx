"use client";

import { useSound } from "@web-kits/audio/react";
import { pinClick } from "@/lib/ui-sounds";

type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  /** If true, slightly darkens the pin (used when another pin is active). */
  dimmed?: boolean;
  /** If true, renders the pin in yellow to signal a low-quality station. */
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

  // Bright yellow zap on every pin — that's the brand accent. The pin
  // body differentiates state: warning = dark amber, regular = translucent
  // black. Active yellow ring matches the icon.
  const YELLOW_ICON = "#ffd648";
  const YELLOW_RING = "rgba(255, 214, 72, 1)";

  // Yellow pins use an amber-tinted shadow stack rather than black so the
  // depth cue reads as part of the same warm colour world.
  const warningShadowBase =
    "0 1px 2px rgba(120, 78, 0, 0.35), 0 4px 8px rgba(120, 78, 0, 0.30), 0 10px 20px rgba(140, 92, 0, 0.28), 0 18px 32px rgba(140, 92, 0, 0.18)";
  const regularShadowBase =
    "0 1px 2px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.18), 0 10px 20px rgba(0,0,0,0.22), 0 18px 32px rgba(0,0,0,0.14)";

  const shadow = active
    ? warning
      ? `inset 0 0 0 1px ${YELLOW_RING}, ${warningShadowBase}`
      : `inset 0 0 0 1px rgba(255,255,255,1), ${regularShadowBase}`
    : warning
      ? warningShadowBase
      : regularShadowBase;

  // Active state ONLY changes the inset ring — pin's base colour never
  // shifts on click. Yellow pins stay yellow; regular (dark-glass) pins
  // keep their black/30 translucent body. Icon colour is set via `style`
  // so both states get the same yellow zap.
  const color = warning
    ? "bg-[rgba(140,92,0,0.85)] hover:bg-[rgba(140,92,0,0.95)]"
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
        // Icon color contrasts the pin body: warning pins get the yellow
        // zap, regular (black-body) pins get a clean white zap.
        color: warning ? YELLOW_ICON : "#ffffff",
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
