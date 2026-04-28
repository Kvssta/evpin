const QUOTE = `"We almost dropped $800K on a site that looked perfect on paper. EVpin showed the station two miles away was at 4% utilization. One search paid for years of subscription."`;

/**
 * Static testimonial block. The torch-reveal address layer that used
 * to live here is now hoisted to the parent off-white wrapper so it
 * spans both this section AND the logo carousel above.
 */
export function ScrollTestimonial() {
  return (
    <section
      className="relative w-full"
      style={{
        // Background is `transparent` because the parent wrapper now
        // paints the off-white surface (so the address grid can span
        // both this section and the logo carousel above).
        backgroundColor: "transparent",
        // Subtle inset shadow at the bottom edge — gives the section
        // below (the white "broken by design" section) a sense of
        // sitting elevated on top of this off-white surface.
        boxShadow: "inset 0 -8px 22px -10px rgba(15, 15, 15, 0.05)",
      }}
    >
      <div className="relative z-10 flex w-full justify-center px-6 py-32">
        <div className="flex w-[1280px] max-w-full flex-col items-center">
          <div className="flex w-[768px] max-w-full flex-col items-center gap-8">
            {/* Soft fade-to-bg blob behind the title — keeps the torch
                addresses from competing with the testimonial copy. */}
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-16 -inset-y-12 z-0"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 70% at 50% 50%, hsl(255, 25%, 98%) 45%, hsla(255, 25%, 98%, 0) 85%)",
                }}
              />
              <p className="relative z-10 text-center text-[32px] font-semibold leading-[44px] tracking-[-0.64px] text-neutral-950">
                {QUOTE}
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-[14px] leading-5">
              <p className="font-medium text-neutral-950">
                Nikola Kostadinovic
              </p>
              <p className="font-medium" style={{ color: "#5b5b4b" }}>
                CEO of Adria Studio
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
