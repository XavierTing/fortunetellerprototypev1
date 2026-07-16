#!/usr/bin/env node
/**
 * Cinnabar illustration generator.
 *
 * Reads art/manifest.json and, for each asset, POSTs a request to
 * OpenAI's `images/generations` endpoint, then decodes the returned
 * base64 PNG and writes it to the asset's outputPath.
 *
 * This script makes NO network calls in --dry-run mode. It requires
 * OPENAI_API_KEY to be set in the environment for any real run.
 *
 * Usage:
 *   node scripts/generate-illustrations.mjs --dry-run
 *   node scripts/generate-illustrations.mjs
 *   node scripts/generate-illustrations.mjs --only zodiac-tiger
 *   node scripts/generate-illustrations.mjs --only zodiac-tiger --force
 *   node scripts/generate-illustrations.mjs --force
 *
 * Env:
 *   OPENAI_API_KEY       required (unless --dry-run)
 *   OPENAI_IMAGE_MODEL   optional, defaults to "gpt-image-1"
 */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "art/manifest.json");
const API_URL = "https://api.openai.com/v1/images/generations";

function parseArgs(argv) {
  const args = { dryRun: false, only: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--only") {
      args.only = argv[i + 1];
      i++;
    } else if (arg.startsWith("--only=")) {
      args.only = arg.slice("--only=".length);
    } else {
      console.warn(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadManifest() {
  const raw = await readFile(MANIFEST_PATH, "utf-8");
  const manifest = JSON.parse(raw);
  if (!Array.isArray(manifest.assets)) {
    throw new Error("art/manifest.json: expected top-level `assets` array");
  }
  return manifest;
}

async function generateOne(asset, { model, apiKey }) {
  const outputPath = resolve(ROOT, asset.outputPath);
  const body = {
    model,
    prompt: asset.prompt,
    size: asset.size,
    background: asset.background === "transparent" ? "transparent" : "opaque",
    n: 1,
  };

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`  ✗ ${asset.id}: network error — ${err.message}`);
    return false;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "<no body>");
    console.error(`  ✗ ${asset.id}: HTTP ${response.status}`);
    console.error(`    ${text}`);
    return false;
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    console.error(`  ✗ ${asset.id}: failed to parse JSON response — ${err.message}`);
    return false;
  }

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`  ✗ ${asset.id}: response had no data[0].b64_json`);
    console.error(`    ${JSON.stringify(json).slice(0, 500)}`);
    return false;
  }

  const buffer = Buffer.from(b64, "base64");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  console.log(`  ✓ ${asset.id} -> ${asset.outputPath} (${buffer.length} bytes)`);
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const apiKey = process.env.OPENAI_API_KEY;

  let assets = manifest.assets;
  if (args.only) {
    assets = assets.filter((a) => a.id === args.only);
    if (assets.length === 0) {
      console.error(`No asset found with id "${args.only}"`);
      console.error(`Available ids: ${manifest.assets.map((a) => a.id).join(", ")}`);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`Cinnabar illustration generator`);
  console.log(`  manifest:  ${MANIFEST_PATH}`);
  console.log(`  model:     ${model}`);
  console.log(`  assets:    ${assets.length}${args.only ? ` (filtered by --only ${args.only})` : ""}`);
  console.log(`  mode:      ${args.dryRun ? "DRY RUN (no network calls)" : "LIVE"}`);
  console.log(`  force:     ${args.force}`);
  console.log("");

  if (args.dryRun) {
    for (const asset of assets) {
      console.log(`  • ${asset.id}`);
      console.log(`      outputPath: ${asset.outputPath}`);
      console.log(`      size:       ${asset.size}`);
      console.log(`      background: ${asset.background}`);
      console.log(`      model:      ${model}`);
    }
    console.log("");
    console.log(`Dry run complete. ${assets.length} asset(s) would be requested. No files written.`);
    return;
  }

  if (!apiKey) {
    console.error(
      "OPENAI_API_KEY is not set. Export it before running, or use --dry-run to preview without calling the API."
    );
    process.exitCode = 1;
    return;
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const asset of assets) {
    const outputPath = resolve(ROOT, asset.outputPath);
    if (!args.force && (await fileExists(outputPath))) {
      console.log(`  – ${asset.id}: already exists, skipping (${asset.outputPath}). Use --force to overwrite.`);
      skipped++;
      continue;
    }

    console.log(`  … ${asset.id}: requesting (${asset.size}, ${asset.background})...`);
    const ok = await generateOne(asset, { model, apiKey });
    if (ok) generated++;
    else failed++;
  }

  console.log("");
  console.log(`Done. generated=${generated} skipped=${skipped} failed=${failed} total=${assets.length}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
