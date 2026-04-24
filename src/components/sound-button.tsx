"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useSound } from "@web-kits/audio/react";
import { uiClick } from "@/lib/ui-sounds";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Drop-in `<button>` that plays the shared `click` sound from the
 * Minimal patch whenever the user clicks it. All other `<button>` props
 * pass through unchanged — `className`, `style`, `onClick`, etc. — so
 * you can use it anywhere a plain button would go.
 */
export const SoundButton = forwardRef<HTMLButtonElement, Props>(
  function SoundButton({ onClick, ...rest }, ref) {
    const play = useSound(uiClick);
    return (
      <button
        ref={ref}
        {...rest}
        onClick={(e) => {
          play();
          onClick?.(e);
        }}
      />
    );
  },
);
