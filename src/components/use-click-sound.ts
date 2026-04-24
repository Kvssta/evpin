"use client";

import { useSound } from "@web-kits/audio/react";
import { uiClick } from "@/lib/ui-sounds";

/**
 * Small helper that returns a click handler wrapper: pass your own
 * `onClick` (or nothing) and the returned function plays the shared UI
 * click sound and then forwards the event to your handler.
 *
 *    const onClick = useClickSound(() => console.log("hi"));
 *    <button onClick={onClick}>…</button>
 */
export function useClickSound<E = React.MouseEvent>(
  onClick?: (e: E) => void,
) {
  const play = useSound(uiClick);
  return (e: E) => {
    play();
    onClick?.(e);
  };
}
