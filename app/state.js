// Progress that lives in the browser: which trophies are earned, saved to
// localStorage, exportable to a file and importable back. Nothing leaves the
// browser; the file the export writes is the only copy that ever moves.

export const STORAGE_KEY = 'leonida-legend-progress-v1';

// Read the earned names back. A damaged or foreign value is treated as no
// progress rather than crashing the page.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((name) => typeof name === 'string'));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  } catch {
    // Private mode or a full store: the page still works, it just forgets.
  }
}

// Download the earned names as JSON, so progress can move to another browser.
export function downloadProgress(earned) {
  const blob = new Blob([JSON.stringify([...earned].sort(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Read an exported file back into an earned set. Unknown names are dropped:
// a file from another guide, or a hand-edited one, never invents trophies.
export async function readProgressFile(file, knownNames) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('progress file holds no list');
  return new Set(parsed.filter((name) => typeof name === 'string' && knownNames.has(name)));
}

// A sample of early progress for trying the tracker: the opening mission,
// the first chapter and a few activities. Used only with ?demo=1, and only
// in memory until the reader changes anything, which then saves for real.
export function demoEarned(trophies) {
  const demoIds = new Set([2, 3, 8, 15, 16, 20, 21, 35, 44, 46]);
  return new Set(trophies.filter((t) => demoIds.has(t.id)).map((t) => t.name));
}
