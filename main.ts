// EMBERFALL — hand-in entrypoint.
//
// This file is the front door of the submission. Everything the judge needs
// already lives in this repository as plain files:
//
//   game/         the card game itself (static HTML + ES modules, offline)
//   screenshots/  the cover and in-game shots, first by name is the cover
//
// My job here is deliberately small: carry those two folders into the output
// directory untouched, then ask the vendored make.fun library to summarise
// what landed there into dossier.json, the one file the judge reads first.
// The game is never rebuilt, patched or re-encoded on the way out — the bytes
// that ship are the bytes that were tested.
//
// Where the hand-in lands: MAKEFUN_OUTPUT_DIR when it is set (handy for a
// local dry run), otherwise /output, which is where the grader looks.
//
//   mkdir -p /tmp/emberfall-out && MAKEFUN_OUTPUT_DIR=/tmp/emberfall-out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The limits below mirror the scorer's own gate, so the dossier I write
// describes the entry in exactly the terms the scorer will check it against.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Count every file under a folder, recursively. Only used for the closing
// summary line — the hand-in itself does not depend on the number.
function countFiles(folder: string): number {
  let total = 0;
  for (const name of readdirSync(folder)) {
    const path = join(folder, name);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

function handIn(): void {
  const repoDir = fileURLToPath(new URL('.', import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  // The output root itself is a mounted volume on the grader, so it is only
  // ever created if missing — never removed, never emptied from here.
  mkdirSync(outDir, { recursive: true });

  // The game goes across exactly as it sits in the repo.
  cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });

  // Screenshots likewise; the folder is created first so the output always
  // has one, even in the unlikely case the repo copy is absent.
  const shotsTarget = join(outDir, 'screenshots');
  mkdirSync(shotsTarget, { recursive: true });
  const shotsSource = join(repoDir, 'screenshots');
  if (existsSync(shotsSource)) {
    cpSync(shotsSource, shotsTarget, { recursive: true });
  }

  // With everything in place, the vendored library walks the output and
  // writes the summary the judge reads.
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, buildDossier(outDir, DOSSIER_LIMITS));

  // A short receipt for whoever reads the run log.
  const gameFiles = countFiles(join(outDir, 'game'));
  const shotFiles = countFiles(shotsTarget);
  const dossierBytes = statSync(dossierPath).size;
  console.log(`EMBERFALL handed in to ${outDir}`);
  console.log(`  game files: ${gameFiles}, screenshots: ${shotFiles}, dossier: ${dossierBytes} bytes`);
}

handIn();
