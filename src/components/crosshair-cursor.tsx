"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { useMode } from "./mode-context";

/**
 * Page-wide custom cursor. Only active while the user is in "create" mode
 * AND the pointer is hovering over a `data-crosshair-zone="true"` region
 * or a charging-station pin.
 *
 * - Position tracks the mouse directly (no spring) so there's zero lag.
 * - Opacity/blur fades in ~420ms on zone entry, 420ms out on exit.
 * - Over a pin the same icon rotates 45° to signal "target acquired".
 * - In create mode the cursor is the zap-lightning station icon; on pin
 *   hover it becomes white.
 */
export function CrosshairCursor() {
  const { mode, popupOpen } = useMode();
  const [active, setActive] = useState(false);
  const [onPin, setOnPin] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ cx: number; cy: number } | null>(null);

  useEffect(() => {
    const syncZone = (cx: number, cy: number) => {
      const el = document.elementFromPoint(cx, cy) as HTMLElement | null;
      let inZone = false;
      let hoveringPin = false;
      let node: HTMLElement | null = el;
      while (node) {
        if (node.dataset?.crosshairZone === "true") inZone = true;
        if (
          node.tagName === "BUTTON" &&
          node.getAttribute("aria-label") === "Charging station"
        ) {
          hoveringPin = true;
          inZone = true;
        }
        node = node.parentElement;
      }
      setActive(inZone);
      setOnPin(hoveringPin);
    };

    const flush = () => {
      const p = pendingRef.current;
      rafRef.current = null;
      if (!p) return;
      syncZone(p.cx, p.cy);
    };

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      pendingRef.current = { cx: e.clientX, cy: e.clientY };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    };

    const onLeave = () => setActive(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [x, y]);

  // Gate the entire cursor on create mode + active zone + no popup open.
  // While a popup is visible the user should see the native system cursor
  // so they can interact with buttons normally.
  const cursorVisible = mode === "create" && active && !popupOpen;

  return (
    <>
      {/* Hide the native cursor only while in create mode AND no popup is
          open. Once a popup appears the native cursor returns. */}
      {mode === "create" && !popupOpen && (
        <style>{`
          [data-crosshair-zone="true"],
          [data-crosshair-zone="true"] *,
          button[aria-label="Charging station"],
          button[aria-label="Charging station"] * {
            cursor: none !important;
          }
        `}</style>
      )}

      <motion.div
        aria-hidden
        style={{ x, y, translate: "-50% -50%" }}
        animate={{
          opacity: cursorVisible ? 1 : 0,
          filter: cursorVisible ? "blur(0px)" : "blur(14px)",
          rotate: onPin ? 45 : 0,
        }}
        transition={{
          opacity: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
          rotate: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        }}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-[32px] w-[32px]"
      >
        {/* Zap-lightning pin from Figma node 99:3523 — rendered as a
            shadowed pill-disc containing the lightning glyph. */}
        <div
          className="relative grid size-8 place-items-center rounded-full"
          style={{
            backgroundColor: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow:
              "0 1px 1px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.09), 0 5px 3px rgba(0,0,0,0.05), 0 9px 4px rgba(0,0,0,0.01)",
          }}
        >
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="block"
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
          </motion.svg>
        </div>
      </motion.div>
    </>
  );
}
