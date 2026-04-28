"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A decorative background layer of US placeholder addresses that only
 * reveal within a soft torch radius around the cursor. When the cursor is
 * outside the layer, the addresses remain fully hidden.
 *
 * The layer is `pointer-events-none` so it never interferes with the
 * content layered above it — mouse tracking happens on window.
 */
const ADDRESSES: string[] = [
  "1600 Pennsylvania Ave NW, Washington, DC 20500",
  "350 5th Ave, New York, NY 10118",
  "1 Infinite Loop, Cupertino, CA 95014",
  "4059 Mt Lee Dr, Los Angeles, CA 90068",
  "600 Montgomery St, San Francisco, CA 94111",
  "233 S Wacker Dr, Chicago, IL 60606",
  "1600 Amphitheatre Pkwy, Mountain View, CA 94043",
  "221B Baker St, Portland, OR 97205",
  "20 W 34th St, New York, NY 10001",
  "1060 W Addison St, Chicago, IL 60613",
  "500 Park Ave, San Jose, CA 95110",
  "3601 S Las Vegas Blvd, Las Vegas, NV 89109",
  "742 Evergreen Terrace, Springfield, IL 62701",
  "1 World Trade Center, New York, NY 10007",
  "201 E Randolph St, Chicago, IL 60601",
  "800 Boylston St, Boston, MA 02199",
  "1200 Getty Center Dr, Los Angeles, CA 90049",
  "100 N Christopher Columbus Blvd, Philadelphia, PA 19106",
  "701 S Columbus Dr, Chicago, IL 60605",
  "1101 Biscayne Blvd, Miami, FL 33132",
  "2901 3rd Ave, Seattle, WA 98121",
  "405 Howard St, San Francisco, CA 94105",
  "1000 Dean St, Brooklyn, NY 11238",
  "4 Pennsylvania Plaza, New York, NY 10001",
  "1500 Market St, Philadelphia, PA 19102",
  "900 N Michigan Ave, Chicago, IL 60611",
  "550 Madison Ave, New York, NY 10022",
  "100 Universal City Plaza, Universal City, CA 91608",
  "200 Santa Monica Pier, Santa Monica, CA 90401",
  "1750 N Harbor Dr, San Diego, CA 92101",
  "301 Mission St, San Francisco, CA 94105",
  "2000 Avenue of the Stars, Los Angeles, CA 90067",
  "1 Bryant Park, New York, NY 10036",
  "432 Park Ave, New York, NY 10022",
  "1200 W Harrison St, Chicago, IL 60607",
  "4000 Central Florida Blvd, Orlando, FL 32816",
  "100 Galvez St, Stanford, CA 94305",
  "1 Michigan Ave, Detroit, MI 48226",
  "600 Congress Ave, Austin, TX 78701",
  "1510 Polaris Pkwy, Columbus, OH 43240",
  "8701 World Center Dr, Orlando, FL 32821",
  "400 S Tryon St, Charlotte, NC 28285",
  "1101 Pacific Ave, Santa Cruz, CA 95060",
  "2100 Woodward Ave, Detroit, MI 48201",
  "600 E Grand Ave, Chicago, IL 60611",
  "9500 Gilman Dr, La Jolla, CA 92093",
  "150 Rosamond Dr, Austin, TX 78734",
  "515 N State St, Chicago, IL 60654",
];

type Pos = { x: number; y: number; inside: boolean };

export function AddressTorchBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0, inside: false });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const flush = () => {
      rafRef.current = null;
      const el = ref.current;
      const p = pendingRef.current;
      if (!el || !p) return;
      const rect = el.getBoundingClientRect();
      const x = p.x - rect.left;
      const y = p.y - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      setPos({ x, y, inside });
    };

    const schedule = () => {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    };

    const onMove = (e: MouseEvent) => {
      pendingRef.current = { x: e.clientX, y: e.clientY };
      schedule();
    };

    // Scroll doesn't move the cursor, but the layer moves under it — so we
    // re-resolve the cached client coords against the new layer rect.
    const onScroll = () => {
      if (pendingRef.current) schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Torch radius and falloff. The mask peaks well below full opacity so
  // even directly under the cursor the addresses feel like a faint hint
  // rather than legible copy. When the cursor leaves the layer, switch
  // to a fully-transparent mask so the addresses disappear entirely.
  const mask = pos.inside
    ? `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 80%)`
    : "linear-gradient(transparent, transparent)";

  // Repeat the list a lot of times so the grid reliably fills a tall
  // scroll section AND every row has enough overflow to wrap with
  // minimal right-edge whitespace.
  const rows = 12;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <div
        // No horizontal padding so the rows extend to both edges of
        // the container. Plenty of items per row + small inter-item
        // gap means each line wraps with minimal trailing whitespace,
        // so the rows visually fill all the way to the right edge.
        className="flex flex-wrap content-start gap-x-5 gap-y-[6px] py-6 text-[11px] font-medium uppercase leading-[18px] tracking-[0.04em]"
        style={{ color: "#c8c6bd" }}
      >
        {Array.from({ length: rows }).flatMap((_, r) =>
          ADDRESSES.map((addr, i) => (
            <span key={`${r}-${i}`} className="whitespace-nowrap">
              {addr}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
