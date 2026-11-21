// Low Tide — hand-in script for the best-stealth bounty (Node 22, stdlib only).
//
// What this does, in plain terms: it takes the finished game sitting next to
// this file (game/ plus the screenshots/ folder) and hands both over to the
// folder the grader points at, then asks the vendored make.fun helper to
// summarise that folder into dossier.json for the judge to read.
//
// Run it outside the grader like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader the output folder is /output unless the env var says so.

import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where this script lives on disk — game/ and screenshots/ sit beside it.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader tells us where to hand the entry in; fall back to /output.
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure a folder exists, creating parents as needed.
function ensureDir(folder: string): void {
  nodeFs.mkdirSync(folder, { recursive: true });
}

// Copy a whole folder tree, source first, target second.
function mirrorDir(source: string, target: string): void {
  nodeFs.cpSync(source, target, { recursive: true });
}

// The caps the scorer itself enforces — text budget plus the hard limits on
// screenshots and on how much game/ may hold. Passing them here means this
// script fails in exactly the places the scorer would refuse the entry.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn(): void {
  ensureDir(destination);
  mirrorDir(nodePath.join(repoRoot, 'game'), nodePath.join(destination, 'game'));
  ensureDir(nodePath.join(destination, 'screenshots'));
  const shots = nodePath.join(repoRoot, 'screenshots');
  if (nodeFs.existsSync(shots)) {
    mirrorDir(shots, nodePath.join(destination, 'screenshots'));
  }
  const dossier = buildDossier(destination, dossierCaps);
  nodeFs.writeFileSync(nodePath.join(destination, 'dossier.json'), dossier);
  console.log(`Low Tide handed in: game + screenshots copied to ${destination}, dossier.json written (${dossier.length} bytes) — ready for the judge.`);
}

handIn();
