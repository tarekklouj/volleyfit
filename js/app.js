'use strict';

/* ================= Outils ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localInput = d => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDate = iso => { const d = new Date(iso); return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`; };
const fmtTime = iso => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDateTime = iso => `${fmtDate(iso)} ${fmtTime(iso)}`;
const weekday = d => (d.getDay() + 6) % 7;
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmtNum = (n, d = 1) => n == null ? '–' : (Math.round(n) === n && d === 1 ? String(n) : n.toFixed(d).replace('.', ','));
const fmtKg = n => n == null ? '–' : (n % 1 ? n.toFixed(1).replace('.', ',') : String(n));
const fmtRest = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`) : `${s} s`;
const fmtClock = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;
const fmtVolume = v => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(v)} kg`;
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ZONES = ['Machines', 'Smith machine', 'Poulie', 'Cardio', 'Étirements'];
const METRICS = {
  weight: { label: 'Poids', unit: 'kg' },
  fat: { label: 'Masse grasse', unit: '%' },
  muscle: { label: 'Masse musculaire', unit: '%' },
  bone: { label: 'Masse osseuse', unit: '%' },
  water: { label: 'Eau corporelle', unit: '%' }
};
const EX = EXERCISES;
const muscleNames = keys => (keys || []).map(k => MUSCLES[k]).filter(Boolean);
const primaryText = e => muscleNames(e.target?.p).join(', ');
function musclesHTML(e) {
  const p = muscleNames(e.target?.p), sec = muscleNames(e.target?.s);
  return `<div class="muscles">
    ${FIG.muscles(e.target, 'Muscles ciblés : ' + p.join(', '))}
    <div class="muscles__legend">
      <p><span class="dot dot--p"></span><strong>Principaux</strong><br>${p.join(', ') || '–'}</p>
      ${sec.length ? `<p><span class="dot dot--s"></span><strong>Secondaires</strong><br>${sec.join(', ')}</p>` : ''}
    </div>
  </div>`;
}

const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4v1a4 4 0 004 4M16 6h4v1a4 4 0 01-4 4M12 13v4M8 20h8M10 17h4"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>'
};

/* ================= Données ================= */
const STORE = 'volleyfit-v2';
const defaults = () => ({
  profile: {
    name: '', height: '', gymDays: [0, 2, 4], matchDay: null,
    cycleStart: isoDate(new Date()), warmupMin: 20, warmupMachine: 'auto',
    goalWeight: '', goalFat: '', sound: true, vibrate: true, theme: 'system'
  },
  measures: [], history: [], swaps: {}, exNotes: {}, active: null
});

function hydrate(s) {
  const d = defaults();
  const out = { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, swaps: {}, exNotes: s.exNotes || {} };
  delete out.profile.position;
  for (const [k, v] of Object.entries(s.swaps || {})) if (EXERCISES[v]) out.swaps[k] = v;
  if (out.active && (!out.active.items || out.active.items.some(it => !EXERCISES[it.ex]))) out.active = null;
  return out;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return hydrate(JSON.parse(raw));
    const old = localStorage.getItem('volleyfit-v1');
    if (old) { const o = JSON.parse(old); return hydrate({ profile: o.profile, measures: o.measures || [] }); }
  } catch (e) { /* stockage indisponible */ }
  return defaults();
}
let state = loadState();

/* ================= Apparence ================= */
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = state.profile.theme, root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#EEF4F2';
}
darkQuery.addEventListener?.('change', applyTheme);
applyTheme();
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); }
  catch (e) { toast('Sauvegarde impossible : le stockage du navigateur est bloqué.'); }
}

/* ================= Planning ================= */
function planWeek(p = state.profile) {
  const plan = Array(7).fill(null);
  const m = p.matchDay, hasMatch = m !== null && m !== undefined;
  if (hasMatch) plan[m] = 'M';
  const queue = ['A', 'B', 'C', 'A', 'B', 'C', 'A'];
  [...p.gymDays].sort((a, b) => a - b).forEach(d => {
    if (plan[d] === 'M') return;
    if (hasMatch && d === (m + 1) % 7) { plan[d] = 'R'; return; }
    if (hasMatch && d === (m + 6) % 7) {
      const i = queue.slice(0, 3).indexOf('B');
      plan[d] = i >= 0 ? queue.splice(i, 1)[0] : 'R';
      return;
    }
    plan[d] = queue.shift();
  });
  return plan;
}
function cycleWeek() {
  const start = new Date(state.profile.cycleStart + 'T00:00');
  const today = new Date(isoDate(new Date()) + 'T00:00');
  const days = Math.round((today - start) / 864e5);
  if (!Number.isFinite(days) || days < 0) return 1;
  return Math.floor(days / 7) % 4 + 1;
}
const isDeload = () => cycleWeek() === 4;
const setsFor = it => isDeload() ? Math.max(1, it.sets - 1) : it.sets;
const warmupFor = code => state.profile.warmupMachine !== 'auto' ? state.profile.warmupMachine : SESSIONS[code].warmup;

/* Durée : chaque séance est ajustée pour durer entre 50 et 70 minutes, échauffement compris. */
const SESSION_MIN = 50, SESSION_MAX = 70, SESSION_TARGET = 60, TRANSITION = 60;
function itemSeconds(it, n) {
  if (it.duration) return it.duration * 60 + TRANSITION;
  const side = /par (jambe|côté|bras)/.test(it.reps || '') || it.perSide;
  const work = it.hold ? it.hold * (it.perSide ? 2 : 1) + 10 : (side ? 70 : 40);
  return n * (work + it.rest) + TRANSITION;
}
function fitSession(code, warmMin = state.profile.warmupMin, light = false) {
  const s = SESSIONS[code];
  const plan = s.items.map((it, slot) => ({ ...it, slot, n: it.duration ? 0 : Math.max(1, setsFor(it) - (light ? 1 : 0)), on: true }));
  let cool = 0;
  const total = () => warmMin * 60 + plan.filter(p => p.on).reduce((t, p) => t + itemSeconds(p, p.n), 0) + (cool ? cool * 60 + TRANSITION : 0);
  const fromEnd = plan.map((_, i) => i).reverse();
  const passes = [p => !p.core && p.n > 2, p => p.core && p.n > 3, p => !p.core && p.n > 1];
  for (let guard = 0; total() > SESSION_MAX * 60 && guard < 200; guard++) {
    let i;
    for (const ok of passes) { i = fromEnd.find(j => plan[j].on && !plan[j].duration && ok(plan[j])); if (i !== undefined) break; }
    if (i !== undefined) { plan[i].n--; continue; }
    i = fromEnd.find(j => plan[j].on && !plan[j].core);
    if (i === undefined) break;
    plan[i].on = false;
  }
  if (s.cooldown) while (total() < SESSION_TARGET * 60 && cool < s.cooldown.max) cool++;
  if (cool && cool < 3) cool = 0;
  return { plan: plan.filter(p => p.on), cool, minutes: Math.round(total() / 60) };
}
const estimateMinutes = s => fitSession(Object.keys(SESSIONS).find(k => SESSIONS[k] === s)).minutes;
function targetText(it) {
  if (it.kind === 'warmup' || it.kind === 'time' || it.duration) return `${it.minutes ?? it.duration} min`;
  const n = it.sets?.length ?? it.n ?? setsFor(it);
  const base = it.hold ? `${n} × ${it.hold} s${it.perSide ? ' par côté' : ''}` : `${n} × ${it.reps}`;
  return `${base}, repos ${fmtRest(it.rest)}`;
}
const targetNum = it => it.hold ? it.hold : (parseInt(it.reps, 10) || '');

/* ================= Historique et records ================= */
function e1rm(s) {
  const kg = num(s.kg), r = num(s.reps);
  if (!kg || !r) return 0;
  return r === 1 ? kg : kg * (1 + r / 30);
}
const setValue = (exId, s) => !EX[exId] ? 0 : EX[exId].type === 'hold' ? (num(s.sec) || 0) : (EX[exId].loaded ? e1rm(s) : (num(s.reps) || 0));
function lastSetsFor(exId) {
  for (const h of state.history) {
    const it = (h.items || []).find(x => x.ex === exId && (x.sets || []).some(s => s.done));
    if (it) return it.sets.filter(s => s.done);
  }
  return [];
}
function bestFor(exId, history = state.history) {
  let best = null;
  for (const h of history) for (const it of h.items || []) {
    if (it.ex !== exId) continue;
    for (const s of it.sets || []) {
      if (!s.done) continue;
      const v = setValue(exId, s);
      if (v > 0 && (!best || v > best.v)) best = { v, s, date: h.date };
    }
  }
  return best;
}
function setText(exId, s) {
  const e = EX[exId] || { type: s.sec ? 'hold' : 'reps', loaded: !!s.kg };
  if (e.type === 'hold') return `${s.kg ? fmtKg(num(s.kg)) + ' kg, ' : ''}${s.sec} s`;
  return e.loaded && num(s.kg) ? `${fmtKg(num(s.kg))} kg × ${s.reps}` : `${s.reps} répétitions`;
}
function sessionVolume(items) {
  return items.reduce((t, it) => t + (it.sets || []).reduce((a, s) => a + (s.done ? (num(s.kg) || 0) * (num(s.reps) || 0) : 0), 0), 0);
}
function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - weekday(x)); return x; }
function sessionsBetween(a, b) { return state.history.filter(h => { const d = new Date(h.date); return d >= a && d < b; }); }
function weekCount(ws) { const we = new Date(ws); we.setDate(we.getDate() + 7); return sessionsBetween(ws, we).length; }
function weeklyGoal() { return planWeek().filter(c => SESSIONS[c]).length || 3; }
function streak() {
  const goal = weeklyGoal();
  let w = weekStart(new Date()), n = 0;
  if (weekCount(w) >= goal) n++;
  for (let i = 0; i < 260; i++) {
    w = new Date(w); w.setDate(w.getDate() - 7);
    if (weekCount(w) >= goal) n++; else break;
  }
  return n;
}

/* ================= Navigation ================= */
let view = 'today';
function go(v) {
  view = v;
  closeSheet();
  $$('.view').forEach(s => { s.hidden = s.id !== 'view-' + v; });
  $$('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.view === v ? 'page' : 'false'));
  render();
  window.scrollTo(0, 0);
}
function render() {
  ({ today: renderToday, program: renderProgram, library: renderLibrary, progress: renderProgress, profile: renderProfile })[view]();
  const banner = $('#resume');
  banner.hidden = !(state.active && view !== 'today');
  if (!banner.hidden) banner.querySelector('span').textContent = `Séance en cours : ${SESSIONS[state.active.code].name}`;
}
$$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.view)));
$('#resume').addEventListener('click', () => go('today'));

/* ================= Sheet (panneau du bas) ================= */
let sheetCleanup = null;
function openSheet(html, { label = 'Détails', onClose } = {}) {
  closeSheet();
  const w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet-backdrop" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1">
      <div class="sheet__grab" aria-hidden="true"></div>
      <button class="icon-btn sheet__close" type="button" data-close aria-label="Fermer">${ICON.close}</button>
      <div class="sheet__body">${html}</div>
    </div>`;
  document.body.appendChild(w);
  document.body.classList.add('has-sheet');
  w.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  sheetCleanup = onClose || null;
  $('.sheet', w).focus();
  return $('.sheet__body', w);
}
function closeSheet() {
  const w = $('.sheet-wrap');
  if (!w) return;
  w.remove();
  document.body.classList.remove('has-sheet');
  if (sheetCleanup) { const c = sheetCleanup; sheetCleanup = null; c(); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ================= Fiche exercice ================= */
function exThumb(id, cls = '') {
  return `<span class="thumb ${cls}">${FIG.svg(EX[id].fig, 'Illustration : ' + EX[id].name)}</span>`;
}
function openExercise(id) {
  const e = EX[id], best = bestFor(id);
  let anim = { stop() {} };
  const body = openSheet(`
    <div class="anim">
      <div class="sheet-fig" id="anim-fig"></div>
      <div class="anim__bar">
        <span class="anim__phase" id="anim-phase" aria-live="polite">Départ</span>
        <div class="seg seg--sm" role="group" aria-label="Lecture">
          <button type="button" data-anim="play" aria-pressed="true" aria-label="Lecture">${ICON.play}</button>
          <button type="button" data-anim="start" aria-pressed="false">Départ</button>
          <button type="button" data-anim="end" aria-pressed="false">Arrivée</button>
        </div>
        <button class="chip chip--sm" type="button" id="anim-speed" aria-pressed="false">Lent</button>
        <span class="pill anim__view">${FIG.view(e.fig)}</span>
      </div>
      ${FIG.hint(e.fig) ? `<p class="anim__hint">${esc(FIG.hint(e.fig))}</p>` : ''}
      <p class="small muted">En corail, ce qui travaille. La flèche en pointillés montre le trajet. La silhouette pâle est la position de départ.</p>
    </div>
    <h2 class="sheet__title">${esc(e.name)}</h2>
    <div class="tags"><span class="pill">${esc(e.zone)}</span><span class="pill">${esc(e.equip)}</span></div>
    <label class="field ex-note"><span>Mes réglages sur cette machine</span><textarea id="ex-note" rows="2" placeholder="Ex. : siège 4, dossier 2, poignées hautes">${esc(state.exNotes[id] || '')}</textarea></label>
    <h3 class="sub">Muscles ciblés</h3>
    ${musclesHTML(e)}
    <h3 class="sub">Comment faire</h3>
    <ol class="steps">${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <p class="callout callout--warn"><strong>Erreur fréquente.</strong> ${esc(e.mistake)}</p>
    <p class="callout"><strong>Pour le volley.</strong> ${esc(e.why)}</p>
    ${best ? `<p class="record">${ICON.trophy}<span>Ton record : <strong>${setText(id, best.s)}</strong>, le ${fmtDate(best.date)}</span></p>` : ''}
    ${e.alt?.length ? `<h3 class="sub">Si la machine est prise ou absente</h3>
      <div class="list">${e.alt.map(a => `<button class="row" type="button" data-ex="${a}">${exThumb(a, 'thumb--sm')}<span><strong>${esc(EX[a].name)}</strong><br><span class="muted small">${esc(EX[a].equip)}</span></span></button>`).join('')}</div>` : ''}
  `, { label: e.name, onClose: () => {
    anim.stop();
    if (state.active && view === 'today') state.active.items.forEach((x, i) => { if (x.ex === id) rerenderItem(i); });
  } });
  $('#ex-note', body).oninput = ev => { const v = ev.target.value.trim(); if (v) state.exNotes[id] = v; else delete state.exNotes[id]; save(); };
  anim = FIG.mount($('#anim-fig'), e.fig, { label: 'Animation : ' + e.name, onPhase: t => { const el = $('#anim-phase'); if (el) el.textContent = t; } });
  $$('[data-anim]', body).forEach(b => b.onclick = () => {
    anim.set(b.dataset.anim);
    $$('[data-anim]', body).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (b.dataset.anim !== 'play') $('#anim-phase').textContent = b.dataset.anim === 'start' ? 'Position de départ' : 'Position d\'arrivée';
  });
  $('#anim-speed', body).onclick = e2 => e2.currentTarget.setAttribute('aria-pressed', String(anim.speed()));
  $$('[data-ex]', body).forEach(b => b.onclick = () => openExercise(b.dataset.ex));
}

/* Muscles travaillés sur les 7 derniers jours : séries par muscle (principal 1, secondaire 0,5). */
const KEY_MUSCLES = ['quadriceps', 'ischios', 'fessiers', 'mollets', 'dorsaux', 'coiffe', 'abdos'];
function weekMuscles() {
  const since = Date.now() - 7 * 864e5, count = {};
  for (const h of state.history) {
    if (new Date(h.date) < since) continue;
    for (const it of h.items || []) {
      const e = EX[it.ex];
      if (!e || it.kind === 'warmup' || it.kind === 'time') continue;
      const n = (it.sets || []).filter(x => x.done).length;
      (e.target?.p || []).forEach(m => count[m] = (count[m] || 0) + n);
      (e.target?.s || []).forEach(m => count[m] = (count[m] || 0) + n / 2);
    }
  }
  const levels = Object.fromEntries(Object.entries(count).filter(([, v]) => v > 0).map(([k, v]) => [k, v <= 3 ? 1 : v <= 8 ? 2 : 3]));
  return { count, levels };
}
function weekMusclesHTML() {
  const { count, levels } = weekMuscles();
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${MUSCLES[k]} (${Math.max(1, Math.round(v))})`);
  const missing = KEY_MUSCLES.filter(k => !count[k]).slice(0, 3).map(k => MUSCLES[k]);
  return `<section class="panel">
    <div class="panel__head"><h2>Muscles travaillés</h2><span class="muted small">7 derniers jours</span></div>
    ${top.length ? `<div class="muscles">
      ${FIG.muscles({}, 'Muscles travaillés ces 7 derniers jours', levels)}
      <div class="muscles__legend">
        <p><strong>Le plus travaillé</strong><br>${top.join(', ')} séries</p>
        ${missing.length ? `<p><strong>Pas encore cette semaine</strong><br>${missing.join(', ')}</p>` : '<p><strong>Tous les muscles clés</strong> ont été travaillés.</p>'}
        <p class="heat"><span class="heat__sw l1"></span>1 à 3<span class="heat__sw l2"></span>4 à 8<span class="heat__sw l3"></span>9+</p>
      </div>
    </div>` : '<p class="empty">Termine une séance pour voir quels muscles tu as travaillés cette semaine.</p>'}
  </section>`;
}

/* ================= Aujourd'hui ================= */
const NET = '<div class="court__net" aria-hidden="true"></div>';

function weekStrip(plan, today) {
  const ws = weekStart(new Date());
  return `<ol class="week">${plan.map((c, i) => {
    const s = SESSIONS[c];
    const d = new Date(ws); d.setDate(d.getDate() + i);
    const e = new Date(d); e.setDate(e.getDate() + 1);
    const done = sessionsBetween(d, e).length > 0;
    return `<li class="week__day ${i === today ? 'is-today' : ''}">
      <span class="week__name" aria-label="${DAYS[i]}">${DAYS_SHORT[i]}</span>
      <span class="week__code ${done ? 'is-done' : ''}" ${s ? `style="--sess:${s.color}"` : ''} title="${c === 'M' ? 'Match' : s ? esc(s.name) : 'Repos'}">${done ? ICON.check : c === 'M' ? '🏐' : c || '·'}</span>
    </li>`;
  }).join('')}</ol>`;
}

function renderToday() {
  const el = $('#view-today');
  if (state.active) return renderWorkout(el);

  const now = new Date(), wd = weekday(now), plan = planWeek(), code = plan[wd];
  const p = state.profile;
  const hello = p.name ? `Salut ${esc(p.name)}. ` : '';
  let hero;
  if (code === 'M') {
    hero = `<section class="court" style="--sess:#12302F">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}</p>
      <h1 class="court__title">Jour de match</h1>
      <p class="court__meta">Pas de salle aujourd'hui. Avant le match : 5 minutes de rotations d'épaules à l'élastique et quelques sauts progressifs.</p>
    </section>`;
  } else if (SESSIONS[code]) {
    const s = SESSIONS[code];
    hero = `<section class="court" style="--sess:${s.color}">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}, semaine ${cycleWeek()} sur 4</p>
      <h1 class="court__title">${esc(s.name)}</h1>
      <p class="court__meta">${esc(s.goal)}</p>
      <p class="court__facts"><span>${p.warmupMin} min d'échauffement</span><span>${fitSession(code).plan.length} exercices</span><span>${estimateMinutes(s)} min au total</span></p>
      <button class="btn btn--court" data-start="${code}" type="button">${ICON.play} Commencer la séance</button>
    </section>`;
  } else {
    hero = `<section class="court" style="--sess:#557270">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}</p>
      <h1 class="court__title">Jour de repos</h1>
      <p class="court__meta">Les muscles se construisent pendant la récupération. Marche, étire-toi, dors bien.</p>
    </section>`;
  }

  const goal = weeklyGoal(), done = weekCount(weekStart(now)), st = streak();
  const last = state.history[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = sessionsBetween(monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1));

  el.innerHTML = `
    ${hero}
    ${isDeload() ? '<p class="callout">Semaine 4 du cycle : semaine allégée. Une série de moins par exercice pour bien récupérer.</p>' : ''}
    <section class="panel">
      <div class="panel__head"><h2>Ta semaine</h2><span class="muted small">${done} sur ${goal}</span></div>
      <div class="goalbar" aria-hidden="true">${Array.from({ length: goal }, (_, i) => `<span class="${i < done ? 'on' : ''}"></span>`).join('')}</div>
      ${weekStrip(plan, wd)}
      <p class="legend">A jambes, B épaules, C puissance et gainage, R récupération.</p>
    </section>
    <section class="stats3">
      <div class="stat"><p class="stat__value">${st}</p><p class="stat__label">${st > 1 ? 'semaines' : 'semaine'} d'affilée à l'objectif</p></div>
      <div class="stat"><p class="stat__value">${month.length}</p><p class="stat__label">${month.length > 1 ? 'séances' : 'séance'} en ${MONTHS[now.getMonth()]}</p></div>
      <div class="stat"><p class="stat__value">${fmtVolume(month.reduce((t, h) => t + (h.volume || 0), 0))}</p><p class="stat__label">soulevés ce mois</p></div>
    </section>
    ${weekMusclesHTML()}
    ${last ? `<button class="panel last" type="button" data-session="${last.id}">
      <span class="tag" style="--sess:${SESSIONS[last.code]?.color}">${esc(last.code)}</span>
      <span><strong>Dernière séance : ${esc(last.name)}</strong><br><span class="muted small">${fmtDate(last.date)}, ${last.minutes} min, ${fmtVolume(last.volume || 0)}${last.prs?.length ? `, ${plural(last.prs.length, 'record')}` : ''}</span></span>
    </button>` : ''}
    <section class="panel">
      <h2>Faire une autre séance</h2>
      <div class="sess-grid">${Object.entries(SESSIONS).map(([k, s]) =>
        `<button class="sess-btn" style="--sess:${s.color}" data-start="${k}" type="button"><b>${k}</b><span>${esc(s.name)}</span></button>`).join('')}</div>
    </section>`;
  $$('[data-start]', el).forEach(b => b.addEventListener('click', () => startSession(b.dataset.start)));
  $$('[data-session]', el).forEach(b => b.addEventListener('click', () => openSession(b.dataset.session)));
}

/* ================= Séance en cours ================= */
function buildItems(code, light = false) {
  const s = SESSIONS[code], p = state.profile, fit = fitSession(code, undefined, light);
  const items = [{ ex: warmupFor(code), kind: 'warmup', minutes: p.warmupMin, sets: [{ done: false }] }];
  fit.plan.forEach(it => {
    const slot = it.slot;
    const exId = EX[state.swaps[`${code}:${slot}`]] ? state.swaps[`${code}:${slot}`] : it.ex;
    if (it.duration) { items.push({ ex: exId, slot, kind: 'time', minutes: it.duration, sets: [{ done: false }] }); return; }
    items.push({
      ex: exId, slot, kind: it.hold ? 'hold' : 'reps', reps: it.reps, hold: it.hold, perSide: it.perSide, rest: it.rest,
      sets: Array.from({ length: it.n }, () => ({ kg: '', reps: '', sec: '', done: false }))
    });
  });
  if (fit.cool) items.push({ ex: s.cooldown.ex, kind: 'time', cooldown: true, minutes: fit.cool, sets: [{ done: false }] });
  return items;
}
function startSession(code) {
  if (state.active && !confirm('Une séance est déjà en cours. La remplacer ?')) return;
  openCheckin(code);
}
/* Annuler une séance : sans confirmation si aucune série n'est encore validée. */
function cancelSession() {
  const a = state.active;
  if (!a) return;
  const anyDone = a.items.some(it => it.sets.some(x => x.done));
  if (anyDone && !confirm('Annuler la séance ? Les séries déjà validées ne seront pas enregistrées.')) return;
  state.active = null; stopTimer(); save(); render(); window.scrollTo(0, 0);
  toast('Séance annulée.');
}

function beginSession(code, light, checkin) {
  state.active = { code, start: Date.now(), light, checkin, planned: fitSession(code, undefined, light).minutes, items: buildItems(code, light), rpe: '', notes: '' };
  save();
  closeSheet();
  go('today');
  toast(`Séance ${code} démarrée.`, { action: 'Annuler', onAction: cancelSession, duration: 8000 });
}

/* Check-in : comment tu te sens avant de commencer ? */
const CHECKIN = [
  { key: 'energie', label: 'Énergie', opts: ['Faible', 'Normale', 'Top'], def: 1, warn: 0 },
  { key: 'courbatures', label: 'Courbatures', opts: ['Aucune', 'Légères', 'Fortes'], def: 0, warn: 2 },
  { key: 'douleur', label: 'Douleur (genou, épaule, dos)', opts: ['Aucune', 'Légère', 'Marquée'], def: 0, warn: 2 }
];
function openCheckin(code) {
  const s = SESSIONS[code];
  const val = Object.fromEntries(CHECKIN.map(c => [c.key, c.def]));
  const body = openSheet(`
    <h2 class="sheet__title">Comment tu te sens ?</h2>
    <p class="muted">Séance ${code} : ${esc(s.name)}. Trois réponses pour adapter la séance.</p>
    ${CHECKIN.map(c => `<div class="field"><span>${c.label}</span>
      <div class="seg" role="group" aria-label="${c.label}">${c.opts.map((o, i) => `<button type="button" data-ck="${c.key}" data-v="${i}" aria-pressed="${i === c.def}">${o}</button>`).join('')}</div></div>`).join('')}
    <div id="ck-advice"></div>
    <button class="btn btn--block" type="button" id="ck-normal" style="background:${s.color}">${ICON.play} Séance complète, ${fitSession(code).minutes} min</button>
    <button class="btn btn--ghost btn--block" type="button" id="ck-light">Version allégée, ${fitSession(code, undefined, true).minutes} min</button>
  `, { label: 'Check-in avant séance' });
  const advise = () => {
    const tired = CHECKIN.some(c => val[c.key] === c.warn);
    $('#ck-advice', body).innerHTML = tired
      ? `<p class="callout callout--warn">On te conseille la <strong>version allégée</strong> : une série de moins par exercice.${val.douleur === 2 ? ' Si une douleur dépasse 4 sur 10 ou augmente pendant un exercice, arrête-le et parles-en à un kiné.' : ''}</p>`
      : '<p class="callout">Tout est au vert : fonce sur la séance complète.</p>';
    $('#ck-light', body).classList.toggle('btn--reco', tired);
  };
  $$('[data-ck]', body).forEach(b => b.onclick = () => {
    val[b.dataset.ck] = +b.dataset.v;
    $$(`[data-ck="${b.dataset.ck}"]`, body).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    advise();
  });
  advise();
  const summary = () => Object.fromEntries(CHECKIN.map(c => [c.key, c.opts[val[c.key]]]));
  $('#ck-normal', body).onclick = () => beginSession(code, false, summary());
  $('#ck-light', body).onclick = () => beginSession(code, true, summary());
}

function renderWorkout(el) {
  const a = state.active, s = SESSIONS[a.code];
  if (!s || !a.items) { state.active = null; save(); return renderToday(); }
  el.innerHTML = `
    <header class="wk-head" style="--sess:${s.color}">
      <div class="wk-head__row">
        <div><p class="muted small">Séance ${a.code}${a.light ? ', version allégée' : ''}${a.planned ? `, prévue en ${a.planned} min` : ''}</p><h2>${esc(s.name)}</h2></div>
        <div class="wk-head__side"><span class="clock" id="elapsed">0:00</span><button class="icon-btn wk-cancel" id="cancel-top" type="button" aria-label="Annuler la séance">${ICON.close}</button><button class="btn btn--sm" id="finish" type="button">Terminer</button></div>
      </div>
      <div class="progress"><span id="wk-progress"></span></div>
    </header>
    ${isDeload() ? '<p class="callout">Semaine allégée : une série de moins.</p>' : ''}
    <div id="wk-items">${a.items.map((it, i) => itemHTML(it, i)).join('')}</div>
    <button class="btn btn--quiet btn--block" id="abandon" type="button">Annuler la séance</button>`;
  updateProgress();
  tickElapsed();

  el.onclick = onWorkoutClick;
  el.oninput = e => {
    const t = e.target;
    if (t.dataset.f) { const st = state.active.items[+t.dataset.i].sets[+t.dataset.k]; st[t.dataset.f] = t.value; save(); }
  };
  $('#finish').onclick = openFinish;
  $('#abandon').onclick = cancelSession;
  $('#cancel-top').onclick = cancelSession;
}

/* Charge suggérée : +2,5 ou +5 kg si toutes les répétitions ont été réussies la dernière fois. */
function suggestFor(it) {
  const e = EX[it.ex];
  if (!e?.loaded || (it.kind !== 'reps' && it.kind !== 'hold')) return null;
  const prev = lastSetsFor(it.ex).filter(x => num(x.kg));
  if (!prev.length) return null;
  const kg = Math.max(...prev.map(x => num(x.kg)));
  const top = it.kind === 'hold' ? it.hold : Math.max(...(String(it.reps).match(/\d+/g) || [10]).map(Number));
  const hit = prev.every(x => (it.kind === 'hold' ? num(x.sec) : num(x.reps)) >= top);
  if (!hit || state.active?.light) return { kg, up: false };
  return { kg: kg + (kg < 30 ? 2.5 : 5), up: true, from: kg };
}

function itemHTML(it, i) {
  const e = EX[it.ex], s = SESSIONS[state.active.code];
  const complete = it.sets.length && it.sets.every(x => x.done);
  const canSwap = it.kind !== 'warmup' && e.alt?.length || (it.slot !== undefined && state.swaps[`${state.active.code}:${it.slot}`]);
  const head = `<div class="wx__head">
    <button class="wx__fig" type="button" data-info="${it.ex}" aria-label="Voir comment faire : ${esc(e.name)}">${exThumb(it.ex)}</button>
    <div class="wx__title">
      <h3>${esc(e.name)}</h3>
      <p class="wx__target">${it.kind === 'warmup' ? 'Échauffement, ' : it.cooldown ? 'Retour au calme, ' : ''}${targetText(it)}</p>
      <p class="wx__equip">${esc(e.equip)}${primaryText(e) ? ` <span class="wx__muscles">${esc(primaryText(e))}</span>` : ''}</p>
      ${state.exNotes[it.ex] ? `<p class="wx__note">Mes réglages : ${esc(state.exNotes[it.ex])}</p>` : ''}
    </div>
    ${canSwap ? `<button class="icon-btn" type="button" data-swap="${i}" aria-label="Remplacer l'exercice">${ICON.swap}</button>` : ''}
  </div>`;
  let body;
  if (it.kind === 'warmup' || it.kind === 'time') {
    const isW = it.kind === 'warmup';
    body = `${isW ? `<div class="seg" role="group" aria-label="Machine">${WARMUP_MACHINES.map(m => `<button type="button" data-machine="${i}" data-m="${m}" aria-pressed="${it.ex === m}">${EX[m].short}</button>`).join('')}</div>` : ''}
      <div class="time-row">
        <div class="stepper">
          <button type="button" data-min="${i}" data-d="-${isW ? 5 : 1}" aria-label="Moins de minutes">−</button>
          <output>${it.minutes} min</output>
          <button type="button" data-min="${i}" data-d="${isW ? 5 : 1}" aria-label="Plus de minutes">+</button>
        </div>
        <button class="btn btn--ghost" type="button" data-run="${i}">${ICON.play} Chrono</button>
        <button class="check" type="button" data-check="${i}" data-k="0" aria-pressed="${!!it.sets[0].done}" aria-label="Marquer comme fait">${ICON.check}</button>
      </div>
      ${isW ? `<p class="small muted">${esc(s.warmNote)}</p>` : it.cooldown ? '<p class="small muted">Allure tranquille pour faire redescendre le cœur.</p>' : ''}`;
  } else {
    const prev = lastSetsFor(it.ex), loaded = !!e.loaded, f = it.kind === 'hold' ? 'sec' : 'reps', sug = suggestFor(it);
    body = `${sug?.up ? `<p class="suggest">${ICON.up}<span>Monte à <strong>${fmtKg(sug.kg)} kg</strong> : tu as réussi toutes tes répétitions à ${fmtKg(sug.from)} kg la dernière fois.</span></p>` : ''}<div class="sets ${loaded ? '' : 'sets--nokg'}" role="table" aria-label="Séries">
      <div class="sets__row sets__row--head" role="row"><span role="columnheader">Série</span><span role="columnheader">Précédent</span>${loaded ? '<span role="columnheader">kg</span>' : ''}<span role="columnheader">${f === 'sec' ? 'Sec' : 'Rép.'}</span><span></span></div>
      ${it.sets.map((st, k) => {
        const pv = prev[k] || prev[prev.length - 1];
        return `<div class="sets__row ${st.done ? 'is-done' : ''}" role="row" id="row-${i}-${k}">
          <span class="sets__n">${k + 1}</span>
          <span class="sets__prev">${pv ? setText(it.ex, pv).replace(' répétitions', '') : '–'}</span>
          ${loaded ? `<input inputmode="decimal" data-f="kg" data-i="${i}" data-k="${k}" value="${esc(st.kg)}" placeholder="${esc(sug ? fmtKg(sug.kg).replace(',', '.') : (pv?.kg ?? ''))}" aria-label="Série ${k + 1}, charge en kg">` : ''}
          <input inputmode="numeric" data-f="${f}" data-i="${i}" data-k="${k}" value="${esc(st[f])}" placeholder="${esc(pv?.[f] ?? targetNum(it))}" aria-label="Série ${k + 1}, ${f === 'sec' ? 'secondes' : 'répétitions'}">
          <button class="check" type="button" data-check="${i}" data-k="${k}" aria-pressed="${!!st.done}" aria-label="Valider la série ${k + 1}">${ICON.check}</button>
        </div>`;
      }).join('')}
    </div>
    <div class="wx__foot">
      <button class="btn btn--quiet btn--sm" type="button" data-addset="${i}">+ Ajouter une série</button>
      ${it.kind === 'hold' ? `<button class="btn btn--ghost btn--sm" type="button" data-hold="${i}">${ICON.play} Chrono ${it.hold} s</button>` : ''}
    </div>`;
  }
  return `<article class="wx ${complete ? 'is-complete' : ''}" id="wx-${i}">${head}${body}</article>`;
}
function rerenderItem(i) {
  const el = $('#wx-' + i);
  if (el) el.outerHTML = itemHTML(state.active.items[i], i);
  updateProgress();
}

function onWorkoutClick(e) {
  const a = state.active; if (!a) return;
  const t = e.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.info) return openExercise(d.info);
  if (d.check !== undefined) return toggleSet(+d.check, +d.k);
  if (d.addset !== undefined) {
    const it = a.items[+d.addset];
    it.sets.push({ kg: '', reps: '', sec: '', done: false });
    save(); return rerenderItem(+d.addset);
  }
  if (d.machine !== undefined) { a.items[+d.machine].ex = d.m; save(); return rerenderItem(+d.machine); }
  if (d.min !== undefined) {
    const it = a.items[+d.min], step = +d.d;
    it.minutes = it.kind === 'warmup' ? Math.min(25, Math.max(15, it.minutes + step)) : Math.min(60, Math.max(1, it.minutes + step));
    save(); return rerenderItem(+d.min);
  }
  if (d.run !== undefined) {
    const i = +d.run, it = a.items[i];
    return startTimer(it.minutes * 60, EX[it.ex].name, () => { if (state.active === a) { it.sets[0].done = true; save(); rerenderItem(i); } });
  }
  if (d.hold !== undefined) {
    const i = +d.hold, it = a.items[i];
    const k = it.sets.findIndex(s => !s.done);
    return startTimer(it.hold, `${EX[it.ex].name}, tiens bon`, () => {
      if (state.active === a && k >= 0 && !it.sets[k].done) { it.sets[k].sec = it.sets[k].sec || String(it.hold); toggleSet(i, k); }
    });
  }
  if (d.swap !== undefined) return openSwap(+d.swap);
}

function toggleSet(i, k) {
  const a = state.active, it = a.items[i], st = it.sets[k];
  st.done = !st.done;
  if (st.done) {
    const row = $(`#row-${i}-${k}`);
    if (row) $$('input', row).forEach(inp => { if (!inp.value && inp.placeholder) { inp.value = inp.placeholder; st[inp.dataset.f] = inp.placeholder; } });
  }
  save();
  if (it.kind === 'warmup' || it.kind === 'time') return rerenderItem(i);
  const row = $(`#row-${i}-${k}`);
  if (row) { row.classList.toggle('is-done', st.done); $('.check', row).setAttribute('aria-pressed', String(st.done)); }
  $('#wx-' + i)?.classList.toggle('is-complete', it.sets.every(x => x.done));
  updateProgress();
  if (st.done && it.rest) {
    const lastSet = it.sets.every(x => x.done);
    const next = a.items.slice(i + 1).find(x => !x.sets.every(s => s.done));
    startTimer(it.rest, lastSet && next ? `Ensuite : ${EX[next.ex].name}` : 'Repos');
    if (lastSet && next) {
      const ni = a.items.indexOf(next);
      setTimeout(() => $('#wx-' + ni)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 700);
    }
  }
}

function updateProgress() {
  const a = state.active; if (!a) return { total: 0, done: 0 };
  const total = a.items.reduce((t, it) => t + it.sets.length, 0);
  const done = a.items.reduce((t, it) => t + it.sets.filter(s => s.done).length, 0);
  const bar = $('#wk-progress'); if (bar) bar.style.width = `${total ? (done / total) * 100 : 0}%`;
  return { total, done };
}

function openSwap(i) {
  const a = state.active, it = a.items[i];
  const key = `${a.code}:${it.slot}`;
  const original = SESSIONS[a.code].items[it.slot].ex;
  const options = [original, ...(EX[original].alt || [])].filter(id => id !== it.ex);
  const body = openSheet(`
    <h2 class="sheet__title">Remplacer ${esc(EX[it.ex].name)}</h2>
    <p class="muted">Machine prise ou absente dans ton club ? Choisis une alternative. Ton choix sera gardé pour les prochaines séances.</p>
    <div class="list">${options.map(id => `<button class="row" type="button" data-pick="${id}">${exThumb(id, 'thumb--sm')}<span><strong>${esc(EX[id].name)}</strong>${id === original ? ' <span class="pill pill--sm">Programme</span>' : ''}<br><span class="muted small">${esc(EX[id].equip)}</span></span></button>`).join('')}</div>
  `, { label: 'Remplacer l\'exercice' });
  $$('[data-pick]', body).forEach(b => b.onclick = () => {
    const id = b.dataset.pick;
    it.ex = id;
    it.sets.forEach(s => { s.kg = ''; s.reps = ''; s.sec = ''; s.done = false; });
    if (id === original) delete state.swaps[key]; else state.swaps[key] = id;
    save(); closeSheet(); rerenderItem(i);
    toast(`Remplacé par ${EX[id].name}.`);
  });
}

function sessionStats(a) {
  const { total, done } = updateProgress();
  return { total, done, minutes: Math.max(1, Math.round((Date.now() - a.start) / 60000)), volume: sessionVolume(a.items) };
}
function detectPRs(items) {
  const prs = [];
  for (const it of items) {
    if (it.kind !== 'reps' && it.kind !== 'hold') continue;
    let cur = null;
    for (const s of it.sets) if (s.done) { const v = setValue(it.ex, s); if (v > 0 && (!cur || v > cur.v)) cur = { v, s }; }
    const prev = bestFor(it.ex);
    if (cur && prev && cur.v > prev.v + 0.01 && !prs.some(p => p.ex === it.ex)) prs.push({ ex: it.ex, text: setText(it.ex, cur.s) });
  }
  return prs;
}

function openFinish() {
  const a = state.active, s = SESSIONS[a.code];
  const st = sessionStats(a), prs = detectPRs(a.items);
  const body = openSheet(`
    <h2 class="sheet__title">${st.done ? 'Bien joué !' : 'Terminer la séance ?'}</h2>
    <div class="stats3 stats3--flat">
      <div class="stat"><p class="stat__value">${st.minutes}</p><p class="stat__label">minutes</p></div>
      <div class="stat"><p class="stat__value">${st.done}/${st.total}</p><p class="stat__label">séries</p></div>
      <div class="stat"><p class="stat__value">${fmtVolume(st.volume)}</p><p class="stat__label">soulevés</p></div>
    </div>
    ${prs.length ? `<div class="prs"><h3 class="sub">${ICON.trophy} ${prs.length > 1 ? 'Nouveaux records' : 'Nouveau record'}</h3>${prs.map(p => `<p><strong>${esc(EX[p.ex].name)}</strong> : ${p.text}</p>`).join('')}</div>` : ''}
    <h3 class="sub">Ressenti de l'effort</h3>
    <div class="rpe" role="group" aria-label="Ressenti de 1 à 10">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-rpe="${i + 1}" aria-pressed="${String(a.rpe) === String(i + 1)}">${i + 1}</button>`).join('')}</div>
    <p class="small muted">1 très facile, 10 effort maximal.</p>
    <label class="field"><span>Notes (douleur, sensations, charges à revoir)</span><textarea id="fin-notes">${esc(a.notes)}</textarea></label>
    <button class="btn btn--block" id="save-session" type="button" style="background:${s.color}">Enregistrer la séance</button>
    <button class="btn btn--quiet btn--block" type="button" data-close>Continuer la séance</button>
  `, { label: 'Fin de séance' });
  $$('[data-rpe]', body).forEach(b => b.onclick = () => {
    a.rpe = b.dataset.rpe; save();
    $$('[data-rpe]', body).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  $('#fin-notes').oninput = e => { a.notes = e.target.value; save(); };
  $('#save-session').onclick = () => {
    if (st.done === 0 && !confirm('Aucune série validée. Enregistrer quand même ?')) return;
    state.history.unshift({
      id: Date.now(), code: a.code, name: s.name, date: new Date(a.start).toISOString(),
      minutes: st.minutes, volume: st.volume, setsDone: st.done, setsTotal: st.total,
      rpe: a.rpe, notes: a.notes, prs: prs.map(p => p.ex), light: !!a.light, checkin: a.checkin || null,
      items: a.items.map(it => ({ ex: it.ex, kind: it.kind, minutes: it.minutes, sets: it.sets.map(x => ({ ...x })) }))
    });
    state.active = null;
    stopTimer(); save(); closeSheet();
    toast(prs.length ? `Séance enregistrée, ${plural(prs.length, 'record')} battu${prs.length > 1 ? 's' : ''} !` : 'Séance enregistrée.');
    render(); window.scrollTo(0, 0);
  };
}

/* ================= Chronos ================= */
let timer = null, timerInt = null, wakeLock = null;
function startTimer(sec, label, onDone) {
  timer = { end: Date.now() + sec * 1000, total: sec, label, onDone };
  $('#timer-label').textContent = label;
  $('#timer').hidden = false;
  $('#timer').classList.remove('is-done');
  clearInterval(timerInt);
  timerInt = setInterval(tick, 250);
  tick();
  if ('wakeLock' in navigator && !wakeLock) navigator.wakeLock.request('screen').then(l => { wakeLock = l; l.addEventListener('release', () => { wakeLock = null; }); }).catch(() => {});
}
function tick() {
  if (!timer) return;
  const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  $('#timer-time').textContent = fmtClock(left);
  $('#timer-progress').style.width = `${100 - (left / timer.total) * 100}%`;
  if (left <= 0) {
    clearInterval(timerInt);
    $('#timer').classList.add('is-done');
    $('#timer-label').textContent = 'Terminé, c\'est reparti';
    if (state.profile.sound) beep();
    if (state.profile.vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    const cb = timer.onDone; timer = null;
    if (cb) cb();
    setTimeout(() => { if (!timer) $('#timer').hidden = true; }, 3500);
  }
}
function stopTimer() {
  clearInterval(timerInt); timer = null; $('#timer').hidden = true;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
$('#timer-minus').onclick = () => { if (timer) { timer.end -= 15000; tick(); } };
$('#timer-plus').onclick = () => { if (timer) { timer.end += 15000; timer.total += 15; tick(); } };
$('#timer-skip').onclick = stopTimer;

let audioCtx;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, .25].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(.25, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + t + .2);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .2);
    });
  } catch (e) { /* son indisponible */ }
}
function tickElapsed() {
  const el = $('#elapsed');
  if (el && state.active) el.textContent = fmtClock(Math.floor((Date.now() - state.active.start) / 1000)).replace(/^(\d+):/, (m, h) => h >= 60 ? `${Math.floor(h / 60)}:${pad(h % 60)}:` : m);
}
setInterval(tickElapsed, 1000);

/* ================= Programme ================= */
function renderProgram() {
  const el = $('#view-program'), p = state.profile;
  el.innerHTML = `
    <h1 class="page-title">Programme</h1>
    <p>Trois séances par semaine à Basic-Fit, plus une séance de récupération après les matchs. Chaque séance dure entre 50 et 70 minutes, dont ${p.warmupMin} minutes d'échauffement cardio.</p>
    <p class="callout">Cycles de 4 semaines : 3 semaines où tu augmentes les charges, puis une semaine allégée. Quand tu réussis toutes les répétitions proprement, ajoute 2,5 à 5 % de charge la fois suivante.</p>
    ${Object.entries(SESSIONS).map(([k, s]) => `
      <article class="panel prog" style="--sess:${s.color}">
        <div class="panel__head"><h2>Séance ${k}</h2><span class="muted small">${estimateMinutes(s)} min</span></div>
        <p><strong>${esc(s.name)}.</strong> ${esc(s.goal)}</p>
        <div class="list">
          <button class="row" type="button" data-ex="${warmupFor(k)}">${exThumb(warmupFor(k), 'thumb--sm')}<span><strong>Échauffement : ${esc(EX[warmupFor(k)].name)}</strong><br><span class="muted small">${p.warmupMin} min</span></span></button>
          ${fitSession(k).plan.map(it => { const id = state.swaps[`${k}:${it.slot}`] || it.ex; return `<button class="row" type="button" data-ex="${id}">${exThumb(id, 'thumb--sm')}<span><strong>${esc(EX[id].name)}</strong><br><span class="muted small">${targetText(it)}</span></span></button>`; }).join('')}
          ${fitSession(k).cool ? `<button class="row" type="button" data-ex="${s.cooldown.ex}">${exThumb(s.cooldown.ex, 'thumb--sm')}<span><strong>Retour au calme : ${esc(EX[s.cooldown.ex].name)}</strong><br><span class="muted small">${fitSession(k).cool} min</span></span></button>` : ''}
        </div>
        <button class="btn btn--block" style="background:${s.color}" data-start="${k}" type="button">${ICON.play} Commencer la séance ${k}</button>
      </article>`).join('')}
    <p class="muted small">Ce programme ne remplace pas l'avis d'un médecin ou d'un kiné, surtout en cas de douleur ou de blessure.</p>`;
  $$('[data-ex]', el).forEach(b => b.onclick = () => openExercise(b.dataset.ex));
  $$('[data-start]', el).forEach(b => b.onclick = () => startSession(b.dataset.start));
}

/* ================= Bibliothèque ================= */
let libQuery = '', libZone = 'Tous';
function renderLibrary() {
  const el = $('#view-library');
  el.innerHTML = `
    <h1 class="page-title">Exercices</h1>
    <label class="search">${ICON.search}<input type="search" id="lib-q" placeholder="Exercice, machine ou muscle" value="${esc(libQuery)}" aria-label="Rechercher"></label>
    <div class="chips chips--scroll" role="group" aria-label="Zone de la salle">${['Tous', ...ZONES].map(z => `<button class="chip" type="button" data-zone="${z}" aria-pressed="${z === libZone}">${z}</button>`).join('')}</div>
    <div id="lib-grid" class="lib-grid"></div>`;
  const draw = () => {
    const q = libQuery.trim().toLowerCase();
    const list = Object.entries(EX).filter(([, e]) =>
      (libZone === 'Tous' || e.zone === libZone) &&
      (!q || `${e.name} ${e.equip} ${muscleNames([...(e.target?.p || []), ...(e.target?.s || [])]).join(' ')}`.toLowerCase().includes(q)));
    $('#lib-grid').innerHTML = list.length ? list.map(([id, e]) => `
      <button class="lib-card" type="button" data-ex="${id}">
        ${exThumb(id)}
        <strong>${esc(e.name)}</strong>
        <span class="muted small">${esc(primaryText(e))}</span>
      </button>`).join('') : '<p class="empty">Aucun exercice ne correspond. Essaie un autre mot, par exemple « poulie » ou « fessiers ».</p>';
    $$('[data-ex]', $('#lib-grid')).forEach(b => b.onclick = () => openExercise(b.dataset.ex));
  };
  draw();
  $('#lib-q').oninput = e => { libQuery = e.target.value; draw(); };
  $$('[data-zone]', el).forEach(b => b.onclick = () => {
    libZone = b.dataset.zone;
    $$('[data-zone]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    draw();
  });
}

/* ================= Progrès ================= */
let progTab = 'corps', chartMetric = 'weight', calOffset = 0;

function lineChart(points, unit, label) {
  if (points.length < 2) return `<p class="empty">Il faut au moins deux valeurs pour tracer la courbe.</p>`;
  const W = 340, H = 170, P = { l: 38, r: 12, t: 12, b: 24 };
  const xs = points.map(p => +new Date(p.date)), ys = points.map(p => p.v);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + 1;
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const py = (y1 - y0) * 0.2 || 1; y0 -= py; y1 += py;
  const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r);
  const Y = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join('');
  const area = `${path}L${X(xs[xs.length - 1]).toFixed(1)},${H - P.b}L${X(xs[0]).toFixed(1)},${H - P.b}Z`;
  const grid = [0, .5, 1].map(f => { const v = y0 + (y1 - y0) * f; return `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${P.l - 6}" y="${Y(v) + 3}" text-anchor="end">${fmtNum(+v.toFixed(1))}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution : ${esc(label)}">
    ${grid}<path class="area" d="${area}"/><path class="curve" d="${path}"/>
    ${points.map((p, i) => `<circle class="dot" cx="${X(xs[i])}" cy="${Y(ys[i])}" r="3.5"><title>${fmtDate(p.date)} : ${fmtNum(+ys[i].toFixed(1))} ${unit}</title></circle>`).join('')}
    <text x="${P.l}" y="${H - 6}">${fmtDate(points[0].date)}</text>
    <text x="${W - P.r}" y="${H - 6}" text-anchor="end">${fmtDate(points[points.length - 1].date)}</text>
  </svg>`;
}
const measuresSorted = () => [...state.measures].sort((a, b) => new Date(a.date) - new Date(b.date));
const seriesOf = key => measuresSorted().filter(m => m[key] != null).map(m => ({ date: m.date, v: m[key] }));

function bmi(m) {
  const h = num(m.height) ?? num(state.profile.height);
  return m.weight == null || !h ? null : m.weight / ((h / 100) ** 2);
}
const BMI_ZONES = [
  { label: 'Insuffisance pondérale', from: 15, to: 18.5 },
  { label: 'Corpulence normale', from: 18.5, to: 25 },
  { label: 'Surpoids', from: 25, to: 30 },
  { label: 'Obésité', from: 30, to: 40 }
];
function bmiZone(b) { return b < 18.5 ? 0 : b < 25 ? 1 : b < 30 ? 2 : 3; }
function bmiPos(b) {
  const z = BMI_ZONES[bmiZone(b)], i = bmiZone(b);
  const t = Math.max(0, Math.min(1, (b - z.from) / (z.to - z.from)));
  return Math.max(2, Math.min(98, (i + t) * 25));
}
function bmiCard(b) {
  if (b == null) return `<section class="panel bmi">
      <div class="panel__head"><h2>Mon IMC</h2><button class="icon-btn" type="button" id="bmi-info" aria-label="Comprendre l'IMC">${ICON.arrow}</button></div>
      <p class="muted">Ajoute ton poids et ta taille pour calculer ton IMC.</p></section>`;
  const z = bmiZone(b);
  return `<section class="panel bmi">
    <div class="panel__head"><h2>Mon IMC</h2><button class="icon-btn" type="button" id="bmi-info" aria-label="Comprendre l'IMC">${ICON.arrow}</button></div>
    <p class="bmi__value">${fmtNum(+b.toFixed(1))}</p>
    <p>D'après ton poids et ta taille</p>
    <div class="bmi__scale" role="img" aria-label="IMC ${fmtNum(+b.toFixed(1))}, ${BMI_ZONES[z].label.toLowerCase()}">
      <span class="bmi__tick" style="left:25%"></span><span class="bmi__tick" style="left:50%"></span><span class="bmi__tick" style="left:75%"></span>
      <span class="bmi__dot" style="left:${bmiPos(b)}%"></span>
    </div>
    <div class="bmi__labels">${BMI_ZONES.map((x, i) => `<span class="${i === z ? 'on' : ''}">${x.label}</span>`).join('')}</div>
  </section>`;
}
function openBmiInfo() {
  openSheet(`
    <h2 class="sheet__title">Comprendre l'IMC</h2>
    <p>L'indice de masse corporelle se calcule ainsi : poids en kg divisé par la taille en mètres au carré. Par exemple, 82 kg pour 1,82 m donne 82 ÷ (1,82 × 1,82) = 24,8.</p>
    <div class="list list--plain">${BMI_ZONES.map((x, i) => `<p class="bmi-row"><strong>${x.label}</strong><span class="muted">${i === 0 ? 'moins de 18,5' : i === 3 ? '30 et plus' : `${fmtNum(x.from)} à ${fmtNum(+(x.to - 0.1).toFixed(1))}`}</span></p>`).join('')}</div>
    <p class="callout">L'IMC ne distingue pas le muscle de la graisse. Chez un sportif musclé, il surestime souvent la corpulence : suis aussi ta masse grasse et ton tour de taille.</p>`, { label: "Comprendre l'IMC" });
}
function deltaHTML(key) {
  const s = seriesOf(key);
  if (s.length < 2) return '';
  const d = s[s.length - 1].v - s[0].v;
  if (Math.abs(d) < 0.05) return '<span class="muted">stable</span>';
  const good = key === 'muscle' ? d > 0 : d < 0;
  return `<span class="${good ? 'delta-good' : 'delta-bad'}">${d > 0 ? '+' : '−'}${fmtNum(+Math.abs(d).toFixed(1))}</span> depuis le début`;
}
function goalHTML(key, goal, unit, label) {
  const g = num(goal), s = seriesOf(key);
  if (g == null || !s.length) return '';
  const first = s[0].v, cur = s[s.length - 1].v;
  const span = first - g;
  const pct = span === 0 ? 100 : Math.max(0, Math.min(100, ((first - cur) / span) * 100));
  const left = Math.abs(cur - g);
  return `<div class="goal">
    <div class="panel__head"><strong>${label} : objectif ${fmtNum(g)} ${unit}</strong><span class="muted small">${left < 0.05 ? 'atteint' : `encore ${fmtNum(+left.toFixed(1))} ${unit}`}</span></div>
    <div class="meter" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
  </div>`;
}

function renderProgress() {
  const el = $('#view-progress');
  el.innerHTML = `
    <h1 class="page-title">Progrès</h1>
    <div class="seg seg--wide" role="tablist">${[['corps', 'Corps'], ['records', 'Records'], ['historique', 'Historique']].map(([k, l]) =>
      `<button type="button" role="tab" data-ptab="${k}" aria-selected="${k === progTab}" aria-pressed="${k === progTab}">${l}</button>`).join('')}</div>
    <div id="prog-body"></div>`;
  $$('[data-ptab]', el).forEach(b => b.onclick = () => { progTab = b.dataset.ptab; renderProgress(); });
  ({ corps: renderBody, records: renderRecords, historique: renderHistory })[progTab]($('#prog-body'));
}

function renderBody(el) {
  const desc = [...state.measures].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastW = desc.find(m => m.weight != null), lastF = desc.find(m => m.fat != null);
  const b = lastW ? bmi(lastW) : null, p = state.profile;
  const goals = goalHTML('weight', p.goalWeight, 'kg', 'Poids') + goalHTML('fat', p.goalFat, '%', 'Masse grasse');
  el.innerHTML = `
    ${bmiCard(b)}
    <section class="stats2">
      <div class="stat"><p class="stat__value">${lastW ? fmtNum(lastW.weight) : '–'}</p><p class="stat__label">kg<br>${deltaHTML('weight')}</p></div>
      <div class="stat"><p class="stat__value">${lastF ? fmtNum(lastF.fat) : '–'}</p><p class="stat__label">% masse grasse<br>${deltaHTML('fat')}</p></div>
    </section>
    <button class="btn btn--block" type="button" id="add-measure">Ajouter une mesure</button>
    ${goals ? `<section class="panel">${goals}</section>` : `<p class="muted small">Fixe un objectif de poids ou de masse grasse dans Profil pour suivre ta progression.</p>`}
    <section class="panel">
      <h2>Évolution</h2>
      <div class="chips chips--scroll" role="group" aria-label="Valeur affichée">${Object.entries(METRICS).map(([k, m]) => `<button class="chip" type="button" data-metric="${k}" aria-pressed="${k === chartMetric}">${m.label}</button>`).join('')}</div>
      <div id="chart">${lineChart(seriesOf(chartMetric), METRICS[chartMetric].unit, METRICS[chartMetric].label)}</div>
    </section>
    <section class="panel">
      <h2>Mesures</h2>
      ${desc.length ? desc.map(m => `
        <div class="measure">
          <div>
            <p class="measure__date">${fmtDateTime(m.date)}</p>
            <div class="measure__values">${Object.entries(METRICS).filter(([k]) => m[k] != null).map(([k, meta]) =>
              `<span><b>${fmtNum(m[k])}${meta.unit === '%' ? '%' : ' kg'}</b> <span>${meta.label}</span></span>`).join('')}</div>
          </div>
          <button class="icon-btn" type="button" data-del="${m.id}" aria-label="Supprimer la mesure du ${fmtDateTime(m.date)}">${ICON.trash}</button>
        </div>`).join('') : '<p class="empty">Aucune mesure pour l\'instant. Pèse-toi le matin à jeun, dans les mêmes conditions, pour comparer d\'une semaine à l\'autre.</p>'}
    </section>
`;

  $('#add-measure').onclick = openMeasureForm;
  $('#bmi-info')?.addEventListener('click', openBmiInfo);
  $$('[data-metric]', el).forEach(btn => btn.onclick = () => {
    chartMetric = btn.dataset.metric;
    $$('[data-metric]', el).forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    $('#chart').innerHTML = lineChart(seriesOf(chartMetric), METRICS[chartMetric].unit, METRICS[chartMetric].label);
  });
  $$('[data-del]', el).forEach(btn => btn.onclick = () => {
    if (!confirm('Supprimer cette mesure ?')) return;
    state.measures = state.measures.filter(m => String(m.id) !== btn.dataset.del);
    save(); renderBody(el);
  });
}

function openMeasureForm() {
  const body = openSheet(`
    <h2 class="sheet__title">Nouvelle mesure</h2>
    <form id="measure-form" class="form">
      <label class="field"><span>Date et heure</span><input type="datetime-local" name="date" value="${localInput(new Date())}" required></label>
      <div class="grid-2">
        <label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" placeholder="82,5"></label>
        <label class="field"><span>Taille (cm)</span><input name="height" inputmode="decimal" value="${esc(state.profile.height)}" placeholder="188"></label>
        <label class="field"><span>Masse grasse (%)</span><input name="fat" inputmode="decimal" placeholder="22,0"></label>
        <label class="field"><span>Masse musculaire (%)</span><input name="muscle" inputmode="decimal" placeholder="74,0"></label>
        <label class="field"><span>Masse osseuse (%)</span><input name="bone" inputmode="decimal" placeholder="4,0"></label>
        <label class="field"><span>Eau corporelle (%)</span><input name="water" inputmode="decimal" placeholder="51,3"></label>
      </div>
      <button class="btn btn--block" type="submit">Enregistrer la mesure</button>
    </form>`, { label: 'Nouvelle mesure' });
  $('#measure-form', body).onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const entry = { id: Date.now(), date: new Date(f.get('date')).toISOString() };
    ['weight', 'height', 'fat', 'muscle', 'bone', 'water'].forEach(k => { entry[k] = num(f.get(k)); });
    if (['weight', 'fat', 'muscle', 'bone', 'water'].every(k => entry[k] == null)) { toast('Renseigne au moins une valeur : poids ou composition.'); return; }
    if (entry.height) state.profile.height = entry.height;
    state.measures.push(entry);
    save(); closeSheet(); toast('Mesure enregistrée.'); renderProgress();
  };
}

function renderRecords(el) {
  const rows = Object.keys(EX).map(id => ({ id, best: bestFor(id) })).filter(r => r.best)
    .sort((a, b) => new Date(b.best.date) - new Date(a.best.date));
  el.innerHTML = rows.length ? `
    <p class="muted">Ta meilleure performance sur chaque exercice. Pour les charges, le classement utilise le maximum estimé sur une répétition.</p>
    <div class="list list--panel">${rows.map(r => `
      <button class="row" type="button" data-rec="${r.id}">${exThumb(r.id, 'thumb--sm')}
        <span class="row__main"><strong>${esc(EX[r.id].name)}</strong><br><span class="muted small">${fmtDate(r.best.date)}</span></span>
        <span class="row__value">${setText(r.id, r.best.s)}</span>
      </button>`).join('')}</div>`
    : '<p class="empty">Tes records apparaîtront ici après tes premières séances. Remplis la charge et les répétitions de chaque série pour les suivre.</p>';
  $$('[data-rec]', el).forEach(b => b.onclick = () => openRecord(b.dataset.rec));
}
function openRecord(id) {
  const e = EX[id];
  const pts = [];
  [...state.history].reverse().forEach(h => (h.items || []).forEach(it => {
    if (it.ex !== id) return;
    const v = Math.max(0, ...it.sets.filter(s => s.done).map(s => setValue(id, s)));
    if (v > 0) pts.push({ date: h.date, v: +v.toFixed(1), sets: it.sets.filter(s => s.done) });
  }));
  const unit = e.type === 'hold' ? 's' : e.loaded ? 'kg' : 'rép.';
  const best = bestFor(id);
  const body = openSheet(`
    <h2 class="sheet__title">${esc(e.name)}</h2>
    <p class="record">${ICON.trophy}<span>Record : <strong>${setText(id, best.s)}</strong>, le ${fmtDate(best.date)}</span></p>
    <p class="muted small">${e.type === 'hold' ? 'Meilleure tenue' : e.loaded ? 'Maximum estimé sur une répétition' : 'Meilleure série'} à chaque séance :</p>
    ${lineChart(pts, unit, e.name)}
    <h3 class="sub">Dernières séances</h3>
    ${pts.slice(-6).reverse().map(p => `<p><strong>${fmtDate(p.date)}</strong> <span class="muted">${p.sets.map(s => setText(id, s)).join(', ')}</span></p>`).join('')}
    <button class="btn btn--ghost btn--block" type="button" id="see-ex">Voir comment faire</button>`, { label: e.name });
  $('#see-ex', body).onclick = () => openExercise(id);
}

function renderHistory(el) {
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth() + calOffset, 1);
  const y = ref.getFullYear(), m = ref.getMonth();
  const monthSessions = sessionsBetween(new Date(y, m, 1), new Date(y, m + 1, 1));
  const byDay = {};
  monthSessions.forEach(h => { const d = new Date(h.date).getDate(); (byDay[d] = byDay[d] || []).push(h); });
  const offset = weekday(new Date(y, m, 1)), days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('<span class="cal__cell"></span>');
  for (let d = 1; d <= days; d++) {
    const list = byDay[d] || [];
    const isToday = calOffset === 0 && d === now.getDate();
    cells.push(`<span class="cal__cell ${isToday ? 'is-today' : ''} ${list.length ? 'has' : ''}" ${list[0] ? `style="--sess:${SESSIONS[list[0].code]?.color}"` : ''}>${d}</span>`);
  }
  el.innerHTML = `
    <section class="panel">
      <div class="cal__head">
        <button class="icon-btn" type="button" data-cal="-1" aria-label="Mois précédent">${ICON.left}</button>
        <h2>${MONTHS[m]} ${y}</h2>
        <button class="icon-btn" type="button" data-cal="1" aria-label="Mois suivant" ${calOffset >= 0 ? 'disabled' : ''}>${ICON.right}</button>
      </div>
      <div class="cal">${DAYS_SHORT.map(d => `<span class="cal__dow">${d}</span>`).join('')}${cells.join('')}</div>
      <p class="muted small">${plural(monthSessions.length, 'séance')}, ${monthSessions.reduce((t, h) => t + h.minutes, 0)} min, ${fmtVolume(monthSessions.reduce((t, h) => t + (h.volume || 0), 0))} soulevés.</p>
    </section>
    <section class="panel">
      <h2>Séances</h2>
      ${monthSessions.length ? `<div class="list">${monthSessions.map(h => `
        <button class="row" type="button" data-session="${h.id}">
          <span class="tag" style="--sess:${SESSIONS[h.code]?.color}">${esc(h.code)}</span>
          <span class="row__main"><strong>${esc(h.name)}</strong><br><span class="muted small">${fmtDateTime(h.date)}, ${h.minutes} min${h.rpe ? `, effort ${esc(h.rpe)}/10` : ''}</span></span>
          ${h.prs?.length ? `<span class="row__value">${ICON.trophy}${h.prs.length}</span>` : ''}
        </button>`).join('')}</div>` : '<p class="empty">Aucune séance ce mois-ci.</p>'}
    </section>`;
  $$('[data-cal]', el).forEach(b => b.onclick = () => { calOffset = Math.min(0, calOffset + +b.dataset.cal); renderHistory(el); });
  $$('[data-session]', el).forEach(b => b.onclick = () => openSession(b.dataset.session));
}

function openSession(id) {
  const h = state.history.find(x => String(x.id) === String(id));
  if (!h) return;
  const body = openSheet(`
    <h2 class="sheet__title">${esc(h.name)}</h2>
    <p class="muted">${fmtDateTime(h.date)}</p>
    <div class="stats3 stats3--flat">
      <div class="stat"><p class="stat__value">${h.minutes}</p><p class="stat__label">minutes</p></div>
      <div class="stat"><p class="stat__value">${h.setsDone}/${h.setsTotal}</p><p class="stat__label">séries</p></div>
      <div class="stat"><p class="stat__value">${fmtVolume(h.volume || 0)}</p><p class="stat__label">soulevés</p></div>
    </div>
    ${(h.items || []).map(it => {
      const done = (it.sets || []).filter(s => s.done);
      if (!done.length) return '';
      const isPR = h.prs?.includes(it.ex);
      const detail = it.kind === 'warmup' || it.kind === 'time' ? `${it.minutes} min` : done.map(x => setText(it.ex, x)).join(', ');
      return `<p class="hist-ex"><strong>${esc(EX[it.ex]?.name || it.ex)}</strong>${isPR ? ` <span class="pill pill--sm">${ICON.trophy} record</span>` : ''}<br><span class="muted">${detail}</span></p>`;
    }).join('')}
    ${h.checkin ? `<p class="muted small">Avant la séance : énergie ${esc(h.checkin.energie).toLowerCase()}, courbatures ${esc(h.checkin.courbatures).toLowerCase()}, douleur ${esc(h.checkin.douleur).toLowerCase()}${h.light ? ', version allégée' : ''}.</p>` : ''}
    ${h.rpe ? `<p>Ressenti : <strong>${esc(h.rpe)}/10</strong></p>` : ''}
    ${h.notes ? `<p class="callout">${esc(h.notes)}</p>` : ''}
    <button class="btn btn--danger btn--block" type="button" id="del-session">Supprimer cette séance</button>`, { label: h.name });
  $('#del-session', body).onclick = () => {
    if (!confirm('Supprimer cette séance de l\'historique ?')) return;
    state.history = state.history.filter(x => x !== h);
    save(); closeSheet(); render();
  };
}

/* ================= Profil ================= */
function renderProfile() {
  const el = $('#view-profile'), p = state.profile;
  el.innerHTML = `
    <h1 class="page-title">Profil</h1>
    <section class="panel form">
      <label class="field"><span>Prénom</span><input id="p-name" value="${esc(p.name)}" autocomplete="given-name"></label>
      <label class="field"><span>Taille (cm)</span><input id="p-height" inputmode="decimal" value="${esc(p.height)}" placeholder="188"></label>
    </section>

    <section class="panel form">
      <h2>Semaine type</h2>
      <p class="muted small">Jours de salle : trois conseillés, avec un jour de repos entre deux séances.</p>
      <div class="days" role="group" aria-label="Jours de salle">${DAYS.map((d, i) => `<button type="button" data-day="${i}" aria-pressed="${p.gymDays.includes(i)}" aria-label="${d}">${DAYS_SHORT[i]}</button>`).join('')}</div>
      <label class="field"><span>Jour de match habituel</span>
        <select id="p-match"><option value="" ${p.matchDay == null ? 'selected' : ''}>Pas de jour fixe</option>${DAYS.map((d, i) => `<option value="${i}" ${p.matchDay === i ? 'selected' : ''}>${d}</option>`).join('')}</select>
      </label>
      <p class="muted small" id="plan-preview"></p>
      <label class="field"><span>Début du cycle de 4 semaines</span><input id="p-cycle" type="date" value="${esc(p.cycleStart)}"></label>
      <p class="muted small">Semaine ${cycleWeek()} sur 4${isDeload() ? ', semaine allégée' : ''}.</p>
    </section>

    <section class="panel form">
      <h2>Échauffement</h2>
      <div class="field"><span>Durée</span>
        <div class="seg" role="group" aria-label="Durée de l'échauffement">${[15, 20, 25].map(m => `<button type="button" data-wmin="${m}" aria-pressed="${p.warmupMin === m}">${m} min</button>`).join('')}</div>
      </div>
      <label class="field"><span>Machine</span>
        <select id="p-wmachine"><option value="auto" ${p.warmupMachine === 'auto' ? 'selected' : ''}>Selon la séance (conseillé)</option>${WARMUP_MACHINES.map(m => `<option value="${m}" ${p.warmupMachine === m ? 'selected' : ''}>${esc(EX[m].name)}</option>`).join('')}</select>
      </label>
      <p class="muted small">Selon la séance : vélo avant les jambes, tapis avant les épaules, rameur avant la séance puissance et gainage. Le reste de la séance s'ajuste pour que le total reste entre 50 et 70 minutes.</p>
    </section>

    <section class="panel form">
      <h2>Objectifs</h2>
      <div class="grid-2">
        <label class="field"><span>Poids visé (kg)</span><input id="p-gw" inputmode="decimal" value="${esc(p.goalWeight)}" placeholder="80"></label>
        <label class="field"><span>Masse grasse visée (%)</span><input id="p-gf" inputmode="decimal" value="${esc(p.goalFat)}" placeholder="18"></label>
      </div>
    </section>

    <section class="panel form">
      <h2>Apparence</h2>
      <div class="seg" role="group" aria-label="Thème">${[['system', 'Système'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) =>
        `<button type="button" data-theme-choice="${k}" aria-pressed="${p.theme === k}">${l}</button>`).join('')}</div>
      <p class="muted small">Système suit le réglage clair ou sombre de ton téléphone.</p>
    </section>

    <section class="panel form">
      <h2>Chrono de repos</h2>
      <label class="switch"><input type="checkbox" id="p-sound" ${p.sound ? 'checked' : ''}><span>Bip à la fin du repos</span></label>
      <label class="switch"><input type="checkbox" id="p-vib" ${p.vibrate ? 'checked' : ''}><span>Vibration (Android)</span></label>
    </section>

    <section class="panel form">
      <h2>Sauvegarde</h2>
      <p class="muted small">Tes données restent sur ce téléphone. Exporte-les de temps en temps pour ne rien perdre ou les passer sur un autre appareil.</p>
      <div class="btn-row">
        <button class="btn" id="export" type="button">Exporter</button>
        <label class="btn btn--ghost">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
      </div>
      <button class="btn btn--danger" id="reset" type="button">Tout effacer</button>
    </section>
    <p class="muted small">VolleyFit version ${APP_VERSION}</p>`;

  const preview = () => {
    const plan = planWeek();
    $('#plan-preview').textContent = 'Planning : ' + plan.map((c, i) => c ? `${DAYS[i].toLowerCase()} ${c === 'M' ? 'match' : c}` : null).filter(Boolean).join(', ') + '.';
  };
  preview();
  $('#p-name').oninput = e => { p.name = e.target.value.trim(); save(); };
  $('#p-height').oninput = e => { p.height = num(e.target.value) ?? ''; save(); };
  $('#p-match').onchange = e => { p.matchDay = e.target.value === '' ? null : +e.target.value; save(); preview(); };
  $('#p-cycle').onchange = e => { if (e.target.value) { p.cycleStart = e.target.value; save(); renderProfile(); } };
  $('#p-wmachine').onchange = e => { p.warmupMachine = e.target.value; save(); };
  $('#p-gw').oninput = e => { p.goalWeight = num(e.target.value) ?? ''; save(); };
  $('#p-gf').oninput = e => { p.goalFat = num(e.target.value) ?? ''; save(); };
  $('#p-sound').onchange = e => { p.sound = e.target.checked; save(); };
  $('#p-vib').onchange = e => { p.vibrate = e.target.checked; save(); };
  $$('[data-theme-choice]', el).forEach(b => b.onclick = () => {
    p.theme = b.dataset.themeChoice; save(); applyTheme();
    $$('[data-theme-choice]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  $$('[data-wmin]', el).forEach(b => b.onclick = () => {
    p.warmupMin = +b.dataset.wmin; save();
    $$('[data-wmin]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  $$('[data-day]', el).forEach(b => b.onclick = () => {
    const d = +b.dataset.day;
    p.gymDays = p.gymDays.includes(d) ? p.gymDays.filter(x => x !== d) : [...p.gymDays, d];
    b.setAttribute('aria-pressed', String(p.gymDays.includes(d)));
    save(); preview();
  });
  $('#export').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `volleyfit-sauvegarde-${isoDate(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#import').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = JSON.parse(r.result);
        if (!s || typeof s !== 'object' || !s.profile) throw new Error();
        state = hydrate(s); save(); applyTheme(); toast('Données importées.'); renderProfile();
      } catch { toast('Fichier non reconnu : choisis un export VolleyFit (.json).'); }
    };
    r.readAsText(file);
  };
  $('#reset').onclick = () => {
    if (!confirm('Effacer toutes tes mesures, séances et réglages ? Exporte-les avant si besoin.')) return;
    state = defaults(); save(); applyTheme(); toast('Données effacées.'); renderProfile();
  };
}

/* ================= Divers ================= */
let toastT;
function toast(msg, { action, onAction, duration = 2800 } = {}) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="toast__btn">${esc(action)}</button>` : ''}`;
  t.hidden = false;
  if (action) $('.toast__btn', t).onclick = () => { t.hidden = true; clearTimeout(toastT); onAction(); };
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, duration);
}

const APP_VERSION = '10';
if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai')) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then(reg => { reg.update(); document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update(); }); })
    .catch(() => {});
}

render();
