import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Agentation } from "agentation";
import { SoundRoot } from "@/components/sound-root";
import "./globals.css";

// Apple's SF Pro variable font. The single .ttf contains every weight +
// optical size, so we load it once and let CSS `font-weight` select from
// its variation axes. `display: swap` avoids a FOIT on slow connections.
const sfPro = localFont({
  src: "./fonts/SF-Pro.ttf",
  variable: "--font-sf-pro",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EVPin",
  description: "The industry standard for finding prime EV charging sites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sfPro.variable} ${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SoundRoot>{children}</SoundRoot>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
