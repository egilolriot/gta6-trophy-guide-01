// Leonida Legend — the hand-in program for the GTA VI trophy guide (Node 22,
// standard library only). It checks the guide's data, copies app/ and
// screenshots/ beside this file to /output, and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be
// byte for byte what its own copy writes.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

const GRADES = new Set(['platinum', 'gold', 'silver', 'bronze']);
const KINDS = new Set(['story', 'missable', 'collectibles', 'activities', 'exploration', 'combat', 'money']);

// Read the trophy list the way the app reads it, and refuse to hand in a
// guide that names fewer than the official 55, leaves a guide blank, or
// carries a grade or kind the app does not know how to show. A bad data file
// fails here, loudly, instead of reaching the scorer as a silent zero.
function loadTrophies() {
  const raw = readFileSync(join(appDir, 'data', 'trophies.json'), 'utf-8');
  const doc = JSON.parse(raw);
  const list = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(list)) throw new Error('trophies.json holds no trophies array');
  if (list.length !== 55) throw new Error(`trophies.json holds ${list.length} trophies, not the official 55`);
  const names = new Set();
  for (const t of list) {
    if (typeof t.name !== 'string' || !t.name.trim()) throw new Error('a trophy has no name');
    if (names.has(t.name)) throw new Error(`trophy name appears twice: ${t.name}`);
    names.add(t.name);
    if (typeof t.guide !== 'string' || !t.guide.trim()) throw new Error(`trophy ${t.name} has no guide`);
    if (!GRADES.has(t.grade)) throw new Error(`trophy ${t.name} has unknown grade ${t.grade}`);
    if (t.kind !== undefined && !KINDS.has(t.kind)) throw new Error(`trophy ${t.name} has unknown kind ${t.kind}`);
    if (!Array.isArray(t.sources) || t.sources.length === 0) throw new Error(`trophy ${t.name} cites no source`);
  }
  return list;
}

const trophies = loadTrophies();
const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
for (const t of trophies) grades[t.grade as keyof typeof grades] += 1;
const missable = trophies.filter((t) => t.missable).length;

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log(
  `Leonida Legend: ${trophies.length} trophies (${grades.platinum} platinum, ${grades.gold} gold, ${grades.silver} silver, ${grades.bronze} bronze; ${missable} flagged missable) -> ${out}/dossier.json`,
);
