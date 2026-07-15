import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Hanken_Grotesk,
  JetBrains_Mono,
  Ma_Shan_Zheng,
  Noto_Serif_SC,
} from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Self-hosted via next/font — no external requests at runtime, no CSP
// exceptions needed. Each loader exposes a CSS variable that globals.css
// wires into --font-display / --font-body / --font-mono / --font-cjk /
// --font-brush.

/** Display/wordmark: hero h1, section h2s, brand lockup. Display sizes only. */
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal"],
  variable: "--font-cormorant",
  display: "swap",
});

/** Body/UI: everything else — copy, nav, controls, form labels. */
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

/** Mono: eyebrow labels and numeric/chart data, used sparingly — 朱墨 drops
 * mono to near-zero on-screen at once (see DESIGN.md's Eyebrow Restraint
 * Rule), but the face itself stays loaded for that one small use. */
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Chinese glyph anchors: 八字, 命, 五行, 干支 pillars, 木火土金水 — set large
 * and quiet beside their English gloss, real semantic anchors rather than
 * decoration. Two weights only (a full CJK charset is heavy per weight;
 * see the design spec's "drop mono/variety to near-zero" instruction —
 * the same restraint applies to how many CJK weights ship).
 */
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-notoserifsc",
  display: "swap",
});

/**
 * Brush script: ONE dramatic hand-brushed character per key screen (命 on
 * the hero; a day-master stem on a reading, in a later task). Use very
 * sparingly — this is not a body or heading face.
 */
const maShanZheng = Ma_Shan_Zheng({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mashanzheng",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cinnabar — Chinese astrology, in plain English",
  description:
    "Authentic 八字 (BaZi) Chinese astrology, computed correctly and explained in plain, native English. Calculated, not guessed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${cormorantGaramond.variable} ${hankenGrotesk.variable} ${jetBrainsMono.variable} ${notoSerifSC.variable} ${maShanZheng.variable}`}
    >
      <body className="flex min-h-full flex-col bg-paper font-body text-ink-soft antialiased">
        {/* Runs before hydration so the correct theme paints on first frame. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        {/* Skip-to-content: the very first focusable element, invisible
            until it receives keyboard focus (Tailwind's sr-only /
            focus:not-sr-only pair) — lets a keyboard/screen-reader user
            bypass the header + nav rail on every page. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-cinnabar focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper"
        >
          Skip to content
        </a>
        <SiteHeader />
        <Nav />
        <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-0 md:pl-20 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
