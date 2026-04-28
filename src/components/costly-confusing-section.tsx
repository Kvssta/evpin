"use client";

/**
 * "Assessing EV charger locations is a costly, confusing process." —
 * the second problem section. Three side-by-side cards: Time
 * consuming (wrist-watch photo), Unverified data (light card with a
 * blanked-out station popup overlay), and Expensive (credit-card
 * photo). The first and third cards use a dark gradient over their
 * background image so the white card title + description stay
 * readable.
 */

type ImageCard = {
  variant: "image";
  title: string;
  description: string;
  bg: string;
};

type PopupCard = {
  variant: "popup";
  title: string;
  description: string;
};

type Card = ImageCard | PopupCard;

const CARDS: Card[] = [
  {
    variant: "image",
    title: "Time consuming",
    description: "Manual collection turns simple decisions into multi-week projects.",
    bg: "/figma/costly-watch.png",
  },
  {
    variant: "popup",
    title: "Unverified data",
    description: "Most location data is scraped from sources you can't fully verify or trust.",
  },
  {
    variant: "image",
    title: "Expensive",
    description: "Paid databases and analyst hours quickly run into thousands per site.",
    bg: "/figma/costly-card.png",
  },
];

export function CostlyConfusingSection() {
  return (
    <section
      className="relative w-full bg-white"
      style={{ paddingTop: 0, paddingBottom: 132 }}
    >
      <div className="mx-auto flex w-[1280px] max-w-full flex-col gap-16 px-6">
        {/* Header sized to match the FragmentedSection above (same 36
            px / 48 px line-height) so the two problem sections read
            as a single beat. */}
        <h2
          className="mx-auto w-[808px] max-w-full text-center text-[36px] font-semibold leading-[48px] tracking-[-0.72px]"
          style={{ color: "#1d1d16" }}
        >
          Additionally, assessing EV charger locations is a costly, confusing process.
        </h2>

        <div className="flex h-[561px] w-full items-stretch gap-6">
          {CARDS.map((card) =>
            card.variant === "image" ? (
              <ImageProblemCard key={card.title} card={card} />
            ) : (
              <PopupProblemCard key={card.title} card={card} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function ImageProblemCard({ card }: { card: ImageCard }) {
  return (
    <div className="relative flex flex-1 basis-0 flex-col items-center overflow-hidden rounded-2xl p-12 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.bg}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
      {/* Top-to-bottom dark wash so the title (top) and description
          (bottom) read against any image. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.1))",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-between">
        <p className="whitespace-nowrap text-[24px] font-semibold leading-8">
          {card.title}
        </p>
        <p className="text-[14px] font-normal leading-5">{card.description}</p>
      </div>
    </div>
  );
}

function PopupProblemCard({ card }: { card: PopupCard }) {
  return (
    <div
      className="relative flex flex-1 basis-0 flex-col items-center p-12 text-center"
      style={{ backgroundColor: "#f0f0f0", borderRadius: 16 }}
    >
      <div className="flex w-full flex-1 flex-col items-center justify-between">
        <p
          className="whitespace-nowrap text-[24px] font-semibold leading-8"
          style={{ color: "#202020" }}
        >
          {card.title}
        </p>
        <p
          className="text-[14px] font-normal leading-5"
          style={{ color: "#202020" }}
        >
          {card.description}
        </p>
      </div>

      {/* Centered "blanked out" station popup — same visual language as
          the design-mode popup elsewhere on the page, but with every
          metric returning N/A / ??? to underline that the data
          underneath is unverifiable. */}
      <BlankPopup />
    </div>
  );
}

function BlankPopup() {
  return (
    <div
      className="pointer-events-none absolute z-10 flex w-[326px] max-w-[calc(100%-32px)] flex-col gap-4 rounded-[20px] p-4 text-white"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(43, 43, 34, 0.68)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow:
          "0 9px 21px rgba(0,0,0,0.10), 0 37px 37px rgba(0,0,0,0.09), 0 84px 51px rgba(0,0,0,0.05)",
      }}
      aria-hidden
    >
      <div className="flex h-5 items-center">
        <div className="rounded-full bg-white px-2 py-[2px]">
          <p className="text-[14px] font-medium leading-5 text-neutral-950">
            4.4/5
          </p>
        </div>
      </div>

      <div className="flex flex-col leading-5 text-left">
        <p className="text-[14px] font-medium text-white">
          Neighborhood&nbsp;&nbsp;in San Francisco
        </p>
        <p className="text-[14px] font-medium text-white/50">
          Cupertino, CA 95014
        </p>
      </div>

      <BlankMetric label="EV adoption" />
      <BlankMetric label="Nearby stations" />
      <BlankMetric label="Avg. daily traffic" />
    </div>
  );
}

function BlankMetric({ label }: { label: string }) {
  return (
    <div className="flex flex-col text-left">
      <div className="flex h-5 items-center justify-between">
        <p className="text-[14px] font-medium leading-5 text-white">{label}</p>
        <div className="flex h-5 items-center gap-2">
          <div className="flex h-5 items-center gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-[11px] rounded-[2px]"
                style={{ backgroundColor: "rgba(255,255,255,0.24)" }}
              />
            ))}
          </div>
          <p className="text-[12px] font-bold leading-4 tracking-wide text-white">
            N/A
          </p>
        </div>
      </div>
      <p className="text-[14px] font-medium leading-5 text-white/50">???</p>
    </div>
  );
}
