"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import { tabSwitch } from "@/lib/ui-sounds";
import { useMode, type Mode } from "./mode-context";

type ToggleButtonProps = {
  id: Mode;
  label: string;
  hotkey: string;
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
};

function ToggleButton({
  id,
  label,
  hotkey,
  active,
  onSelect,
  icon,
}: ToggleButtonProps) {
  // Inactive buttons: fully transparent at all times (no hover bg).
  // Only the text colour responds to hover — lifts from 80% → 100% white.
  const hoverClasses = active
    ? "text-white"
    : "text-white/80 hover:text-white";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-pressed={active}
      aria-keyshortcuts={hotkey}
      data-mode={id}
      onClick={onSelect}
      className={[
        "relative flex h-8 cursor-pointer items-center gap-1 rounded-full",
        "pl-2 pr-[10px] py-px text-[14px] font-medium leading-5",
        "outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-white/70",
        hoverClasses,
      ].join(" ")}
    >
      {active && (
        <motion.span
          layoutId="mode-toggle-indicator"
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.24)" }}
          initial={{ filter: "blur(6px)", scaleY: 0.78, scaleX: 0.9 }}
          animate={{ filter: "blur(0px)", scaleY: 1, scaleX: 1 }}
          exit={{ filter: "blur(6px)", scaleY: 0.78, scaleX: 0.9 }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 380,
              damping: 32,
              mass: 0.6,
            },
            filter: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            scaleY: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            scaleX: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
          }}
        />
      )}
      <span className="relative z-[1] flex items-center gap-1">
        <span className="grid size-5 place-items-center">{icon}</span>
        <span>{label}</span>
        {/* Hotkey pill — matches Figma nodes 125:3097 / 125:3098 */}
        <span
          aria-hidden
          className="grid h-5 w-[18px] place-items-center rounded-[5px] text-center text-[12px] font-medium leading-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.10)",
            color: "#ffffff",
          }}
        >
          {hotkey}
        </span>
      </span>
    </button>
  );
}

function ExploreIcon() {
  // Charging-station glyph — exact port of the Figma source vectors.
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="block"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(2.5 2.5)">
        <path
          d="M8.33333 10V2.5C8.33333 1.57953 7.58714 0.833333 6.66667 0.833333H2.5C1.57953 0.833333 0.833333 1.57953 0.833333 2.5V10M8.33333 10V14.1667H0.833333V10M8.33333 10H0.833333"
          strokeWidth="1.66667"
        />
      </g>
      <g transform="translate(2.5 15.83)">
        <path d="M0.833333 0.833333H14.1667" strokeWidth="1.66667" />
      </g>
      <g transform="translate(13.33 2.92)">
        <path
          d="M0.833354 6.25002V9.16669C0.833354 9.85704 1.393 10.4167 2.08335 10.4167C2.77371 10.4167 3.33335 9.85704 3.33335 9.16669V3.69731C3.33335 3.20268 3.11365 2.7336 2.73366 2.41694L0.833354 0.833354"
          strokeWidth="1.66667"
        />
      </g>
      <g transform="translate(5.08 5.42)">
        <path
          d="M2.67893 0.347884C2.67893 0.0215964 2.27875 -0.124505 2.07673 0.128027L0.077377 2.62734C-0.10397 2.85403 0.0537268 3.19439 0.340107 3.19439H1.32107V4.65212C1.32107 4.9784 1.72125 5.12451 1.92327 4.87197L3.92262 2.37266C4.10397 2.14597 3.94627 1.80561 3.65989 1.80561H2.67893V0.347884Z"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="block"
    >
      <path
        d="M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

export function ModeToggle() {
  const { mode, setMode } = useMode();
  const playTabSwitch = useSound(tabSwitch);
  const handleSelect = (next: Mode) => {
    if (next !== mode) playTabSwitch();
    setMode(next);
  };

  // Global hotkeys: "E" flips to explore, "C" flips to create. Ignored
  // while the user is typing in a form element so hotkeys don't interfere
  // with normal text input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "e") {
        e.preventDefault();
        handleSelect("explore");
      } else if (k === "d") {
        e.preventDefault();
        handleSelect("create");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div
      role="tablist"
      aria-label="Map mode"
      className="pointer-events-auto flex items-center gap-1 rounded-full p-1"
      style={{
        backgroundColor: "rgba(0,0,0,0.24)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <ToggleButton
        id="explore"
        label="Explore"
        hotkey="E"
        icon={<ExploreIcon />}
        active={mode === "explore"}
        onSelect={() => handleSelect("explore")}
      />
      <ToggleButton
        id="create"
        label="Design"
        hotkey="D"
        icon={<CreateIcon />}
        active={mode === "create"}
        onSelect={() => handleSelect("create")}
      />
    </div>
  );
}
