import type { Metadata } from "next";
import Script from "next/script";
import { Nav } from "@/components/nav";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="flex min-h-full flex-col font-sans antialiased">
        {/* Runs before hydration so the correct theme paints on first frame. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <SiteHeader />
        <Nav />
        <main className="flex-1 pb-20 md:pb-0 md:pl-20">{children}</main>
      </body>
    </html>
  );
}
