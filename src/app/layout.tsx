import type { Metadata } from "next";
import { Cormorant_Garamond, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Self-hosted via next/font — no external requests at runtime, no CSP
// exceptions needed. Each loader exposes a CSS variable that globals.css
// wires into --font-display / --font-body / --font-mono.

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

/** Mono: eyebrow labels and numeric/chart data, used sparingly. */
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
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
      className={`h-full ${cormorantGaramond.variable} ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body className="flex min-h-full flex-col bg-lacquer font-body text-text antialiased">
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-lacquer-deep"
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
