/**
 * UI sounds — sourced from the `Minimal` patch by Raphael Salaja.
 *
 * The patch is a JSON file at `.web-kits/minimal.json` (copied in via
 * `npx @web-kits/audio add raphaelsalaja/audio --patch minimal`). This
 * module imports that JSON, validates the shape against
 * `@web-kits/audio`'s `SoundPatch` type, and re-exports each named sound
 * as a strongly-typed `SoundDefinition` that components can feed to
 * `useSound()`.
 *
 * The Minimal patch is described by its author as:
 *   "An ultra-clean sine-based palette for quiet, transparent UI
 *    feedback, made for products that prioritize subtlety, restraint,
 *    and smooth interaction cues over expressive flourish."
 *
 * We map our specific UI interactions onto patch sounds at the bottom of
 * this file — each named export corresponds to one interaction.
 */

import type { SoundDefinition, SoundPatch } from "@web-kits/audio";
import minimalPatch from "../../.web-kits/minimal.json";

export const MINIMAL_PATCH = minimalPatch as unknown as SoundPatch;

const sound = (name: string): SoundDefinition => {
  const def = MINIMAL_PATCH.sounds[name];
  if (!def) throw new Error(`Missing sound "${name}" in Minimal patch`);
  return def;
};

// ─── Interaction-specific exports ─────────────────────────────────────

/** Charging-station pin clicks (subtle tap). */
export const pinClick = sound("click");

/** Generic UI button click — reserved for future use. */
export const uiClick = sound("tap");

/** Popup enter. */
export const popupOpen = sound("expand");

/** Popup exit (X button or outside click). */
export const popupClose = sound("collapse");

/** Mode toggle between Explore ↔ Create — same neutral tab-switch tone. */
export const tabSwitch = sound("tab-switch");

/** Hovering a utilisation bar — very quiet tick. */
export const softTick = sound("hover");

/** Played when the user places a synthetic pin in create mode. */
export const notification = sound("notification");

/** Played when the user clicks the ocean in create mode. */
export const errorSound = sound("error");

/** Kept around for the earlier API. */
export const modeSwitch = tabSwitch;
export const modeSwitchOn = tabSwitch;
export const modeSwitchOff = tabSwitch;
