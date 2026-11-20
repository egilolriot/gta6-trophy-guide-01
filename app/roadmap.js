// The roadmap view: six stages in order, each with its goal, its tips, and
// its trophies as buttons that open the guide. A stage's buttons show which
// of its trophies are already earned, so the reader sees the road ahead.

export function renderRoadmap(noteEl, listEl, roadmap, trophiesById, earned, onOpen) {
  noteEl.textContent = roadmap.note;
  listEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const li = document.createElement('li');
    li.className = 'stage';

    const title = document.createElement('h2');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.stage}`;
    title.append(num, document.createTextNode(stage.title));
    li.append(title);

    const goal = document.createElement('p');
    goal.className = 'stage-goal';
    goal.textContent = stage.goal;
    li.append(goal);

    const tips = document.createElement('ul');
    for (const tip of stage.tips) {
      const item = document.createElement('li');
      item.textContent = tip;
      tips.append(item);
    }
    li.append(tips);

    const buttons = document.createElement('div');
    buttons.className = 'stage-trophies';
    for (const id of stage.trophies) {
      const trophy = trophiesById.get(id);
      if (!trophy) continue;
      const button = document.createElement('button');
      button.type = 'button';
      const done = earned.has(trophy.name);
      if (done) button.classList.add('done');
      button.textContent = `${done ? '✓ ' : ''}${trophy.name} · ${trophy.grade}`;
      button.addEventListener('click', () => onOpen(trophy));
      buttons.append(button);
    }
    li.append(buttons);
    listEl.append(li);
  }
}
