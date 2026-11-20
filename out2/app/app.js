// Leonida Legend — offline GTA VI trophy tracker. Vanilla JS, no libraries, no
// network at run time: it reads data/trophies.json and data/roadmap.json from its
// own folder and keeps progress in localStorage. Nothing leaves the browser
// except when the reader exports progress to a file themselves.
const EARNED_KEY = 'leonida-legend-earned-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';
const HIDE_EARNED_KEY = 'leonida-legend-hide-earned-v1';

const $ = (id) => document.getElementById(id);
const cardsEl = $('cards');
const emptyEl = $('empty');

const state = {
  trophies: [],
  sources: {},
  roadmap: null,
  earned: new Set(),
  kind: 'all',
  grade: 'all',
  query: '',
  spoiler: false,
  hideEarned: false,
};

function loadStored() {
  try { state.earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]')); } catch { state.earned = new Set(); }
  state.earned = new Set([...state.earned].filter((id) => state.trophies.some((t) => t.id === id)));
  state.spoiler = localStorage.getItem(SPOILER_KEY) === '1';
  state.hideEarned = localStorage.getItem(HIDE_EARNED_KEY) === '1';
  $('spoiler').checked = state.spoiler;
  $('hide-earned').checked = state.hideEarned;
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function isStory(t) { return t.kinds.includes('story'); }
function isHiddenFromReader(t) { return state.spoiler && isStory(t) && !state.earned.has(t.id); }

function gradeLabel(t) { return t.grade; }

function countChip(t) {
  if (t.count == null) return '';
  const unit = t.count >= 1000 ? `$${t.count.toLocaleString('en-US')}` : String(t.count);
  return `<span class="badge count">${unit} to earn</span>`;
}

function excerpt(text, n = 170) {
  return text.length > n ? `${text.slice(0, n).trimEnd()}…` : text;
}

function trophyCard(t) {
  const li = document.createElement('li');
  li.className = 'card';
  if (state.earned.has(t.id)) li.classList.add('earned');
  if (t.missable) li.classList.add('missable');
  const hidden = isHiddenFromReader(t);
  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${hidden ? 'story trophy' : t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(t.id);
    else state.earned.delete(t.id);
    saveEarned();
    render();
  });
  head.append(box);
  const name = document.createElement('span');
  name.className = 'card-name' + (hidden ? ' spoiler-name' : '');
  name.textContent = hidden ? 'Hidden story trophy — earn it to reveal' : t.name;
  head.append(name);
  li.append(head);

  const badges = document.createElement('div');
  badges.className = 'badges';
  const grade = document.createElement('span');
  grade.className = `badge ${t.grade}`;
  grade.textContent = gradeLabel(t);
  badges.append(grade);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'badge missable';
    m.textContent = '⚠ potentially missable';
    badges.append(m);
  }
  if (!hidden && t.count != null) {
    const c = document.createElement('span');
    c.className = 'badge count';
    c.textContent = t.count >= 1000 ? `$${t.count.toLocaleString('en-US')}` : `${t.count}×`;
    badges.append(c);
  }
  for (const k of t.kinds) {
    const kb = document.createElement('span');
    kb.className = 'badge kind';
    kb.textContent = k;
    badges.append(kb);
  }
  li.append(badges);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = hidden ? 'Story trophy — its name and description stay hidden until you earn it.' : `“${t.description}”`;
  li.append(desc);

  if (!hidden) {
    const g = document.createElement('p');
    g.className = 'guide-excerpt';
    g.textContent = excerpt(t.guide);
    li.append(g);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'read-guide';
    btn.textContent = 'Read the full guide & sources →';
    btn.addEventListener('click', () => { location.hash = `#/trophy/${t.id}`; });
    li.append(btn);
  }
  return li;
}

function matches(t) {
  if (state.kind !== 'all' && !t.kinds.includes(state.kind)) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.hideEarned && state.earned.has(t.id)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kinds.join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderProgress() {
  const n = state.earned.size;
  const total = state.trophies.length;
  $('earned-count').textContent = `${n} of ${total}`;
  $('bar-fill').style.width = total ? `${(n / total) * 100}%` : '0%';
  $('bar').setAttribute('aria-valuenow', String(n));
  const byGrade = {};
  for (const t of state.trophies) {
    if (state.earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
  }
  const totals = {};
  for (const t of state.trophies) totals[t.grade] = (totals[t.grade] ?? 0) + 1;
  $('grade-counts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g] ?? 0}/${totals[g] ?? 0} ${g}`).join(' · ');
  $('platinum-note').textContent = n === total
    ? 'Platinum earned — you are a Leonida Legend.'
    : `Platinum “Vice Got a Price!” unlocks when the other 54 are earned — ${total - n} to go.`;
}

function renderList() {
  const shown = state.trophies.filter(matches);
  cardsEl.replaceChildren(...shown.map(trophyCard));
  emptyEl.hidden = shown.length > 0;
  $('list-foot').textContent = `Showing ${shown.length} of ${state.trophies.length} trophies. Progress is saved in this browser (localStorage) and can be exported below.`;
  renderProgress();
}

function sourceLink(key) {
  const s = state.sources[key];
  if (!s) return key;
  if (s.url) return `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`;
  return s.name;
}

function openDetail(id) {
  const t = state.trophies.find((x) => x.id === id);
  const body = $('detail-body');
  if (!t) { body.innerHTML = '<p>That trophy is not in the list.</p>'; $('detail').showModal(); return; }
  const earned = state.earned.has(t.id);
  const steps = (t.steps ?? []).map((s) => `<li>${s}</li>`).join('');
  const srcs = (t.src ?? []).map((k) => `<li>${sourceLink(k)}</li>`).join('');
  const srcLine = (t.src ?? []).map((k) => {
    const s = state.sources[k];
    if (!s) return k;
    const short = s.name.split(' — ')[0];
    return s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${short}</a>` : short;
  }).join(' · ');
  body.innerHTML = `
    <p class="badges"><span class="badge ${t.grade}">${t.grade}</span>
    ${t.missable ? '<span class="badge missable">⚠ potentially missable</span>' : ''}
    ${t.count != null ? `<span class="badge count">${t.count >= 1000 ? '$' + t.count.toLocaleString('en-US') : t.count + '×'}</span>` : ''}
    <span class="badge kind">roadmap stage ${t.stage}</span>
    ${t.kinds.map((k) => `<span class="badge kind">${k}</span>`).join('')}</p>
    <h2>${t.name}</h2>
    <p class="card-desc">Official description: “${t.description}”</p>
    <p class="src-line">Sources: ${srcLine}</p>
    ${t.missable ? `<p class="warn-box"><strong>Potentially missable.</strong> Do Lucia’s Chapter 1 balcony meditation (after the mission Down to Earth, at Jason’s house in the morning) before leaving Chapter 1, and make a manual save right after. See the roadmap for the full steps.</p>` : ''}
    <p>${t.guide}</p>
    ${steps ? `<h3>How to do it</h3><ol class="steps">${steps}</ol>` : ''}
    <h3>Sources</h3>
    <ul class="src-list">${srcs}</ul>
    <p><label><input type="checkbox" id="detail-earned" ${earned ? 'checked' : ''}> I have earned this trophy</label></p>`;
  $('detail').showModal();
  $('detail-earned').addEventListener('change', (e) => {
    if (e.target.checked) state.earned.add(t.id);
    else state.earned.delete(t.id);
    saveEarned();
    renderList();
  });
}

function renderRoadmap() {
  const r = state.roadmap;
  if (!r) return;
  $('roadmap').innerHTML = r.stages.map((s) => `
    <article class="stage">
      <h3>${s.title} <span class="hours">· ${s.hours}</span></h3>
      <ul>${s.points.map((p) => `<li>${p}</li>`).join('')}</ul>
    </article>`).join('');
  $('checklist-100').innerHTML = `<table>
    <thead><tr><th>Activity</th><th>Required for 100%</th></tr></thead>
    <tbody>${r.checklist100.map((c) => `<tr><td>${c.activity}</td><td>${c.required}</td></tr>`).join('')}</tbody>
  </table>`;
  $('tips').innerHTML = r.tips.map((t) => `<li>${t}</li>`).join('');
}

function renderSources() {
  $('source-list').innerHTML = Object.values(state.sources)
    .map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>` : s.name}</li>`).join('');
}

function showView(view) {
  for (const v of ['list', 'roadmap', 'sources']) {
    $(`view-${v}`).hidden = v !== view;
  }
  for (const tab of document.querySelectorAll('.tab')) {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}

function route() {
  const hash = location.hash || '#/';
  if (hash.startsWith('#/trophy/')) {
    showView('list');
    openDetail(Number(hash.slice('#/trophy/'.length)));
  } else if (hash === '#/roadmap') {
    showView('roadmap');
  } else if (hash === '#/sources') {
    showView('sources');
  } else {
    showView('list');
    if ($('detail').open) $('detail').close();
  }
}

function exportProgress() {
  const payload = {
    app: 'leonida-legend',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    const known = new Set(state.trophies.map((t) => t.id));
    const good = ids.filter((id) => known.has(id));
    state.earned = new Set(good);
    saveEarned();
    renderList();
    alert(`Imported ${good.length} earned trophies.`);
  } catch {
    alert('That file is not a Leonida Legend progress export.');
  }
}

async function main() {
  const [trophiesDoc, roadmapDoc] = await Promise.all([
    (await fetch('data/trophies.json')).json(),
    (await fetch('data/roadmap.json')).json(),
  ]);
  state.trophies = trophiesDoc.trophies;
  state.sources = trophiesDoc.sources;
  state.roadmap = roadmapDoc;
  loadStored();
  renderList();
  renderRoadmap();
  renderSources();

  $('search').addEventListener('input', (e) => { state.query = e.target.value.trim(); renderList(); });
  $('grade').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
  $('spoiler').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
    renderList();
  });
  $('hide-earned').addEventListener('change', (e) => {
    state.hideEarned = e.target.checked;
    localStorage.setItem(HIDE_EARNED_KEY, state.hideEarned ? '1' : '0');
    renderList();
  });
  for (const btn of document.querySelectorAll('.kind')) {
    btn.addEventListener('click', () => {
      state.kind = btn.dataset.kind;
      for (const b of document.querySelectorAll('.kind')) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      }
      renderList();
    });
  }
  $('clear-filters').addEventListener('click', () => {
    state.kind = 'all'; state.grade = 'all'; state.query = '';
    $('grade').value = 'all'; $('search').value = '';
    document.querySelector('[data-kind="all"]').click();
  });
  $('export').addEventListener('click', exportProgress);
  $('import').addEventListener('change', (e) => importProgress(e.target.files[0]));
  $('reset').addEventListener('click', () => {
    if (confirm('Clear all earned trophies? This cannot be undone.')) {
      state.earned = new Set();
      saveEarned();
      renderList();
    }
  });
  $('detail').addEventListener('close', () => {
    if (location.hash.startsWith('#/trophy/')) history.replaceState(null, '', '#/');
  });
  window.addEventListener('hashchange', route);
  route();
}

main();
