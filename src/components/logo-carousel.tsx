"use client";

/**
 * Horizontal marquee of partner logos pulled from Figma.
 * - Fully uses the SVGs downloaded from the Figma MCP.
 * - Edges fade via a horizontal mask gradient.
 * - Pauses on hover so users can read a specific logo.
 */

type LogoSpec = {
  src: string;
  alt: string;
  /** Rendered height in px; width scales with the SVG's intrinsic aspect ratio. */
  h: number;
  /**
   * Source asset is white-on-transparent — invert it so it reads as a
   * dark gray on the off-white testimonial section instead of being
   * invisible.
   */
  invert?: boolean;
};

const logos: LogoSpec[] = [
  { src: "/figma/logo-chargepoint.svg", alt: "ChargePoint", h: 30 },
  { src: "/figma/logo-evcs.svg", alt: "EVCS", h: 36 },
  { src: "/figma/logo-revel.svg", alt: "Revel", h: 24 },
  { src: "/figma/logo-lynkwell.svg", alt: "Lynkwell", h: 36, invert: true },
  { src: "/figma/logo-xcharge.svg", alt: "XCharge", h: 30, invert: true },
  { src: "/figma/logo-xcharge2.png", alt: "Xcharge", h: 28 },
  { src: "/figma/logo-gorevel.svg", alt: "Gorevel", h: 20, invert: true },
  { src: "/figma/logo-dollande.png", alt: "Dollande", h: 27 },
  { src: "/figma/logo-mn.svg", alt: "MN:", h: 26, invert: true },
  { src: "/figma/logo-everged.png", alt: "eVerged", h: 24, invert: true },
  { src: "/figma/logo-suncoast.svg", alt: "Suncoast Charging", h: 30 },
  { src: "/figma/logo-eos.png", alt: "EOS", h: 28 },
];

export function LogoCarousel() {
  // Duplicate the list so the translate animation can loop seamlessly at -50%
  const loop = [...logos, ...logos];

  return (
    <div
      className="group relative w-full overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        className="flex w-max items-center gap-[60px] py-1 animate-[logo-scroll_60s_linear_infinite] [animation-play-state:running] group-hover:[animation-play-state:paused]"
      >
        {loop.map((l, i) => (
          <div
            key={`${l.alt}-${i}`}
            className="flex shrink-0 items-center"
            style={{ height: 40 }}
            aria-hidden={i >= logos.length ? true : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.src}
              alt={l.alt}
              draggable={false}
              style={{
                height: l.h,
                width: "auto",
                // Render every logo as a solid-black silhouette —
                // white assets get inverted first; everything else
                // gets brightness 0. Hover restores the original
                // filtered state for a subtle reveal.
                filter: l.invert
                  ? "invert(1) brightness(0)"
                  : "brightness(0) saturate(1)",
              }}
              className="block select-none opacity-80 transition-[opacity,filter] duration-200 hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
