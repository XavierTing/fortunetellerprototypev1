/**
 * getInterpreter() — the single seam the rest of the app should import.
 * Selects the live DeepSeek interpreter when DEEPSEEK_API_KEY is set,
 * otherwise falls back to the deterministic mock so the app is fully
 * usable with zero configuration.
 *
 * IMPORTANT: DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL are read from
 * `process.env` only — this file must only ever run server-side (Server
 * Components, Server Actions, Route Handlers). Never import this module
 * from a "use client" component; the key must never reach the browser.
 */
import type { Interpreter } from "./types";
import { MockInterpreter } from "./mock";
import { DeepSeekInterpreter } from "./deepseek";

export function getInterpreter(): Interpreter {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (apiKey) {
    return new DeepSeekInterpreter({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || undefined,
    });
  }
  return new MockInterpreter();
}
