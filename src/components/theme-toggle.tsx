"use client";

import { useCallback, useSyncExternalStore } from "react";
import { applyTheme, setStoredTheme, toggleTheme, type Theme } from "@/lib/theme";

const THEME_CHANGE_EVENT = "cinnabar:theme-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

/** The theme-init script (see src/lib/theme.ts) already set data-theme
 * before hydration, so this is always in sync with what actually painted. */
function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

// SSR has no DOM/localStorage to read, and the pre-hydration script hasn't
// run yet on the server — match it to the same "dark" default the CSS
// itself uses in the absence of any signal (see globals.css's theme
// precedence comment), then let useSyncExternalStore swap in the real
// client value with no hydration-mismatch warning.
function getServerSnapshot(): Theme {
  return "dark";
}

/** Toggles `data-theme` on <html> and persists the choice to localStorage. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleClick = useCallback(() => {
    const next = toggleTheme(theme);
    applyTheme(next);
    setStoredTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, [theme]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      title="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-muted transition-colors duration-200 ease-out-expo hover:border-hairline-gold hover:text-gold"
    >
      {theme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}
