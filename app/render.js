// The trophy list: one card per trophy, filtered by kind, grade and status,
// searchable by name, mission or place, and spoiler-masked while the reader
// has not earned a hidden story trophy yet.

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function gradeCounts(trophies, earned) {
  const out = {};
  for (const grade of GRADE_ORDER) {
    const ofGrade = trophies.filter((t) => t.grade === grade);
    out[grade] = { earned: ofGrade.filter((t) => earned.has(t.name)).length, total: ofGrade.length };
  }
  return out;
}

// Update the header: how many are earned overall, the bar, and the per-grade
// counts beside it.
export function renderProgress(trophies, earned) {
  document.getElementById('earnedCount').textContent = String(earned.size);
  document.getElementById('totalCount').textContent = String(trophies.length);
  document.getElementById('progressFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  const counts = gradeCounts(trophies, earned);
  document.getElementById('gradeCounts').textContent = GRADE_ORDER
    .map((g) => `${counts[g].earned}/${counts[g].total} ${g}`)
    .join(' · ');
}

function trophyMatches(t, filters, earned) {
  if (filters.kind !== 'all') {
    if (filters.kind === 'missable') {
      if (!t.missable) return false;
    } else if (t.kind !== filters.kind) {
      return false;
    }
  }
  if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
  if (filters.status === 'earned' && !earned.has(t.name)) return false;
  if (filters.status === 'remaining' && earned.has(t.name)) return false;
  if (filters.query) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(filters.query)) return false;
  }
  return true;
}

function pill(text, cls) {
  const span = document.createElement('span');
  span.className = `pill ${cls}`;
  span.textContent = text;
  return span;
}

// One card. A hidden story trophy stays masked while spoiler-safe mode is on
// and it is unearned: its grade shows, its name and description do not.
export function trophyCard(t, earned, spoilerSafe, onToggle, onOpen) {
  const li = document.createElement('li');
  li.className = 'trophy';
  li.dataset.trophyId = String(t.id);
  const isEarned = earned.has(t.name);
  if (isEarned) li.classList.add('earned');
  const masked = spoilerSafe && t.hidden && !isEarned;
  if (masked) li.classList.add('spoiled');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'trophy-check';
  box.checked = isEarned;
  box.setAttribute('aria-label', `Mark ${masked ? 'this hidden trophy' : t.name} earned`);
  box.addEventListener('change', () => onToggle(t, box.checked));
  li.append(box);

  const body = document.createElement('div');
  const name = document.createElement('p');
  name.className = 'trophy-name';
  name.textContent = masked ? 'Hidden trophy — earn it to reveal' : t.name;
  body.append(name);
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = masked ? 'A story trophy. Its name and description stay hidden until earned.' : t.description;
  body.append(desc);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  meta.append(pill(t.grade, `grade-${t.grade}`));
  meta.append(pill(t.kind, ''));
  if (t.missable) meta.append(pill('Missable', 'missable'));
  if (t.hidden) meta.append(pill('Hidden', 'hidden-trophy'));
  if (t.count) {
    const count = document.createElement('span');
    count.className = 'trophy-count';
    count.textContent = `Tracks to ${t.count.toLocaleString('en-US')}`;
    meta.append(count);
  }
  body.append(meta);
  li.append(body);

  const open = document.createElement('span');
  open.className = 'trophy-guide-link';
  open.textContent = 'Guide →';
  li.append(open);

  li.addEventListener('click', (event) => {
    if (event.target === box) return;
    onOpen(t);
  });
  return li;
}

export function renderList(listEl, hintEl, trophies, earned, filters, spoilerSafe, onToggle, onOpen) {
  const shown = trophies.filter((t) => trophyMatches(t, filters, earned));
  listEl.replaceChildren();
  if (shown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No trophies match those filters. Loosen one and try again.';
    listEl.append(empty);
  } else {
    for (const t of shown) listEl.append(trophyCard(t, earned, spoilerSafe, onToggle, onOpen));
  }
  const remaining = trophies.length - earned.size;
  hintEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${remaining} remaining${spoilerSafe ? ' · spoiler-safe mode on: hidden story trophies stay masked until earned' : ''}`;
}
