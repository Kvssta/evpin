"use client";

import { useEffect, useState } from "react";
import { useSound } from "@web-kits/audio/react";
import { uiClick } from "@/lib/ui-sounds";

/**
 * Site-wide sticky navigation.
 *
 * - Transparent at the top of the hero (dark map behind it → white text).
 * - Once the user scrolls, fades in a light progressive blur + subtle
 *   dark tint, with a 0.5 px white hairline at the bottom.
 * - Once the user has scrolled *past the hero*, the text flips to black
 *   for contrast against the white logos / off-white testimonial
 *   sections.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [darkBg, setDarkBg] = useState(true);
  const playClick = useSound(uiClick);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 4);

      // The hero is the first <section>. Once the user scrolls past its
      // bottom (minus the nav height) the nav sits over light sections.
      const hero = document.querySelector("section");
      const navHeight = 72;
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom + y;
        setDarkBg(y + navHeight < heroBottom);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Use data attributes so downstream classes can react.
  const textColour = darkBg ? "#ffffff" : "#0c0c09";
  const textDim = darkBg ? "rgba(255,255,255,0.8)" : "rgba(12,12,9,0.8)";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 w-full"
      data-dark-bg={darkBg ? "true" : "false"}
    >
      {/* Progressive blur + tint layers (only visible once scrolled). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-200"
        style={{ opacity: scrolled ? 1 : 0 }}
      >
        {([
          { blur: 2, midpoint: 100 },
          { blur: 5, midpoint: 70 },
          { blur: 9, midpoint: 40 },
        ] as const).map(({ blur, midpoint }) => (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: `linear-gradient(to bottom, black 0%, transparent ${midpoint}%)`,
              WebkitMaskImage: `linear-gradient(to bottom, black 0%, transparent ${midpoint}%)`,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: darkBg
              ? "rgba(0,0,0,0.14)"
              : "rgba(255,255,255,0.45)",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, transparent 100%)",
          }}
        />
        {/* Bottom hairline removed — the tint + blur fade handles
            separation cleanly on its own. */}
      </div>

      <div
        className="relative mx-auto flex w-[1280px] max-w-full items-center justify-between py-6 transition-colors duration-200"
        style={{ color: textColour }}
      >
        <div className="flex items-center gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/nav-logo.svg"
            alt="EVPin"
            width={23}
            height={32}
            className="h-8 w-auto"
            draggable={false}
            style={{
              filter: darkBg ? undefined : "invert(1)",
            }}
          />
          <nav
            className="flex items-center gap-6 text-[14px] font-bold leading-5 tracking-[-0.01em]"
            style={{ color: textColour }}
          >
            {["Home", "Tracker", "Pricing", "Spexbook", "Changelog"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="transition-colors duration-150"
                  style={{ color: textColour }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = textDim)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = textColour)
                  }
                >
                  {label}
                </a>
              ),
            )}
          </nav>
        </div>
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => playClick()}
            className="h-[34px] cursor-pointer rounded-full px-4 text-[14px] font-medium leading-5 transition-colors duration-150"
            style={{
              backgroundColor: darkBg
                ? "rgba(0,0,0,0.25)"
                : "rgba(12,12,9,0.08)",
              color: textColour,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => playClick()}
            className="h-[34px] cursor-pointer rounded-full px-4 text-[14px] font-medium leading-5 transition-colors duration-150"
            style={{
              backgroundColor: darkBg ? "#ffffff" : "#0c0c09",
              color: darkBg ? "#0c0c09" : "#ffffff",
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </header>
  );
}
