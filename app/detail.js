// The guide panel: one trophy opened beside the list, with its official
// description, its guide in this entry's words, its steps, its sources and
// its missable warning. The panel never fetches anything: sources are named,
// never linked out to, so the guide works with the network off.

export function showDetail(panel, trophy, earned) {
  panel.hidden = false;
  panel.replaceChildren();

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close-btn';
  close.textContent = 'Close ×';
  close.addEventListener('click', () => {
    panel.hidden = true;
  });
  panel.append(close);

  const title = document.createElement('h2');
  title.textContent = trophy.name;
  panel.append(title);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official: ${trophy.description} — ${trophy.grade}, ${trophy.kind}${trophy.count ? `, tracks to ${trophy.count.toLocaleString('en-US')}` : ''}${earned.has(trophy.name) ? ' · earned ✓' : ''}`;
  panel.append(official);

  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'missable-warning';
    warn.textContent = '⚠ Missable: this trophy belongs to a single story moment. Make a manual save before the mission it names — after that moment passes, it does not come back in this playthrough.';
    panel.append(warn);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  panel.append(guideHeading);
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  panel.append(guide);

  if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
    const stepsHeading = document.createElement('h3');
    stepsHeading.textContent = 'Steps';
    panel.append(stepsHeading);
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    panel.append(steps);
  }

  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  panel.append(sourcesHeading);
  const sources = document.createElement('ul');
  sources.className = 'sources';
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    item.textContent = source;
    sources.append(item);
  }
  panel.append(sources);

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
