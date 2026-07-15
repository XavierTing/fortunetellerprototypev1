/**
 * Pure theme helpers shared by the theme-init script and <ThemeToggle>.
 * Kept side-effect-free where possible so the logic is unit-testable
 * without a DOM (see theme.test.ts); the few functions that touch
 * `window`/`document` are thin wrappers around these.
 *
 * COMMITTED LIGHT: washi light is the default on every OS. We deliberately do
 * NOT follow `prefers-color-scheme` — the reference aesthetic (11-ink /
 * teahouse) is committed light, so an OS-dark machine still opens in washi.
 * "Night ink" appears only when the user explicitly toggles it.
 */

export type Theme = "light" | "dark";

// Bumped from "cinnabar-theme" so any value stored while the app briefly
// followed the OS preference is ignored — everyone re-defaults to washi light.
export const THEME_STORAGE_KEY = "cinnabar-theme-2";

/** The committed default when the user has made no explicit choice. */
export const DEFAULT_THEME: Theme = "light";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function toggleTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts.
    return null;
  }
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore — worst case the choice doesn't persist this session.
  }
}

/**
 * The OS preference. Exposed for completeness, but intentionally NOT used to
 * pick the default (see the committed-light note above) — night ink is
 * explicit-only.
 */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Stored explicit choice, else the committed washi-light default. */
export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? DEFAULT_THEME;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Source for the inline `beforeInteractive` script in the root layout —
 * stringified so it can run before hydration and avoid a flash of the
 * wrong theme. Keep this framework-free (no imports survive into the
 * inlined script). Defaults to light when there is no explicit stored
 * choice — it does NOT consult prefers-color-scheme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t="light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
