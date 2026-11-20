// Leonida Legend — bootstrap: fetch the guide's data, wire the toolbar, the
// tabs and the detail panel, and keep every view in step with the earned set.
// The app fetches only its own files (data/trophies.json, data/roadmap.json)
// and makes no other request, so it works with the network off.
//
// Deep links, for sharing a view and for screenshots: ?demo=1 seeds a sample
// of early progress to try the tracker with, ?spoiler=1 starts spoiler-safe,
// #roadmap opens the roadmap tab, #trophy=<id> opens that trophy's guide.

import { loadEarned, saveEarned, downloadProgress, readProgressFile, demoEarned } from './state.js';
import { renderList, renderProgress } from './render.js';
import { showDetail } from './detail.js';
import { renderRoadmap } from './roadmap.js';

const params = new URLSearchParams(location.search);
const hash = new URLSearchParams(location.hash.slice(1));

const [trophiesDoc, roadmapDoc] = await Promise.all([
  fetch('data/trophies.json').then((r) => r.json()),
  fetch('data/roadmap.json').then((r) => r.json()),
]);
const trophies = trophiesDoc.trophies;
const trophiesById = new Map(trophies.map((t) => [t.id, t]));
const knownNames = new Set(trophies.map((t) => t.name));

let earned = loadEarned();
let demoMode = false;
if (params.get('demo') === '1' && earned.size === 0) {
  earned = demoEarned(trophies);
  demoMode = true;
}
let spoilerSafe = params.get('spoiler') === '1';

const listEl = document.getElementById('trophyList');
const hintEl = document.getElementById('listHint');
const detailEl = document.getElementById('detail');
const guideView = document.getElementById('guideView');
const roadmapView = document.getElementById('roadmapView');
const stageListEl = document.getElementById('stageList');
const roadmapNoteEl = document.getElementById('roadmapNote');
const spoilerToggle = document.getElementById('spoilerToggle');
spoilerToggle.checked = spoilerSafe;

const filters = { kind: 'all', grade: 'all', status: 'all', query: '' };

function renderAll() {
  renderProgress(trophies, earned);
  renderList(listEl, hintEl, trophies, earned, filters, spoilerSafe, onToggle, onOpen);
  renderRoadmap(roadmapNoteEl, stageListEl, roadmapDoc, trophiesById, earned, onOpen);
}

function onToggle(trophy, checked) {
  if (checked) earned.add(trophy.name);
  else earned.delete(trophy.name);
  demoMode = false;
  saveEarned(earned);
  renderAll();
  if (!detailEl.hidden) showDetail(detailEl, trophy, earned);
}

function onOpen(trophy) {
  showGuideTab();
  showDetail(detailEl, trophy, earned);
}

function showGuideTab() {
  guideView.hidden = false;
  roadmapView.hidden = true;
  document.getElementById('tabGuide').classList.add('active');
  document.getElementById('tabGuide').setAttribute('aria-selected', 'true');
  document.getElementById('tabRoadmap').classList.remove('active');
  document.getElementById('tabRoadmap').setAttribute('aria-selected', 'false');
}

function showRoadmapTab() {
  guideView.hidden = true;
  roadmapView.hidden = false;
  detailEl.hidden = true;
  document.getElementById('tabRoadmap').classList.add('active');
  document.getElementById('tabRoadmap').setAttribute('aria-selected', 'true');
  document.getElementById('tabGuide').classList.remove('active');
  document.getElementById('tabGuide').setAttribute('aria-selected', 'false');
}

document.getElementById('tabGuide').addEventListener('click', showGuideTab);
document.getElementById('tabRoadmap').addEventListener('click', showRoadmapTab);

document.getElementById('search').addEventListener('input', (event) => {
  filters.query = event.target.value.trim().toLowerCase();
  renderAll();
});
document.getElementById('kindFilter').addEventListener('change', (event) => {
  filters.kind = event.target.value;
  renderAll();
});
document.getElementById('gradeFilter').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  renderAll();
});
document.getElementById('statusFilter').addEventListener('change', (event) => {
  filters.status = event.target.value;
  renderAll();
});
spoilerToggle.addEventListener('change', (event) => {
  spoilerSafe = event.target.checked;
  renderAll();
});

document.getElementById('exportBtn').addEventListener('click', () => downloadProgress(earned));
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    earned = await readProgressFile(file, knownNames);
    demoMode = false;
    saveEarned(earned);
    renderAll();
  } catch {
    alert('That file is not a Leonida Legend progress export.');
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies? This cannot be undone.')) return;
  earned = new Set();
  demoMode = false;
  saveEarned(earned);
  detailEl.hidden = true;
  renderAll();
});

renderAll();

// Open the view the link asked for, after the first render.
if (hash.get('trophy')) {
  const trophy = trophiesById.get(Number(hash.get('trophy')));
  if (trophy) onOpen(trophy);
} else if (hash.get('roadmap') !== null || location.hash === '#roadmap') {
  showRoadmapTab();
}
if (demoMode) hintEl.textContent += ' · demo progress shown — tick any trophy to start your own.';
