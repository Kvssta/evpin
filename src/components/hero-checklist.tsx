"use client";

import { motion } from "motion/react";

const items = [
  "Access to 20,000+ EV stations worldwide",
  "Up-to-date data on EV usage and adoption across the world",
  "Recommended by members of Porsche, Tesla & more",
];

export function HeroChecklist() {
  return (
    <div className="flex flex-col gap-4">
      {items.map((text, i) => (
        <motion.div
          key={text}
          className="flex w-full items-center gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.6 + i * 0.1,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 16.6667 16.6667"
            fill="none"
            aria-hidden
            className="shrink-0"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.33333 0C3.73096 0 0 3.73096 0 8.33333C0 12.9357 3.73096 16.6667 8.33333 16.6667C12.9357 16.6667 16.6667 12.9357 16.6667 8.33333C16.6667 3.73096 12.9357 0 8.33333 0ZM11.4783 6.77772C11.7697 6.42152 11.7172 5.8965 11.361 5.60506C11.0048 5.31362 10.4798 5.36612 10.1884 5.72233L7.02147 9.59298L6.00592 8.57744C5.68049 8.252 5.15285 8.252 4.82741 8.57744C4.50197 8.90287 4.50197 9.43051 4.82741 9.75595L6.49408 11.4226C6.66056 11.5891 6.8897 11.6774 7.12485 11.6657C7.35999 11.6539 7.57921 11.5433 7.7283 11.3611L11.4783 6.77772Z"
              fill="white"
            />
          </svg>
          <p className="whitespace-nowrap text-[14px] font-medium leading-5 text-white">
            {text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
