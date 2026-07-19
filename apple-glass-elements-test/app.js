const root = document.documentElement;
const storageKey = `design-tweaks-${location.pathname}`;
const controlIds = ['accent', 'scale', 'density', 'mode'];
const defaults = { accent: '#d67546', scale: '1', density: '1', mode: 'light' };

const accentRgb = {
  '#d67546': '214, 117, 70',
  '#3d7d6b': '61, 125, 107',
  '#426f91': '66, 111, 145'
};

function readControls() {
  return Object.fromEntries(controlIds.map((id) => [id, document.getElementById(id).value]));
}

function applyTweaks(state, persist = true) {
  const safeState = { ...defaults, ...state };
  root.dataset.mode = safeState.mode;
  root.style.setProperty('--accent', safeState.accent);
  root.style.setProperty('--accent-rgb', accentRgb[safeState.accent] || accentRgb[defaults.accent]);
  root.style.setProperty('--scale', safeState.scale);
  root.style.setProperty('--density', safeState.density);
  controlIds.forEach((id) => { document.getElementById(id).value = safeState[id]; });
  if (persist) localStorage.setItem(storageKey, JSON.stringify(safeState));
}

let savedState = null;
try { savedState = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { savedState = null; }
applyTweaks(savedState || defaults);

controlIds.forEach((id) => {
  document.getElementById(id).addEventListener('change', () => applyTweaks(readControls()));
});

document.getElementById('reset').addEventListener('click', () => {
  localStorage.removeItem(storageKey);
  applyTweaks(defaults, false);
});

const focusLens = document.querySelector('.focus-lens');
const sceneToggle = document.getElementById('scene-toggle');
const sceneState = document.getElementById('scene-state');
const sceneDetail = document.getElementById('scene-detail');

sceneToggle.addEventListener('click', () => {
  const isPlaying = sceneToggle.getAttribute('aria-pressed') !== 'true';
  sceneToggle.setAttribute('aria-pressed', String(isPlaying));
  sceneToggle.setAttribute('aria-label', isPlaying ? 'Pause Low Tide scene' : 'Start Low Tide scene');
  focusLens.classList.toggle('is-playing', isPlaying);
  focusLens.classList.remove('is-active');
  void focusLens.offsetWidth;
  focusLens.classList.add('is-active');
  sceneState.textContent = isPlaying ? 'Low Tide · playing' : 'Low Tide';
  sceneDetail.textContent = isPlaying ? 'In the field · 12 min' : 'Ready · 12 min';
});

const contextSheet = document.getElementById('context-sheet');
const notesOpen = document.getElementById('notes-open');
const notesClose = document.getElementById('notes-close');

function setNotes(open) {
  contextSheet.hidden = !open;
  notesOpen.setAttribute('aria-expanded', String(open));
  if (open) notesClose.focus();
  else notesOpen.focus();
}

notesOpen.addEventListener('click', () => setNotes(true));
notesClose.addEventListener('click', () => setNotes(false));
contextSheet.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setNotes(false);
});

window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
