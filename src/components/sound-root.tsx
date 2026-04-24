"use client";

import { SoundProvider } from "@web-kits/audio/react";
import type { ReactNode } from "react";

/**
 * Root wrapper that enables @web-kits/audio for every child component.
 * - `enabled` gates all `useSound()` hooks globally.
 * - `volume` is the master volume (0..1).
 * You can expose these as UI (a toggle button, a slider) later by
 * lifting these into state and passing `onEnabledChange`.
 */
export function SoundRoot({ children }: { children: ReactNode }) {
  return (
    <SoundProvider enabled volume={0.6}>
      {children}
    </SoundProvider>
  );
}
