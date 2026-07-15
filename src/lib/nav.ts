/**
 * Primary navigation (PRD §6): persistent bottom bar on mobile / left rail
 * on desktop. Plain data so the nav component and any future tests share
 * one source of truth for routes + labels.
 */
export interface NavItem {
  label: string;
  href: string;
  /** Single character glyph used as a lightweight stand-in for an icon set. */
  glyph: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Reading", href: "/", glyph: "命" },
  { label: "Master", href: "/master", glyph: "師" },
  { label: "Today", href: "/today", glyph: "曆" },
  { label: "Match", href: "/match", glyph: "合" },
  { label: "Me", href: "/me", glyph: "我" },
];

/**
 * Whether `href` should be treated as the active nav item for the current
 * pathname. Exact match for the root route, prefix match otherwise, so
 * `/master/xyz` still highlights "Master".
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
