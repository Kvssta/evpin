"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";

/**
 * "Broken by design" section — a tall, sticky-pinned scroll experience.
 *
 * The user lands on a Studio Display mockup with a Chrome window full of
 * tabs (Apple Maps, zoning laws, flood maps, EV registration data…). As
 * they scroll, the tabs collapse one by one from right to left until a
 * single EVPin tab takes their place — the active tab content cross-
 * fades from the Apple Maps screenshot to a non-interactive preview of
 * the live EVPin hero.
 *
 * Tabs are hoverable and clickable to switch between them, but the close
 * (×) button is intentionally inert: the only way to close them is to
 * scroll.
 */

type TabFavicon = "maps" | "google";
type Tab = {
  id: string;
  title: string;
  url: string;
  display: string;
  favicon: TabFavicon;
};

const TABS: Tab[] = [
  {
    id: "maps",
    title: "1 Infinite Loop on Apple Maps shows",
    url: "maps.apple.com / Infinite Loop 1 - Apple Maps",
    display: "maps.apple.com",
    favicon: "maps",
  },
  {
    id: "google-good-loc",
    title: "Is 1 Infinite Loop a good location for my next EV charging station",
    url: "google.com/search?q=ev+charging+station+1+infinite+loop",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-zoning",
    title: "Zoning laws near 1 Infinite Loop, California",
    url: "google.com/search?q=zoning+laws+1+infinite+loop",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-flood",
    title: "Flood map across California, United States",
    url: "google.com/search?q=california+flood+map",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-registrations",
    title: "EV Registration data for California",
    url: "google.com/search?q=ev+registration+data+california",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-permits",
    title: "Solar and EVSE permit timelines in Cupertino",
    url: "google.com/search?q=cupertino+evse+permit+timeline",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-superchargers",
    title: "Tesla Supercharger locations near Cupertino, CA",
    url: "google.com/search?q=tesla+supercharger+near+cupertino",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-utility",
    title: "PG&E EV interconnection application portal",
    url: "google.com/search?q=pge+ev+interconnection+application",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-tax",
    title: "Federal EV charging tax credit 30C eligibility 2026",
    url: "google.com/search?q=federal+ev+charging+tax+credit+30C",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-traffic",
    title: "Foot traffic counts for Cupertino retail corridors",
    url: "google.com/search?q=cupertino+foot+traffic+counts",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-grid",
    title: "California ISO grid capacity forecasts by zone",
    url: "google.com/search?q=caiso+grid+capacity+forecasts",
    display: "google.com",
    favicon: "google",
  },
  {
    id: "google-utilization",
    title: "Average DCFC utilization in Bay Area MSA",
    url: "google.com/search?q=dcfc+utilization+bay+area",
    display: "google.com",
    favicon: "google",
  },
];

// Per-tab tilt angles for the disintegration animation — fixed so
// the same tab always falls the same way (and so SSR matches CSR).
const TAB_FALL_ANGLES = [-7, 11, -14, 9, -5, 13, -10, 7, -13, 10, -6, 16];
// Inner width of the falling button — kept at the tab's base width
// so the button doesn't squish horizontally as the wrapper shrinks
// (the wrapper has overflow-visible, so the button overflows
// rightward and falls out of frame instead of being squashed).
const TAB_BASE_PX_INNER = 170;

// Phase thresholds across the section's scroll range. `TAB_FADE_END`
// is the latest slot-START — the actual fall windows extend past it
// (see WINDOW_MULTIPLIER), so EVPin opens slightly later, after the
// last (Maps) tab has finished its fall.
const TAB_FADE_START = 0.20;
const TAB_FADE_END = 0.40;
const EVPIN_TAB_OPEN_START = 0.46;
const EVPIN_TAB_OPEN_END = 0.52;
const CONTENT_MORPH_START = 0.52;
const CONTENT_MORPH_END = 0.60;

function MapsFavicon({ size = 16 }: { size?: number }) {
  // Apple Maps app icon (lifted from the Figma dock so it reads as
  // the real macOS Maps logo, not a CSS approximation).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/figma/apple-maps-icon.png"
      alt=""
      draggable={false}
      style={{ width: size, height: size }}
      className="shrink-0 select-none rounded-[2px]"
      aria-hidden
    />
  );
}

function GoogleFavicon({ size = 16 }: { size?: number }) {
  return (
    <Image
      src="/figma/google-favicon.png"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 select-none"
      draggable={false}
    />
  );
}

function EvpinFavicon({ size = 16 }: { size?: number }) {
  // Compact lightning-bolt mark in EVPin charcoal.
  return (
    <div
      className="grid shrink-0 place-items-center rounded-[3px]"
      style={{
        width: size,
        height: size,
        backgroundColor: "#0c0c09",
      }}
      aria-hidden
    >
      <svg
        width={size * 0.55}
        height={size * 0.7}
        viewBox="0 0 14 16"
        fill="none"
      >
        <path
          d="M9 0.667C9 -0.156 7.923 -0.484 7.459 0.195L0.739 10.278C0.376 10.832 0.773 11.5 1.438 11.5H5V15.333C5 16.156 6.077 16.484 6.541 15.805L13.261 5.722C13.624 5.168 13.227 4.5 12.562 4.5H9V0.667Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}

function TabFavicon({ kind, size }: { kind: TabFavicon; size?: number }) {
  return kind === "maps" ? (
    <MapsFavicon size={size} />
  ) : (
    <GoogleFavicon size={size} />
  );
}

/**
 * One Chrome-style tab. Width animates from full to 0 as the tab's
 * dedicated scroll window plays out. Hover + click are wired to the
 * parent's active-tab state. The close button is intentionally inert.
 */
function TabPill({
  tab,
  isActive,
  width,
  opacity,
  collapseT,
  fallAngle,
  onClick,
}: {
  tab: Tab;
  isActive: boolean;
  width: number;
  opacity: number;
  collapseT: number;
  fallAngle: number;
  onClick: () => void;
}) {
  // Once the user has clicked the (otherwise inert) X, suppress hover
  // feedback on this tab so it stops feeling interactive.
  const [hoverSuppressed, setHoverSuppressed] = useState(false);
  // Disintegration: as `collapseT` runs 0 → 1, the tab drops
  // downward, rotates by its assigned angle, and blurs out — the
  // wrapper's overflow-visible lets the falling content escape its
  // shrinking layout footprint.
  const fallY = collapseT * 200;
  const rotation = collapseT * fallAngle;
  const blur = collapseT * 5;
  return (
    <div
      style={{
        width,
        opacity,
        // Longer, gentler easing so the layout collapse + opacity
        // fade match the slower fall animation on the inner button.
        transition:
          "width 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
      }}
      className="relative h-[36px] shrink-0"
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          width: TAB_BASE_PX_INNER,
          transform: `translateY(${fallY}px) rotate(${rotation}deg)`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          transformOrigin: "50% 0%",
          // Long, smooth easing — each tab clearly drifts down and
          // tilts as it falls, rather than snapping out of frame.
          transition:
            "transform 850ms cubic-bezier(0.22, 1, 0.36, 1), filter 700ms ease",
        }}
        className={`group absolute left-0 top-[6px] flex h-[30px] cursor-pointer items-center gap-1.5 overflow-hidden rounded-t-[10px] px-2 text-left transition-colors ${
          isActive
            ? "bg-white"
            : hoverSuppressed
              ? "bg-transparent"
              : "bg-transparent hover:bg-[rgba(255,255,255,0.55)]"
        }`}
        aria-label={tab.title}
      >
        <TabFavicon kind={tab.favicon} size={14} />
        <span
          className="min-w-0 flex-1 truncate text-[11px] font-medium leading-[18px] text-[#1f1f1f]"
          style={{ fontFeatureSettings: "'cv08' 1" }}
        >
          {tab.title}
        </span>
        <span
          // The close button doesn't actually close the tab (the user
          // has to scroll the section to do that). Clicking it just
          // turns off the hover affordance, since at that point the
          // user has tried to dismiss the tab and a hover state would
          // feel misleading.
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            setHoverSuppressed(true);
          }}
          className={`grid size-[14px] place-items-center rounded-full text-[#5a5a5a] transition-opacity ${
            isActive
              ? "opacity-100 hover:bg-black/10"
              : "opacity-0 group-hover:opacity-70"
          }`}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1 1L7 7M7 1L1 7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}

/**
 * Translucent macOS menu bar shown at the very top of the Studio
 * Display screen. The trailing icons use SF Pro's private-use code
 * points (taken straight from the Figma source) so they render as
 * the real macOS menu-bar glyphs. Date + time updates on mount to
 * today's actual date — initial render keeps the time blank to
 * avoid a server/client hydration mismatch.
 */
function MacMenuBar() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = (d: Date) => {
      const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        d.getDay()
      ];
      const mon = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ][d.getMonth()];
      const day = d.getDate();
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${dow} ${mon} ${day}\u00a0\u00a0${h}:${m} ${ampm}`;
    };
    setNow(fmt(new Date()));
    const id = setInterval(() => setNow(fmt(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex h-[26px] shrink-0 items-center justify-between px-3 text-[11px] text-black"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "rgba(255,255,255,0.55)",
      }}
    >
      <div className="flex items-center gap-3 text-[11px] leading-[14px]">
        {/* Apple logo */}
        <svg width="11" height="13" viewBox="0 0 24 28" fill="none" aria-hidden>
          <path
            d="M16.6 14.7c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.3 1-4.1 1-.9 0-2.2-1-3.6-1-1.9 0-3.6 1.1-4.6 2.7-1.9 3.4-.5 8.4 1.4 11.1.9 1.3 2 2.8 3.4 2.7 1.4-.1 1.9-.9 3.5-.9 1.7 0 2.1.9 3.5.9 1.4 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3-.1 0-2.9-1.1-2.7-4.7zM14.1 6.7c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.5-.6.7-1.2 1.9-1.1 3.1 1.2.1 2.3-.5 3-1.3z"
            fill="currentColor"
          />
        </svg>
        <span className="font-bold">Google Chrome</span>
        {[
          "File",
          "Edit",
          "View",
          "History",
          "Bookmarks",
          "Profiles",
          "Tab",
          "Window",
          "Help",
        ].map((label) => (
          <span key={label} className="font-semibold">
            {label}
          </span>
        ))}
      </div>
      <div
        className="flex items-center gap-[10px] text-[12px]"
        style={{ fontFamily: "var(--font-sf-pro)" }}
      >
        {/* SF Pro private-use code points lifted from the Figma source —
            these render as the real macOS menu-bar glyphs (Control
            Center, battery, Wi-Fi, Spotlight, Notification Center). */}
        <span aria-hidden>{"\u{100647}"}</span>
        <span aria-hidden>{"\u{1002AB}"}</span>
        <span aria-hidden>{"\u{10026D}"}</span>
        <span aria-hidden>{"\u{10070A}"}</span>
        <span className="ml-1 font-medium" style={{ fontFamily: "inherit" }}>
          {now}
        </span>
      </div>
    </div>
  );
}

/**
 * Inert preview of the EVPin hero. The image is a literal screenshot
 * of the live hero (captured headless from the running site), so the
 * mockup always reflects the real product without us hand-rebuilding
 * a smaller copy of every component.
 */
function EvpinHeroPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#aad1e2]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/hero-preview.png"
        alt=""
        draggable={false}
        // `object-top` anchors the screenshot to the top edge so the
        // nav (Home / Tracker / Log In / Create Account) is always
        // visible. Combined with `object-cover` and an image that's
        // slightly taller than the container, the screen is fully
        // filled — any cropping happens at the bottom (away from the
        // hero copy and nav).
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top"
      />
    </div>
  );
}

/**
 * Per-tab content. The "maps" tab shows the Apple Maps screenshot we
 * downloaded from Figma; everything else gets a generic faux search
 * results page so switching tabs feels real.
 */
function TabContent({ tab }: { tab: Tab }) {
  if (tab.favicon === "maps") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/figma/apple-maps.png"
        alt="Apple Maps — 1 Infinite Loop"
        className="absolute inset-0 h-full w-full select-none object-cover"
        draggable={false}
      />
    );
  }
  // Per-tab Google search results — concrete, query-specific entries
  // so each tab reads as real research the user might actually do
  // when scoping a charging-station site.
  const results = SEARCH_RESULTS[tab.id] ?? GENERIC_RESULTS;
  return (
    <div className="flex h-full w-full flex-col bg-white px-12 pt-6 text-[#1f1f1f]">
      <div className="flex items-center gap-6 pb-3">
        <div className="text-[18px] font-medium">
          <span style={{ color: "#4285f4" }}>G</span>
          <span style={{ color: "#ea4335" }}>o</span>
          <span style={{ color: "#fbbc05" }}>o</span>
          <span style={{ color: "#4285f4" }}>g</span>
          <span style={{ color: "#34a853" }}>l</span>
          <span style={{ color: "#ea4335" }}>e</span>
        </div>
        <div className="flex h-9 flex-1 items-center gap-3 rounded-full border border-[#dfe1e5] px-4 text-[12px] text-[#1f1f1f]">
          {tab.title}
        </div>
      </div>
      <p className="pt-1 text-[11px] text-[#5f6368]">
        About {results.length}M results (0.42 seconds)
      </p>
      <div className="flex flex-col gap-5 py-5 text-[12px]">
        {results.map((r, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[11px] text-[#5f6368]">
              <span
                className="grid size-[18px] place-items-center rounded-full bg-[#f1f3f4] text-[10px]"
                aria-hidden
              >
                {r.source.charAt(0)}
              </span>
              <span className="text-[12px] text-[#1f1f1f]">{r.source}</span>
              <span>›</span>
              <span className="truncate">{r.path}</span>
            </div>
            <div className="cursor-default text-[16px] leading-[22px] text-[#1a0dab]">
              {r.title}
            </div>
            <div className="text-[12px] leading-[18px] text-[#4d5156]">
              {r.snippet}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type SearchResult = {
  source: string;
  path: string;
  title: string;
  snippet: string;
};

const GENERIC_RESULTS: SearchResult[] = [
  {
    source: "afdc.energy.gov",
    path: "fuels › electricity_locations",
    title: "Alternative Fuels Data Center: Electric Vehicle Charging Stations",
    snippet:
      "Find public EV charging station locations across the U.S. and explore station counts, charger types, and access details by state.",
  },
  {
    source: "ev.energy",
    path: "blog › site-selection",
    title: "Site selection guide for commercial EV charging hubs",
    snippet:
      "How operators evaluate traffic, dwell time, utility capacity, and competition to pick winning charging sites in 2026.",
  },
  {
    source: "rmi.org",
    path: "insights › fast-charging-economics",
    title: "Economics of fast charging — RMI Insight Brief",
    snippet:
      "Recent analysis shows DCFC site profitability hinges more on utilization than on hardware cost; we walk through the model.",
  },
  {
    source: "energy.ca.gov",
    path: "programs › evi",
    title: "California Electric Vehicle Infrastructure Project",
    snippet:
      "CEC funding rounds support fast-charging deployment in disadvantaged communities and along major travel corridors.",
  },
];

const SEARCH_RESULTS: Record<string, SearchResult[]> = {
  "google-good-loc": [
    {
      source: "afdc.energy.gov",
      path: "fuels › electricity_stations",
      title:
        "Public DC Fast Chargers near 1 Infinite Loop, Cupertino — Station Map",
      snippet:
        "There are 38 public DC fast chargers within 5 miles of 1 Infinite Loop, Cupertino. Average uptime over the last 90 days: 94.2%.",
    },
    {
      source: "tesla.com",
      path: "supercharger › cupertino-de-anza",
      title: "Cupertino, CA Supercharger | Tesla",
      snippet:
        "20570 Stevens Creek Blvd, 0.6 mi from 1 Infinite Loop. 12 V3 stalls (250 kW). Open 24 hours. Wait times average 4–6 minutes.",
    },
    {
      source: "reddit.com",
      path: "r/electricvehicles › is_1_infinite_loop_a_good_dcfc_location",
      title: "Is 1 Infinite Loop actually a good DCFC location? : r/electricvehicles",
      snippet:
        "13 votes, 47 comments. Apple's old HQ has plenty of foot traffic but the DCFC market here is saturated — most stalls already sit at <40% utilization…",
    },
    {
      source: "evgo.com",
      path: "locations › cupertino",
      title: "EVgo Fast Charging in Cupertino, CA",
      snippet:
        "Multiple EVgo stations within 4 miles of Apple Park. View pricing, plug types, and live availability for each location.",
    },
  ],
  "google-zoning": [
    {
      source: "cupertino.gov",
      path: "planning › zoning-map",
      title: "City of Cupertino — Interactive Zoning Map",
      snippet:
        "Browse Cupertino zoning districts. 1 Infinite Loop is within the P(MP) Planned Mixed-Use district; ancillary EV charging is permitted by right.",
    },
    {
      source: "codepublishing.com",
      path: "ca › cupertino › 19_56",
      title:
        "Chapter 19.56 EV CHARGING STATIONS — Cupertino Municipal Code",
      snippet:
        "Sets review thresholds for L1, L2, and DCFC installations and outlines parking-stall preservation requirements for non-residential lots.",
    },
    {
      source: "ca-times.brightspotcdn.com",
      path: "documents › cupertino-evcs-permit-checklist",
      title: "Cupertino EVCS permit checklist (PDF)",
      snippet:
        "Required documents for level-2 and DCFC permitting: site plan, single-line diagram, equipment cut sheets, structural review (if applicable).",
    },
    {
      source: "santaclaracounty.gov",
      path: "planning › zoning-codes",
      title: "Santa Clara County zoning codes — quick reference",
      snippet:
        "County-wide overlay districts that may apply within Cupertino city limits, including hillside, transit, and design-review overlays.",
    },
  ],
  "google-flood": [
    {
      source: "msc.fema.gov",
      path: "portal › advanceSearch",
      title: "FEMA Flood Map Service Center | Search By Address",
      snippet:
        "Type in your address to view the official FEMA flood hazard map. The Cupertino area sits primarily in Zone X (minimal flood hazard).",
    },
    {
      source: "water.ca.gov",
      path: "programs › all-programs › flood-management",
      title: "California Department of Water Resources — Flood Management",
      snippet:
        "Statewide flood hazard data, levee performance reports, and post-storm assessments curated by DWR's Flood Management division.",
    },
    {
      source: "noaa.gov",
      path: "stories › 2025-california-flooding-summary",
      title: "2025 California Flooding Year-in-Review | NOAA",
      snippet:
        "Atmospheric-river driven flooding in the 2024–2025 wet season, with detail on Bay Area, Central Coast, and Sacramento Valley impacts.",
    },
    {
      source: "firststreet.org",
      path: "city › cupertino-CA",
      title: "Cupertino, CA Flood Risk — First Street Foundation",
      snippet:
        "67 of 21,089 properties in Cupertino have a >26% chance of being severely affected by flooding over the next 30 years.",
    },
  ],
  "google-registrations": [
    {
      source: "energy.ca.gov",
      path: "data-reports › energy-almanac › zev",
      title: "Light-Duty Vehicle Population — California Energy Almanac",
      snippet:
        "California ZEV population through Q4 2025: 1.94M battery-electric vehicles registered statewide; 18.3% YoY growth.",
    },
    {
      source: "dmv.ca.gov",
      path: "portal › research-statistics",
      title: "DMV Research & Statistics — Fuel Type Registrations",
      snippet:
        "Quarterly registration counts by fuel type. Filter by county, ZIP, model year, and vehicle class. Most recent data: Q4 2025.",
    },
    {
      source: "veloz.org",
      path: "data › california-electric-vehicle-sales",
      title: "California Electric Vehicle Sales Dashboard | Veloz",
      snippet:
        "Interactive dashboard tracking new ZEV sales by quarter, OEM, and vehicle class across California's 58 counties.",
    },
    {
      source: "cdfa.ca.gov",
      path: "agvision › docs › california-zev-market-report",
      title: "California ZEV Market Report (Q4 2025)",
      snippet:
        "EVs accounted for 27.8% of new vehicle sales in California in Q4 2025, up from 24.6% the prior quarter.",
    },
  ],
  "google-permits": [
    {
      source: "cupertino.gov",
      path: "building › solar-evse-checklists",
      title: "Solar & EVSE permit checklists — Building Department",
      snippet:
        "Standardised one-page review for residential and small commercial EVSE installations. Average issue time: 3 business days.",
    },
    {
      source: "permitsonoma.org",
      path: "guides › ev-charging-station-permitting",
      title: "EV Charging Station permitting in Northern California (PDF)",
      snippet:
        "Guidance covering Permit Sonoma, Santa Clara County, and Bay Area cities — including AHJ-specific quirks for DCFC permits.",
    },
    {
      source: "energy.ca.gov",
      path: "publications › solar-evse-streamlined-permitting",
      title:
        "Streamlined permitting handbook for solar PV and EVSE installations",
      snippet:
        "CEC handbook outlining AB 1236 expedited-permitting requirements and SOLARAPP+ rollout for jurisdictions statewide.",
    },
  ],
  "google-superchargers": [
    {
      source: "tesla.com",
      path: "findus",
      title: "Find Us | Tesla — Superchargers near Cupertino, CA",
      snippet:
        "12 Supercharger sites within 10 miles of Cupertino, totaling 142 stalls. Live wait times available in the Tesla mobile app.",
    },
    {
      source: "supercharge.info",
      path: "map",
      title: "Tesla Supercharger Map | supercharge.info",
      snippet:
        "Independently maintained map of every Supercharger location worldwide, with stall counts, power levels, and historical commissioning dates.",
    },
    {
      source: "plugshare.com",
      path: "location › tesla-supercharger-cupertino-ca",
      title: "Tesla Supercharger — Cupertino, CA | PlugShare",
      snippet:
        "User-submitted check-ins, photos, and reliability ratings for the Cupertino Supercharger location near De Anza Boulevard.",
    },
  ],
  "google-utility": [
    {
      source: "pge.com",
      path: "ev-fleet › interconnection",
      title: "EV charging interconnection — PG&E Business",
      snippet:
        "Apply online for service-line and panel upgrades to support EV charging. Typical timeline: 6–14 weeks depending on capacity request.",
    },
    {
      source: "pge.com",
      path: "make-ready › evfast",
      title: "EV Fast Charge program — PG&E Make-Ready Infrastructure",
      snippet:
        "PG&E builds the make-ready infrastructure for qualifying DCFC sites in their service area. Site host pays a fixed contribution.",
    },
    {
      source: "cpuc.ca.gov",
      path: "industries-and-topics › electrical-energy › transportation",
      title:
        "Transportation Electrification | California Public Utilities Commission",
      snippet:
        "CPUC oversight of investor-owned utility EV programs, including PG&E EV Charge Network 2.0 and SCE Charge Ready 3.",
    },
  ],
  "google-tax": [
    {
      source: "irs.gov",
      path: "credits-deductions › alternative-fuel-vehicle-refueling",
      title:
        "Alternative Fuel Vehicle Refueling Property Credit (Section 30C)",
      snippet:
        "Up to 30% (max $100,000) per item of qualifying EV charging equipment placed in service in eligible census tracts in 2026.",
    },
    {
      source: "energy.gov",
      path: "save › alternative-fuel-tax-credit-30C",
      title: "30C Alternative Fuel Tax Credit — DOE Office of Energy",
      snippet:
        "Eligibility: low-income or non-urban census tracts. Stackable with state programs. Updated for the 2026 tax year.",
    },
    {
      source: "smartgrowthamerica.org",
      path: "resource › 30C-eligibility-mapper",
      title: "30C eligible census tract mapper",
      snippet:
        "Interactive tool — drop a pin to see whether the surrounding census tract qualifies for the federal 30C charging-equipment credit.",
    },
  ],
  "google-traffic": [
    {
      source: "placer.ai",
      path: "insights › cupertino-retail-corridors",
      title: "Cupertino retail corridor foot-traffic, Q3 2025 — Placer.ai",
      snippet:
        "Stevens Creek Blvd retail corridors averaged 142K weekly visits in Q3 2025, up 6.4% YoY despite weak overall mall traffic.",
    },
    {
      source: "stl.census.gov",
      path: "places › 06-cupertino-CA",
      title: "Cupertino, CA — U.S. Census QuickFacts",
      snippet:
        "Population, daytime employment, and commute-pattern statistics for Cupertino. Daytime employment +21% relative to residential population.",
    },
    {
      source: "kalibrate.com",
      path: "case-studies › ev-site-selection",
      title: "Using mobile-traffic data to vet EV charging sites — Kalibrate",
      snippet:
        "Case study: how Kalibrate's traffic-cohort analysis identified two underperforming sites in the Bay Area worth divesting.",
    },
  ],
  "google-grid": [
    {
      source: "caiso.com",
      path: "todays-outlook › supply",
      title: "Today's Outlook — California ISO supply forecast",
      snippet:
        "Real-time and 7-day capacity outlook for the CAISO grid, including renewable contribution and net peak load forecasts.",
    },
    {
      source: "caiso.com",
      path: "documents › 2025-2026-transmission-plan",
      title: "2025–2026 Transmission Plan (PDF)",
      snippet:
        "CAISO's annual transmission planning report. Includes zone-level capacity headroom and proposed upgrades for Bay Area substations.",
    },
    {
      source: "energy.ca.gov",
      path: "programs › grid-planning › ipe",
      title: "Integrated Energy Policy Report — CEC Grid Planning",
      snippet:
        "Forecasted statewide load growth driven by transportation electrification and building electrification through 2035.",
    },
  ],
  "google-utilization": [
    {
      source: "rmi.org",
      path: "insights › dcfc-utilization-q4-2025",
      title: "DCFC utilization in California metros, Q4 2025 — RMI",
      snippet:
        "Bay Area MSA average utilization sits at 18.3% (median session length 22 min). Outliers driven by airport-adjacent stations.",
    },
    {
      source: "evadoption.com",
      path: "data › charger-utilization-by-msa",
      title: "Charger utilization by MSA — EVAdoption",
      snippet:
        "Quarterly leaderboard of public DCFC utilization by metropolitan area; the Bay Area sits 4th nationally for sustained utilization.",
    },
    {
      source: "atlaspolicy.com",
      path: "research › fast-charging-utilization-trends",
      title: "Fast-charging utilization trends — Atlas Public Policy",
      snippet:
        "Longitudinal analysis (2019–2025) of utilization growth on networks operated by EVgo, Electrify America, and ChargePoint.",
    },
  ],
};

export function BrokenSystemSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Long sticky range so the tab-collapse + content morph feels like a
  // deliberate scroll-through animation rather than a quick blip.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Per-tab scroll windows — collapse from rightmost to leftmost.
  // Each tab's collapse window only occupies ~30 % of its slot, so a
  // single tab is in motion at any moment and the rest sit fully
  // open or fully closed. That snap-then-pause cadence is what makes
  // the sequence read as "tab-by-tab" rather than as a smooth
  // continuous fade across the whole strip.
  const collapseWindows = useMemo(() => {
    const span = TAB_FADE_END - TAB_FADE_START;
    const per = span / TABS.length;
    // Each tab's collapse window is longer than a single slot — so
    // multiple tabs are mid-fall at any moment (the next tab starts
    // collapsing well before the previous one finishes), and each
    // individual fall plays out over a longer scroll distance for a
    // smoother, slower disintegration.
    const WINDOW_MULTIPLIER = 3.5;
    return TABS.map((_, i) => {
      const idxFromRight = TABS.length - 1 - i;
      const slotStart = TAB_FADE_START + idxFromRight * per;
      const start = slotStart;
      const end = slotStart + per * WINDOW_MULTIPLIER;
      return { start, end };
    });
  }, []);

  // Each tab keeps its own fixed width and collapses straight to zero
  // when its scroll window plays out. Both width and opacity are
  // driven through React state — motion's ScrollTimeline-backed
  // transforms in this version interpolate across the full scroll
  // range and ignore their own keyframe offsets, which would cause
  // the tabs to fade in at the start of the section. State-driven
  // clamping keeps tabs at full strength until their collapse window
  // begins.
  const TAB_BASE_PX = 170;
  const EVPIN_BASE_PX = 220;
  const [tabState, setTabState] = useState<
    { width: number; opacity: number; t: number }[]
  >(() => TABS.map(() => ({ width: TAB_BASE_PX, opacity: 1, t: 0 })));

  // EVPin tab — width + opacity are driven through React state for
  // the same reason as the EVPin preview: motion's ScrollTimeline
  // bindings interpolate over the entire scroll range and would let
  // the tab fade back to 0 as the user keeps scrolling. Listening to
  // progress and pushing clamped values into state keeps the tab
  // open for the rest of the section.
  const [evpinTabWidth, setEvpinTabWidth] = useState(0);
  const [evpinTabOpacity, setEvpinTabOpacity] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v <= EVPIN_TAB_OPEN_START) {
      setEvpinTabWidth(0);
      setEvpinTabOpacity(0);
    } else if (v >= EVPIN_TAB_OPEN_END) {
      setEvpinTabWidth(EVPIN_BASE_PX);
      setEvpinTabOpacity(1);
    } else {
      const t =
        (v - EVPIN_TAB_OPEN_START) /
        (EVPIN_TAB_OPEN_END - EVPIN_TAB_OPEN_START);
      setEvpinTabWidth(t * EVPIN_BASE_PX);
      setEvpinTabOpacity(Math.min(1, Math.max(0, (t - 0.1) / 0.9)));
    }
  });

  // Cross-fade the address bar text + content area to the EVPin hero
  // once the EVPin tab has fully opened. Driven through React state
  // (rather than a motion-style binding) because motion's
  // ScrollTimeline-backed animations interpolate over the whole
  // scroll range and ignore their own keyframe offsets — which would
  // make the EVPin preview fade back out as the user keeps scrolling.
  // Listening to the underlying motion value and pushing the clamped
  // result into state makes the keyframes authoritative.
  const [evpinShareValue, setEvpinShareValue] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v <= CONTENT_MORPH_START) {
      setEvpinShareValue(0);
    } else if (v >= CONTENT_MORPH_END) {
      setEvpinShareValue(1);
    } else {
      setEvpinShareValue(
        (v - CONTENT_MORPH_START) / (CONTENT_MORPH_END - CONTENT_MORPH_START),
      );
    }
  });

  // Active tab — clicking switches between the original tabs. As
  // each tab's collapse window plays out it can no longer be the
  // active tab; if the user is currently on it, focus jumps back to
  // the Apple Maps (leftmost) tab so a real tab is always active.
  const [activeOriginalId, setActiveOriginalId] = useState<string>(TABS[0].id);

  // Closing-statement reveal — drive its opacity off the section's
  // scroll progress directly so it only fades in once the user has
  // truly reached the end of the section, not when the EVPin morph
  // first completes.
  const [closingOpacity, setClosingOpacity] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Update each tab's width / opacity / collapse-progress based
    // on its dedicated collapse window. Tabs collapse one at a time
    // from right to left; `t` runs 0 → 1 across the window and
    // drives the fall / rotate / blur animation in TabPill.
    const next = collapseWindows.map(({ start, end }) => {
      if (v <= start) return { width: TAB_BASE_PX, opacity: 1, t: 0 };
      if (v >= end) return { width: 0, opacity: 0, t: 1 };
      const t = (v - start) / (end - start);
      return {
        width: TAB_BASE_PX * (1 - t),
        opacity: Math.max(0, 1 - t / 0.85),
        t,
      };
    });
    setTabState(next);

    // If the active tab has fully collapsed, send the user back to
    // the Maps tab. The Maps tab is leftmost in DOM order and the
    // last to collapse, so it acts as the safe fallback.
    const activeIdx = TABS.findIndex((t) => t.id === activeOriginalId);
    if (
      activeIdx >= 0 &&
      next[activeIdx].width === 0 &&
      activeOriginalId !== TABS[0].id
    ) {
      setActiveOriginalId(TABS[0].id);
    }

    // Reveal the closing statement once the user has scrolled past
    // the sticky monitor wrapper and the text is in viewport.
    const CLOSING_REVEAL_START = 0.85;
    const CLOSING_REVEAL_END = 0.94;
    if (v <= CLOSING_REVEAL_START) {
      setClosingOpacity(0);
    } else if (v >= CLOSING_REVEAL_END) {
      setClosingOpacity(1);
    } else {
      setClosingOpacity(
        (v - CLOSING_REVEAL_START) /
          (CLOSING_REVEAL_END - CLOSING_REVEAL_START),
      );
    }
  });

  // Heading + subtitle stay fixed on screen for the full sticky
  // sequence — only the monitor / tab strip animates as the user
  // scrolls.

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{
        backgroundColor: "#ffffff",
        paddingTop: 192,
        paddingBottom: 0,
        // Section height is now content-driven (no explicit `height`).
        // The sticky monitor wrapper below sets the dominant scroll
        // budget; useScroll's progress maps cleanly across that.
      }}
    >
      {/* Heading + subtitle — scroll naturally at the top of the
          section. The user reads them, then continues scrolling and
          the monitor takes over (sticky) for the tab-collapse phase. */}
      <div className="flex w-full flex-col items-center gap-4 px-6 text-center">
        <h2
          className="w-[1200px] max-w-full text-[64px] font-semibold leading-[80px] tracking-[-1.28px]"
          style={{ color: "#000000" }}
        >
          The system of evaluating EV charging
          <br />
          sites is broken by design.
        </h2>
        <p
          className="w-[640px] max-w-full text-[16px] font-medium leading-6"
          style={{ color: "#a3a3a3" }}
        >
          You&rsquo;re switching between 20+ tabs. Having limited access to
          reliable data. Losing context. It takes days &mdash; and
          you&rsquo;re not even sure about the data you pulled.
        </p>
      </div>

      {/* Monitor sticky range — the wrapper here defines how long
          the monitor stays pinned. Sized so EVPin has a comfortable
          window to "sit" on screen after the morph completes,
          before the wrapper releases and the closing statement
          slides into view. */}
      <div className="mt-16 w-full" style={{ height: "420vh" }}>
        <div
          className="sticky flex w-full justify-center px-6"
          style={{ top: 128 }}
        >
          <BrowserMockup
            activeId={activeOriginalId}
            onSwitch={setActiveOriginalId}
            tabState={tabState}
            evpinTabWidth={evpinTabWidth}
            evpinTabOpacity={evpinTabOpacity}
            evpinShare={evpinShareValue}
          />
        </div>
      </div>

      {/* Closing statement — wrapped in its own scroll-budget area
          (height: 640) so the inner sticky child pins 128 px from
          the viewport top while the user reads it, mirroring how the
          monitor pins above. The user no longer "loses" the closing
          text the moment they stop scrolling. */}
      <div
        className="mt-32 w-full"
        style={{ height: 640 }}
      >
        <div
          className="sticky flex w-full items-center justify-center px-6"
          style={{ top: 128 }}
        >
          <ClosingStatement opacity={closingOpacity} />
        </div>
      </div>
    </section>
  );
}

function ClosingStatement({ opacity }: { opacity: number }) {
  return (
    <div
      aria-hidden={opacity === 0}
      className="relative z-20 flex w-[1200px] max-w-full flex-col items-center text-center"
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 24}px)`,
        transition: "opacity 240ms ease, transform 240ms ease",
      }}
    >
      <p
        className="w-full text-[48px] font-semibold leading-[56px] tracking-[-0.96px]"
        style={{ color: "#000000" }}
      >
        EVPin keeps all crucial information in one place,
        <br />
        with no context switching.
      </p>
    </div>
  );
}

function BrowserMockup({
  activeId,
  onSwitch,
  tabState,
  evpinTabWidth,
  evpinTabOpacity,
  evpinShare,
}: {
  activeId: string;
  onSwitch: (id: string) => void;
  tabState: { width: number; opacity: number }[];
  evpinTabWidth: number;
  evpinTabOpacity: number;
  evpinShare: number;
}) {
  const activeTab = TABS.find((t) => t.id === activeId) ?? TABS[0];

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        // Plain Chrome browser window — no Studio Display chrome,
        // no stand. 1200 px wide at the Figma reference width;
        // height set to fit viewport comfortably with rounded corners.
        width: "min(1200px, 92vw)",
        height: "min(720px, 70vh)",
        borderRadius: 14,
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.12)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 14 }}>
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          <MacMenuBar />
          {/* Chrome browser fills the remaining screen height. */}
          <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden border-t-[0.5px] border-black/10 bg-white">
          {/* Tab strip — fixed-width tabs that collapse to 0 from the
              right as the user scrolls. */}
          <div className="relative z-10 flex h-[36px] items-end gap-2 bg-[#dfe0e3] px-2">
            {/* Window controls — centered vertically inside the 36 px
                tab bar via `self-center`, which overrides the strip's
                `items-end` for just this child. */}
            <div className="mr-2 flex shrink-0 items-center gap-[6px] self-center">
              <span className="block size-[11px] rounded-full bg-[#fc625d]" />
              <span className="block size-[11px] rounded-full bg-[#fdbc40]" />
              <span className="block size-[11px] rounded-full bg-[#35cd4b]" />
            </div>
            {/* EVPin replacement tab — sits at the LEFT of the strip,
                opens from 0 → full width once every original tab has
                collapsed. State-driven so it stays open for the full
                remainder of the section instead of fading back to
                transparent. */}
            <div
              style={{
                width: evpinTabWidth,
                opacity: evpinTabOpacity,
                transition: "width 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease",
              }}
              className="relative h-[36px] shrink-0 overflow-hidden"
            >
              <div className="mt-[6px] flex h-[30px] w-full items-center gap-1.5 rounded-t-[10px] bg-white px-2">
                <EvpinFavicon size={14} />
                <span
                  className="min-w-0 flex-1 truncate text-[12px] font-medium leading-[18px] text-[#1f1f1f]"
                  style={{ fontFeatureSettings: "'cv08' 1" }}
                >
                  EVPin — Industry Standard for finding prime EV charging sites
                </span>
              </div>
            </div>
            {/* Original tabs */}
            {TABS.map((tab, i) => (
              <TabPill
                key={tab.id}
                tab={tab}
                isActive={activeId === tab.id}
                width={tabState[i].width}
                opacity={tabState[i].opacity}
                collapseT={tabState[i].t}
                fallAngle={TAB_FALL_ANGLES[i] ?? 0}
                onClick={() => onSwitch(tab.id)}
              />
            ))}
          </div>

          {/* Address / toolbar — buttons here are decorative; they
              don't react to hover or clicks. */}
          <div className="flex items-center gap-2 border-b border-[#efeded] bg-white px-3 py-1.5">
            <div className="pointer-events-none flex gap-1 text-[#5a5a5a]">
              {/* Back arrow points left (default), forward arrow flipped. */}
              <ChevronIcon />
              <ChevronIcon flip />
              <ReloadIcon />
              <HomeIcon />
            </div>
            <AddressBar activeTab={activeTab} evpinShare={evpinShare} />
            <div className="pointer-events-none flex items-center gap-1.5">
              {/* Browser-profile avatar — using a stock portrait so the
                  chrome reads as a real signed-in user. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=72&h=72&fit=crop&crop=faces&face=center"
                alt=""
                draggable={false}
                className="size-[20px] select-none rounded-full object-cover"
              />
            </div>
          </div>

          {/* Content area */}
          <div className="relative w-full flex-1 min-h-0 overflow-hidden bg-[#fbfbfb]">
            <ContentLayer
              evpinShare={evpinShare}
              activeTab={activeTab}
            />
            {/* Inert overlay — the preview should never receive pointer
                events even when the EVPin hero is fully visible. */}
            <div
              className="pointer-events-auto absolute inset-0 z-50"
              aria-hidden
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cross-fades between the original tab content and the EVPin preview
 * driven by a shared scroll-progress motion value. The original side
 * uses AnimatePresence so user-initiated tab switches feel snappy.
 */
function ContentLayer({
  evpinShare,
  activeTab,
}: {
  evpinShare: number;
  activeTab: Tab;
}) {
  return (
    <>
      <div
        style={{ opacity: 1 - evpinShare }}
        className="absolute inset-0"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <TabContent tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ opacity: evpinShare }} className="absolute inset-0">
        <EvpinHeroPreview />
      </div>
    </>
  );
}

function AddressBar({
  activeTab,
  evpinShare,
}: {
  activeTab: Tab;
  evpinShare: number;
}) {
  // Hard-switch the rendered URL at the morph midpoint so the bar
  // never reads two URLs at once. The container fades opacity briefly
  // around the swap to avoid a hard text pop.
  const showEvpin = evpinShare > 0.5;
  const swapOpacity =
    evpinShare < 0.4 || evpinShare > 0.6
      ? 1
      : 1 - Math.min(0.6, Math.abs(evpinShare - 0.5) * 6);
  return (
    <div className="flex h-7 flex-1 items-center rounded-full bg-[#efeded] px-3 text-[12px] text-[#1f1f1f]">
      <div
        style={{ opacity: swapOpacity }}
        className="relative flex-1 truncate"
      >
        {showEvpin ? (
          <span className="font-medium">evpin.com</span>
        ) : (
          <span>{activeTab.url}</span>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ flip }: { flip?: boolean }) {
  return (
    <span
      className="grid size-7 place-items-center"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M10 4L6 8l4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ReloadIcon() {
  // Material-style "refresh" arc: 3/4 circle with an arrowhead at the
  // top, matching the icon used in the Figma chrome mockup.
  return (
    <span className="grid size-7 place-items-center" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path
          d="M3.5 10a6.5 6.5 0 1 0 1.7-4.4M3.5 4v3.4h3.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function HomeIcon() {
  return (
    <span className="grid size-7 place-items-center" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 7l6-5 6 5v7H2V7z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
