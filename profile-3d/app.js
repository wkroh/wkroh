const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function readSetting(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveSetting(key, value) {
  try { localStorage.setItem(key, String(value)); } catch { /* Storage can be disabled. */ }
}

const themeButton = $('#theme-toggle');
function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  themeButton.textContent = theme === 'light' ? '☾' : '◐';
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
  saveSetting('wkroh-theme', theme);
}
setTheme(readSetting('wkroh-theme', 'dark'));
themeButton.addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));

$$('.filter').forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  $$('.filter').forEach((item) => {
    const selected = item === button;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  $$('.project-card').forEach((card) => { card.hidden = filter !== 'all' && card.dataset.type !== filter; });
}));

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: .1 });
  $$('.reveal').forEach((item) => observer.observe(item));
} else $$('.reveal').forEach((item) => item.classList.add('visible'));

const art = $('#hero-art');
const scene = $('#art-scene');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  art.addEventListener('pointermove', (event) => {
    const rect = art.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    scene.style.setProperty('--ry', `${-11 + x * 24}deg`);
    scene.style.setProperty('--rx', `${-8 - y * 18}deg`);
  });
  art.addEventListener('pointerleave', () => {
    scene.style.setProperty('--ry', '-11deg');
    scene.style.setProperty('--rx', '-8deg');
  });
}

const heatmap = $('#heatmap');
const detail = $('#day-detail');
const depthButton = $('#depth-toggle');
depthButton.addEventListener('click', () => {
  const enabled = heatmap.classList.toggle('depth');
  depthButton.setAttribute('aria-pressed', String(enabled));
  depthButton.textContent = enabled ? 'Flat view ↙' : '3D view ↗';
});

function renderContributions(data) {
  if (!Array.isArray(data.days) || data.days.length < 300) throw new Error('Incomplete contribution calendar');
  $('#contribution-total').textContent = Number(data.total).toLocaleString();
  $('#activity-heading').textContent = `${Number(data.total).toLocaleString()} contributions in the last year`;
  $('#activity-updated').textContent = `Refreshed ${data.updated} · GitHub public activity`;
  const fragment = document.createDocumentFragment();
  data.days.forEach((item) => {
    const square = document.createElement('button');
    square.type = 'button';
    square.className = 'day';
    square.dataset.level = String(Math.max(0, Math.min(4, Number(item.level) || 0)));
    const date = new Date(`${item.date}T12:00:00Z`);
    const readable = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
    const count = Number(item.count) || 0;
    square.title = `${count} contribution${count === 1 ? '' : 's'} on ${readable}`;
    square.setAttribute('aria-label', square.title);
    square.addEventListener('click', () => {
      $('.day.selected')?.classList.remove('selected');
      square.classList.add('selected');
      detail.textContent = square.title;
    });
    fragment.append(square);
  });
  heatmap.replaceChildren(fragment);
}

fetch('./contributions.json', { cache: 'no-store' })
  .then((response) => { if (!response.ok) throw new Error('Contribution data unavailable'); return response.json(); })
  .then(renderContributions)
  .catch(() => {
    $('#activity-heading').textContent = 'GitHub activity is temporarily unavailable';
    $('#activity-updated').textContent = 'Open the original graph below';
    detail.textContent = 'The activity source could not be loaded.';
  });

fetch('https://api.github.com/users/wkroh', { headers: { Accept: 'application/vnd.github+json' } })
  .then((response) => { if (!response.ok) throw new Error('GitHub API unavailable'); return response.json(); })
  .then((user) => { $('#repo-total').textContent = Number(user.public_repos).toLocaleString(); })
  .catch(() => { $('#repo-total').textContent = '7'; });

const board = $('#game-board');
const startButton = $('#game-start');
const resetButton = $('#game-reset');
const scoreDisplay = $('#game-score');
const timeDisplay = $('#game-time');
const bestDisplay = $('#game-best');
const message = $('#game-message');
const cells = [];
let score = 0;
let best = Number(readSetting('wkroh-commit-rush-best', '0')) || 0;
let target = -1;
let active = false;
let beatBest = false;
let timer = null;
let deadline = 0;
bestDisplay.textContent = String(best);

function placeTarget(focus = false) {
  const previous = target;
  do { target = Math.floor(Math.random() * cells.length); } while (target === previous);
  cells.forEach((cell, index) => {
    const isTarget = index === target;
    cell.classList.toggle('target', isTarget);
    cell.disabled = !isTarget;
    cell.setAttribute('aria-label', isTarget ? 'Catch this glowing commit' : 'Empty square');
  });
  if (focus) cells[target].focus();
}
function stopGame(finished = false) {
  clearInterval(timer);
  timer = null;
  active = false;
  target = -1;
  cells.forEach((cell) => { cell.disabled = true; cell.classList.remove('target'); });
  startButton.textContent = 'Play again ▶';
  if (finished) message.textContent = `Time! You caught ${score} commit${score === 1 ? '' : 's'}. ${beatBest ? 'New personal best!' : 'Try to beat your best.'}`;
}
function tick() {
  const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  timeDisplay.textContent = String(remaining);
  if (remaining === 0) stopGame(true);
}
function startGame() {
  stopGame();
  score = 0;
  beatBest = false;
  scoreDisplay.textContent = '0';
  timeDisplay.textContent = '30';
  deadline = Date.now() + 30_000;
  active = true;
  startButton.textContent = 'Restart ↺';
  message.textContent = 'Go! Catch the glowing commits.';
  placeTarget(true);
  timer = setInterval(tick, 100);
}

for (let index = 0; index < 49; index++) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'game-cell';
  cell.disabled = true;
  cell.setAttribute('aria-label', 'Empty square');
  cell.addEventListener('click', () => {
    if (!active || index !== target) return;
    score += 1;
    scoreDisplay.textContent = String(score);
    if (score > best) { best = score; beatBest = true; bestDisplay.textContent = String(best); saveSetting('wkroh-commit-rush-best', best); }
    cell.classList.add('hit');
    setTimeout(() => cell.classList.remove('hit'), 250);
    placeTarget(true);
  });
  cells.push(cell);
  board.append(cell);
}
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', () => {
  stopGame();
  score = 0;
  scoreDisplay.textContent = '0';
  timeDisplay.textContent = '30';
  startButton.textContent = 'Start game ▶';
  message.textContent = 'Ready when you are.';
});
