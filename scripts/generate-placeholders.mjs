#!/usr/bin/env node
/**
 * Procedural placeholder generator for Cinnabar illustrations.
 *
 * Reads art/manifest.json and writes a soft procedural "ink blob" PNG at
 * every manifest outputPath, so the app is never broken (missing <img>,
 * broken next/image) before real art exists. These are CLEARLY interim —
 * a single radial-falloff ink wash, no detail, no linework — and are meant
 * to be overwritten with real art at the same filenames.
 *
 * Deterministic: each id hashes to a small set of visual parameters
 * (blob center offset, radius, and whether it's cinnabar- or sumi-ink
 * tinted) so re-running produces the same placeholder for the same id.
 *
 * Usage:
 *   node scripts/generate-placeholders.mjs
 *   node scripts/generate-placeholders.mjs --force   (overwrite existing files, incl. real art!)
 */

import { readFile, mkdir, access } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "art/manifest.json");

// Placeholder canvas size. Real art is generated much larger (per the
// manifest's `size`); next/image scales placeholders fine at this size.
const CANVAS = 512;

// Warm sumi-ink base (near-black, warm undertone — matches DESIGN.md `ink`).
const SUMI = { r: 0x38, g: 0x30, b: 0x2b };
// Cinnabar accent (#B0392A per the shared style preamble).
const CINNABAR = { r: 0xb0, g: 0x39, b: 0x2a };

/** Tiny deterministic string hash -> unsigned 32-bit int. */
function hashString(str) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Derive a small PRNG (mulberry32) seeded from the hash, for repeatable jitter. */
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paramsForId(id, index) {
  const seed = hashString(id);
  const rand = mulberry32(seed);

  // Roughly 2 of the ~23 assets get a cinnabar tint (the seal-like ones);
  // the rest are warm sumi ink. Pick deterministically off the hash so the
  // same ids are always cinnabar (rather than shifting on manifest edits
  // that reorder — though index is used as a stable tie-breaker too).
  const cinnabarBucket = seed % 23 === 0 || index === 0 || index === 22;
  const tint = cinnabarBucket ? CINNABAR : SUMI;

  // Blob center: mostly centered, with a little per-id jitter so the set
  // doesn't look like 23 identical dots.
  const cx = 0.5 + (rand() - 0.5) * 0.12;
  const cy = 0.5 + (rand() - 0.5) * 0.12;

  // Radius as a fraction of canvas half-width, with mild variation.
  const radius = 0.34 + rand() * 0.1;

  // Slight color jitter so tone isn't perfectly flat across all assets.
  const jitter = () => (rand() - 0.5) * 14;

  return {
    cx,
    cy,
    radius,
    color: {
      r: clampByte(tint.r + jitter()),
      g: clampByte(tint.g + jitter()),
      b: clampByte(tint.b + jitter()),
    },
  };
}

function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Soft radial falloff: 1 at center, 0 at/after `radius`, smoothstep in between. */
function radialAlpha(dx, dy, radius) {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= radius) return 0;
  const t = 1 - dist / radius;
  // smoothstep for a soft brushed edge rather than a hard disc
  return t * t * (3 - 2 * t);
}

function renderPlaceholder(id, index) {
  const { cx, cy, radius, color } = paramsForId(id, index);
  const png = new PNG({ width: CANVAS, height: CANVAS });
  const centerX = cx * CANVAS;
  const centerY = cy * CANVAS;
  const radiusPx = radius * CANVAS;

  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const idx = (CANVAS * y + x) << 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const alpha = radialAlpha(dx, dy, radiusPx);
      // A faint secondary outer wash so the blob reads as "ink soaking into
      // paper" rather than a hard vector circle — extend a soft haze to ~1.6x.
      const haze = radialAlpha(dx, dy, radiusPx * 1.6) * 0.25;
      const a = Math.max(alpha, haze);

      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = clampByte(a * 255);
    }
  }

  return PNG.sync.write(png);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const raw = await readFile(MANIFEST_PATH, "utf-8");
  const manifest = JSON.parse(raw);
  if (!Array.isArray(manifest.assets)) {
    throw new Error("art/manifest.json: expected top-level `assets` array");
  }

  console.log("Cinnabar placeholder generator");
  console.log(`  manifest: ${MANIFEST_PATH}`);
  console.log(`  canvas:   ${CANVAS}x${CANVAS} (real art will be larger per manifest \`size\`)`);
  console.log(`  force:    ${force}`);
  console.log("");

  let written = 0;
  let skipped = 0;

  for (let i = 0; i < manifest.assets.length; i++) {
    const asset = manifest.assets[i];
    const outputPath = resolve(ROOT, asset.outputPath);

    if (!force && (await fileExists(outputPath))) {
      console.log(`  – ${asset.id}: already exists, skipping (${asset.outputPath})`);
      skipped++;
      continue;
    }

    await mkdir(dirname(outputPath), { recursive: true });
    const buffer = renderPlaceholder(asset.id, i);
    writeFileSync(outputPath, buffer);
    console.log(`  ✓ ${asset.id} -> ${asset.outputPath} (${buffer.length} bytes)`);
    written++;
  }

  console.log("");
  console.log(`Done. written=${written} skipped=${skipped} total=${manifest.assets.length}`);
  console.log("These are procedural ink-blob placeholders — replace with real art at the same paths.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
