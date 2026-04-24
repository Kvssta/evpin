import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Agentation } from "agentation";
import { SoundRoot } from "@/components/sound-root";
import "./globals.css";

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
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SoundRoot>{children}</SoundRoot>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
