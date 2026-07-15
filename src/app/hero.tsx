"use client";

/**
 * Hero — the landing page's decorative ink composition (R1 "signature
 * moment" #1: the ink-wash hero canvas).
 *
 * A `<canvas>`-driven sumi ink "pool" blooms near the cursor and forgets
 * slowly (an alpha-decaying, capped particle pool) — a restrained homage to
 * the 11-ink reference's interactive ink pool. Behind/beside it, the large,
 * quiet 命 ("fate"/"destiny") brush character sits still, and the cinnabar
 * `Seal` stamps in on load (reusing the existing `animate-seal-stamp`
 * keyframe — see globals.css's file header). `prefers-reduced-motion`
 * swaps the interactive canvas for a fully static ink composition (no
 * canvas, no listeners, nothing to disable after the fact): the same 命
 * character, the same settled seal, and one still ink wash in place of the
 * cursor-driven bloom.
 *
 * Purely decorative — every element is `aria-hidden`; the page's real
 * heading/copy (in `page.tsx`) carries all of the hero's actual meaning.
 * `page.tsx` only imports `{ Hero }` from this file, so this internals-only
 * swap (R0's static placeholder → R1's interactive canvas) needed no
 * changes there.
 */
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Seal } from "@/components/ui";

const MAX_PARTICLES = 42;
const SPAWN_INTERVAL_MS = 42; // throttles spawn rate so a fast cursor doesn't flood the pool
const GROW_TAU_MS = 260; // ink "bloom" spread — asymptotic ease toward each particle's max radius
const DECAY_PER_SECOND = 0.34; // "forgets slowly" — ~2.5-3s to fade past visibility
const MIN_ALPHA = 0.01;
const MAX_FRAME_DT_MS = 48; // clamp — a hidden tab (or a slow frame) resuming shouldn't jump/jank

interface InkParticle {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  gradient: CanvasGradient;
}

/**
 * InkTrail — the interactive sumi ink pool. Self-contained: attaches its
 * own listeners and rAF loop on mount, tears them all down on unmount.
 * DPR-aware (crisp on retina), pauses the animation loop entirely whenever
 * there are no live particles (idle costs nothing) and whenever the tab is
 * hidden (`visibilitychange`), and caps the live particle count so a
 * frantic cursor can't make the frame budget grow unbounded.
 */
function InkTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const particles: InkParticle[] = [];
    let lastSpawnAt = 0;
    let lastFrameAt = 0;
    let rafId = 0;
    let running = false;
    let hidden = document.hidden;

    // --ink in sRGB (see .build-reports/R1-report.md for the OKLCH → hex/rgb
    // conversion this mirrors) — canvas fill/stroke styles can't read CSS
    // custom properties, so the ink tone is restated here as a plain rgb
    // triplet, same discipline `api/share/render.tsx` uses for Satori.
    const INK_RGB = "31, 25, 21";

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(x: number, y: number) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const maxR = 24 + Math.random() * 30;
      const baseAlpha = 0.07 + Math.random() * 0.06;
      const gradient = ctx!.createRadialGradient(x, y, 0, x, y, maxR);
      gradient.addColorStop(0, `rgba(${INK_RGB}, 0.9)`);
      gradient.addColorStop(0.55, `rgba(${INK_RGB}, 0.32)`);
      gradient.addColorStop(1, `rgba(${INK_RGB}, 0)`);
      particles.push({ x, y, r: maxR * 0.3, maxR, alpha: baseAlpha, gradient });
    }

    function wake() {
      if (running || hidden) return;
      running = true;
      lastFrameAt = performance.now();
      rafId = requestAnimationFrame(tick);
    }

    function tick(now: number) {
      const dt = Math.min(MAX_FRAME_DT_MS, now - lastFrameAt);
      lastFrameAt = now;

      ctx!.clearRect(0, 0, width, height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.r += (p.maxR - p.r) * Math.min(1, dt / GROW_TAU_MS);
        p.alpha *= Math.pow(DECAY_PER_SECOND, dt / 1000);
        if (p.alpha < MIN_ALPHA) {
          particles.splice(i, 1);
          continue;
        }
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.gradient;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      if (particles.length > 0 && !hidden) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) return;
      const now = performance.now();
      if (now - lastSpawnAt < SPAWN_INTERVAL_MS) return;
      lastSpawnAt = now;
      spawn(x, y);
      wake();
    }

    function onVisibilityChange() {
      hidden = document.hidden;
      if (!hidden) wake();
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    // Listened on `window` (not the canvas) because the canvas stays
    // `pointer-events-none` — it must never intercept clicks meant for the
    // real hero copy/CTA sitting above it.
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/**
 * StaticInkWash — the `prefers-reduced-motion` (and pre-hydration) stand-in
 * for `InkTrail`: one still ink bloom, pure CSS, no canvas/JS/listeners at
 * all, so the composition still reads as "ink on paper" rather than going
 * bare when motion is disabled.
 */
function StaticInkWash() {
  return (
    <div
      className="absolute -right-[8%] bottom-[8%] h-[46vw] max-h-[32rem] w-[46vw] max-w-[32rem] rounded-full opacity-[0.05]"
      style={{
        background: "radial-gradient(circle, var(--ink) 0%, var(--ink) 30%, transparent 72%)",
      }}
    />
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** The server (and first client render, before hydration confirms the real
 * preference) can't know the visitor's OS-level motion setting — default to
 * `true` so both sides agree on the cheap, static composition first. This
 * is the textbook `useSyncExternalStore` pattern for reading an external
 * browser API from an effect without the "setState synchronously in an
 * effect" cascading-render smell a plain useState+useEffect version has. */
function getReducedMotionServerSnapshot(): boolean {
  return true;
}

export function Hero() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {reducedMotion ? <StaticInkWash /> : <InkTrail />}
      <span
        className="absolute top-1/2 right-[6%] -translate-y-1/2 translate-x-[8%] font-brush leading-none text-ink/[0.05] select-none"
        style={{ fontSize: "clamp(14rem, 34vw, 26rem)" }}
      >
        命
      </span>
      <Seal
        size="xl"
        className="animate-seal-stamp absolute right-[12%] bottom-[18%] font-brush text-3xl"
        style={{ animationDelay: "180ms" }}
      >
        朱
      </Seal>
    </div>
  );
}
