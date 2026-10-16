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

const DAYS = window.I18N?.days || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = window.I18N?.daysShort || ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = window.I18N?.months || ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ZONES = ['Machines', 'Smith machine', 'Poulie', 'Maison', 'Cardio', 'Étirements'];
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
    goalWeight: '', goalFat: '', sound: true, iosTimer: 'off', theme: 'system', variety: 'cycle', level: 'debutant', lang: 'fr'
  },
  measures: [], history: [], swaps: {}, exNotes: {}, active: null,
  nutrition: { age: '', sex: '', objective: 'auto' }, food: {}, picks: {}, rerolls: {}, idV: 14
});

function hydrate(s) {
  const d = defaults();
  const out = { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, swaps: {}, exNotes: s.exNotes || {}, nutrition: { ...d.nutrition, ...(s.nutrition || {}) }, food: s.food || {}, picks: s.picks || {}, rerolls: s.rerolls || {} };
  delete out.profile.goal;
  if (!s.idV) { out.nutrition.sex = ''; out.idV = 14; }
  if ((out.idV || 0) < 15) { out.profile.sound = false; out.profile.vibrate = false; out.idV = 15; }
  if ((out.idV || 0) < 16) { out.profile.sound = true; out.idV = 16; }
  if (!['off', 'button', 'auto'].includes(out.profile.iosTimer)) out.profile.iosTimer = 'off';
  if (!['h', 'f'].includes(out.nutrition.sex)) out.nutrition.sex = '';
  if (!['cycle', 'seance', 'fixe'].includes(out.profile.variety)) out.profile.variety = 'cycle';
  if (!LEVELS[out.profile.level]) out.profile.level = 'debutant';
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

/* ================= Choix des exercices : aléatoire mais maîtrisé =================
   Chaque famille de mouvement garde sa place dans la séance. L'exercice est tiré
   parmi les variantes de la famille, de façon reproductible (même tirage tant que
   le cycle ne change pas), sans reprendre le précédent ni doubler dans la semaine. */
const VARIETY = {
  cycle: { label: 'Chaque cycle', desc: 'Nouveaux exercices toutes les 4 semaines : le temps de progresser sur les charges.' },
  seance: { label: 'Chaque séance', desc: 'Nouveaux exercices à chaque fois que tu refais une séance.' },
  fixe: { label: 'Jamais', desc: 'Toujours les mêmes exercices.' }
};
function hashStr(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function cycleIndex() {
  const days = Math.round((new Date(isoDate(new Date()) + 'T00:00') - new Date(state.profile.cycleStart + 'T00:00')) / 864e5);
  return Number.isFinite(days) && days > 0 ? Math.floor(days / 28) : 0;
}
function seedBase(code) {
  const v = state.profile.variety;
  if (v === 'fixe') return 0;
  if (v === 'seance') return state.history.filter(h => h.code === code).length;
  return cycleIndex();
}
const seedFor = code => `${seedBase(code)}.${state.rerolls[`${code}:${seedBase(code)}`] || 0}`;
const swapKey = (code, slot) => `${code}:${slot}:${seedFor(code)}`;
const poolOf = it => it.pool || [it.ex];

function resolveSessions() {
  const used = new Set(), chosen = {};
  const order = [];
  for (const [code, t] of Object.entries(TEMPLATE)) if (!t.fixed) t.items.forEach((it, slot) => order.push({ code, slot, it }));
  order.sort((a, b) => poolOf(a.it).length - poolOf(b.it).length);
  for (const { code, slot, it } of order) {
    const key = `${code}:${slot}`, seed = seedFor(code), pool = poolOf(it), mem = state.picks[key];
    let ex;
    if (mem && mem.seed === seed && pool.includes(mem.ex) && !used.has(mem.ex)) ex = mem.ex;
    else {
      const free = pool.filter(e => !used.has(e));
      const fresh = free.filter(e => e !== mem?.ex);
      const list = fresh.length ? fresh : free.length ? free : pool;
      ex = list[hashStr(key + '|' + seed) % list.length];
      state.picks[key] = { seed, ex };
    }
    used.add(ex); chosen[key] = ex;
  }
  for (const k of Object.keys(SESSIONS)) delete SESSIONS[k];
  for (const [code, t] of Object.entries(TEMPLATE)) {
    SESSIONS[code] = { ...t, items: t.items.map((it, slot) => {
      const ex = t.fixed ? it.ex : chosen[`${code}:${slot}`];
      const out = { ...it, ex, reps: it.repsBy?.[ex] || it.reps };
      delete out.pool; delete out.repsBy;
      return out;
    }) };
  }
}
function rerollSession(code) {
  const k = `${code}:${seedBase(code)}`;
  state.rerolls[k] = (state.rerolls[k] || 0) + 1;
  resolveSessions(); save();
  toast(`Nouveaux exercices pour la séance ${code}.`);
  render();
}
resolveSessions();

/* ================= Apparence ================= */
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = state.profile.theme, root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#F4F4F2';
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
const isHome = code => !!TEMPLATE[code]?.home;
const warmMinFor = code => TEMPLATE[code]?.warmupMin || state.profile.warmupMin;
const warmupFor = code => isHome(code) ? SESSIONS[code].warmup : state.profile.warmupMachine !== 'auto' ? state.profile.warmupMachine : SESSIONS[code].warmup;

/* Durée : chaque séance est ajustée pour durer entre 50 et 70 minutes, échauffement compris. */
const SESSION_MIN = 50, SESSION_MAX = 70, SESSION_TARGET = 60, TRANSITION = 60;
function itemSeconds(it, n) {
  if (it.duration) return it.duration * 60 + TRANSITION;
  const side = /par (jambe|côté|bras)/.test(it.reps || '') || it.perSide;
  const work = it.hold ? it.hold * (it.perSide ? 2 : 1) + 10 : (side ? 70 : 40);
  return n * (work + it.rest) + TRANSITION;
}
function fitSession(code, warmMin = warmMinFor(code), light = false) {
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
const FREE_SESSION = { name: 'Séance libre', color: '#E8431A', warmup: 'tapis', goal: 'Exercices choisis par toi.', warmNote: 'Échauffe-toi 5 à 10 minutes avant de commencer.', items: [] };
const sessionOf = code => SESSIONS[code] || FREE_SESSION;
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
const setValue = (exId, s) => !EX[exId] ? 0 : isAssisted(exId) ? (num(s.reps) ? Math.max(1, bodyWeight() - (num(s.kg) || 0)) * (1 + num(s.reps) / 30) : 0) : EX[exId].type === 'hold' ? (num(s.sec) || 0) : (EX[exId].loaded ? e1rm(s) : (num(s.reps) || 0));
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
  return items.reduce((t, it) => t + (isAssisted(it.ex) ? 0 : (it.sets || []).reduce((a, s) => a + (s.done ? (num(s.kg) || 0) * (num(s.reps) || 0) : 0), 0)), 0);
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
  if (!state.active) resolveSessions();
  ({ today: renderToday, program: renderProgram, muscles: renderMuscles, nutrition: renderNutrition, progress: renderProgress, profile: renderProfile })[view]();
  const banner = $('#resume');
  banner.hidden = !(state.active && view !== 'today');
  if (!banner.hidden) banner.querySelector('span').textContent = `Séance en cours : ${sessionOf(state.active.code).name}`;
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
  if (!$('#focus')) document.body.classList.remove('has-sheet');
  if (sheetCleanup) { const c = sheetCleanup; sheetCleanup = null; c(); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ================= Fiche exercice ================= */
function exThumb(id, cls = '') {
  return `<span class="thumb ${cls}">${FIG.svg(EX[id].fig, 'Illustration : ' + EX[id].name, EX[id].target)}</span>`;
}
function loadTableHTML(id) {
  const last = lastSetsFor(id).filter(x => num(x.kg));
  const lastKg = last.length ? (isAssisted(id) ? Math.min(...last.map(x => num(x.kg))) : Math.max(...last.map(x => num(x.kg)))) : null;
  return `<div class="loads">
    <div class="panel__head"><h3>${isAssisted(id) ? 'Contrepoids conseillé' : 'Charge conseillée'}</h3><span class="muted small">pour ${fmtKg(bodyWeight())} kg${currentWeight() ? '' : ' (poids par défaut)'}</span></div>
    <div class="loads__grid">${Object.entries(LEVELS).map(([k, l]) => `
      <div class="${k === state.profile.level ? 'on' : ''}"><p class="loads__kg">${fmtKg(startLoad(id, k))} kg</p><p class="loads__lvl">${l.label}</p></div>`).join('')}</div>
    <p class="muted small">${loadNote(id)} Pour 10 à 15 répétitions : la dernière doit être difficile mais propre.${lastKg != null ? ` <strong>Ta dernière charge : ${fmtKg(lastKg)} kg.</strong>` : ''}</p>
  </div>`;
}

/* Faire un exercice choisi librement (onglet Muscles, bibliothèque) */
function freeItem(id) {
  const e = EX[id];
  if (e.type === 'time') return { ex: id, kind: 'time', minutes: 10, sets: [{ done: false }] };
  const n = 3;
  if (e.type === 'hold') return { ex: id, kind: 'hold', hold: 30, rest: 45, sets: Array.from({ length: n }, () => ({ kg: '', reps: '', sec: '', done: false })) };
  const heavy = ['stack', 'smith', 'assist'].includes(LOADS[id]?.[1]) && !['abducteurs', 'adducteurs', 'reverse-fly', 'pec-deck', 'crunch-machine'].includes(id);
  return { ex: id, kind: 'reps', reps: heavy ? '10' : '12', rest: heavy ? 90 : 60, sets: Array.from({ length: n }, () => ({ kg: '', reps: '', sec: '', done: false })) };
}
function doExercise(id) {
  closeSheet();
  if (state.active) {
    state.active.items.push(freeItem(id));
    save(); toast(`${EX[id].name} ajouté à la séance.`);
    go('today');
    setTimeout(() => $('#wx-' + (state.active.items.length - 1))?.scrollIntoView({ block: 'start' }), 80);
    return;
  }
  state.active = { code: 'L', free: true, start: Date.now(), items: [freeItem(id)], rpe: '', notes: '' };
  setTimeout(keepAwake, 50);
  save(); go('today');
  toast('Séance libre démarrée.', { action: 'Annuler', onAction: cancelSession, duration: 8000 });
}


/* ================= Recherche par nom de machine (FR, EN, NL) =================
   « Diverging lat pulldown », « Beenpers », « converging chest press »… → exercice. */
const MSTOP = new Set(['machine', 'machines', 'de', 'la', 'le', 'les', 'a', 'au', 'du', 'des', 'the', 'seated', 'assis', 'zittend', 'toestel', 'apparaat',
  'matrix', 'technogym', 'life', 'fitness', 'hammer', 'strength', 'basic', 'fit', 'pro', 'station', 'van', 'het', 'een', 'met', 'voor']);
const mnorm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !MSTOP.has(w)).map(w => w.length > 4 ? w.replace(/s$/, '') : w);
let MIDX = null;
function machineIndex() {
  if (MIDX) return MIDX;
  MIDX = [];
  for (const [id, e] of Object.entries(EX)) {
    const names = [e.name, ...(MACHINE_NAMES[id] || [])];
    for (const n of names) { const t = mnorm(n); if (t.length) MIDX.push({ id, label: n, t }); }
  }
  return MIDX;
}
function tokMatch(q, a) {
  if (q === a) return 1;
  if (a.length >= 4 && (a.startsWith(q) && q.length >= 4 || q.startsWith(a))) return .85;
  if (a.length >= 5 && q.length >= 4 && Math.abs(a.length - q.length) <= 2 && lev(q, a) <= (a.length >= 8 ? 2 : 1)) return .75;
  return 0;
}
function searchMachine(query, max = 6) {
  const q = mnorm(query);
  if (!q.length) return [];
  const best = {};
  for (const { id, label, t } of machineIndex()) {
    let got = 0; const usedQ = new Set();
    for (const a of t) {
      let m = 0, mi = -1;
      q.forEach((w, i) => { if (usedQ.has(i)) return; const v = tokMatch(w, a); if (v > m) { m = v; mi = i; } });
      if (mi >= 0 && m > 0) { usedQ.add(mi); got += m; }
    }
    if (!got) continue;
    const cover = got / t.length, qcover = usedQ.size / q.length;
    if (cover < .5) continue;
    const score = cover * 2 + qcover + got * .3 - (EX[id].zone === 'Maison' ? .4 : 0);
    if (!best[id] || score > best[id].score) best[id] = { id, label, score };
  }
  const list = Object.values(best).sort((a, b) => b.score - a.score);
  const top = list[0]?.score || 0;
  return list.filter(r => r.score >= top * .8).slice(0, max);
}
function openMachineSearch() {
  const body = openSheet(`
    <h2 class="sheet__title">${state.active ? 'Ajouter un exercice' : 'Séance libre'}</h2>
    <p class="muted">Tape le nom écrit sur la machine, en français, anglais ou néerlandais.</p>
    <label class="search">${ICON.search}<input type="search" id="ms-q" placeholder="Ex. : Diverging lat pulldown" autocomplete="off" aria-label="Nom de la machine"></label>
    <div class="chips" id="ms-ex">${['Leg press', 'Beenpers', 'Lat pulldown', 'Chest press', 'Borstpers', 'Leg curl'].map(x => `<button class="chip chip--sm" type="button" data-msx="${x}">${x}</button>`).join('')}</div>
    <div id="ms-res" class="list" aria-live="polite"></div>
    <button class="btn btn--ghost btn--block" type="button" id="ms-browse">Parcourir par muscle</button>
  `, { label: 'Recherche par machine' });
  const inp = $('#ms-q', body), out = $('#ms-res', body);
  const draw = () => {
    const v = inp.value.trim();
    $('#ms-ex', body).hidden = !!v;
    if (!v) { out.innerHTML = ''; return; }
    const res = searchMachine(v);
    out.innerHTML = res.length ? res.map((r, i) => `
      <div class="ms-row${i === 0 ? ' ms-row--top' : ''}">
        <button class="row" type="button" data-pick="${r.id}">${exThumb(r.id, 'thumb--sm')}
          <span class="row__main"><strong>${esc(EX[r.id].name)}</strong><br><span class="muted small">${esc(EX[r.id].equip)}${r.label !== EX[r.id].name ? ` · « ${esc(r.label)} »` : ''}</span></span>
          <span class="pill pill--sm">${state.active ? 'Ajouter' : 'Faire'}</span>
        </button>
        <button class="icon-btn" type="button" data-info="${r.id}" aria-label="Voir comment faire">i</button>
      </div>`).join('')
      : `<p class="empty">Aucune machine reconnue. Essaie un autre mot du nom (par exemple « pulldown », « press », « curl ») ou parcours par muscle.</p>`;
    $$('[data-pick]', out).forEach(b => b.onclick = () => doExercise(b.dataset.pick));
    $$('[data-info]', out).forEach(b => b.onclick = () => openExercise(b.dataset.info));
  };
  inp.oninput = draw;
  $$('[data-msx]', body).forEach(b => b.onclick = () => { inp.value = b.dataset.msx; draw(); });
  $('#ms-browse', body).onclick = () => { closeSheet(); musMode = 'groupes'; musGroup = null; go('muscles'); };
  setTimeout(() => inp.focus(), 150);
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
    <label class="field ex-note"><span>${e.zone === 'Maison' ? 'Mes notes' : 'Mes réglages sur cette machine'}</span><textarea id="ex-note" rows="2" placeholder="${e.zone === 'Maison' ? 'Ex. : élastique rouge, pieds écartés' : 'Ex. : siège 4, dossier 2, poignées hautes'}">${esc(state.exNotes[id] || '')}</textarea></label>
    ${LOADS[id] ? loadTableHTML(id) : ''}
    <h3 class="sub">Muscles ciblés</h3>
    ${musclesHTML(e)}
    <h3 class="sub">Comment faire</h3>
    <ol class="steps">${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <p class="callout callout--warn"><strong>Erreur fréquente.</strong> ${esc(e.mistake)}</p>
    <p class="callout"><strong>Pour le volley.</strong> ${esc(e.why)}</p>
    ${best ? `<p class="record">${ICON.trophy}<span>Ton record : <strong>${setText(id, best.s)}</strong>, le ${fmtDate(best.date)}</span></p>` : ''}
    <button class="btn btn--block" type="button" id="do-ex">${ICON.play} ${state.active ? 'Ajouter à la séance en cours' : 'Faire cet exercice'}</button>
    ${e.alt?.length ? `<h3 class="sub">Si la machine est prise ou absente</h3>
      <div class="list">${e.alt.map(a => `<button class="row" type="button" data-ex="${a}">${exThumb(a, 'thumb--sm')}<span><strong>${esc(EX[a].name)}</strong><br><span class="muted small">${esc(EX[a].equip)}</span></span></button>`).join('')}</div>` : ''}
  `, { label: e.name, onClose: () => {
    anim.stop();
    if (state.active && view === 'today') state.active.items.forEach((x, i) => { if (x.ex === id) rerenderItem(i); });
  } });
  $('#ex-note', body).oninput = ev => { const v = ev.target.value.trim(); if (v) state.exNotes[id] = v; else delete state.exNotes[id]; save(); };
  anim = FIG.mount($('#anim-fig'), e.fig, { label: 'Animation : ' + e.name, target: e.target, onPhase: t => { const el = $('#anim-phase'); if (el) el.textContent = t; } });
  $$('[data-anim]', body).forEach(b => b.onclick = () => {
    anim.set(b.dataset.anim);
    $$('[data-anim]', body).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (b.dataset.anim !== 'play') $('#anim-phase').textContent = b.dataset.anim === 'start' ? 'Position de départ' : 'Position d\'arrivée';
  });
  $('#anim-speed', body).onclick = e2 => e2.currentTarget.setAttribute('aria-pressed', String(anim.speed()));
  $$('[data-ex]', body).forEach(b => b.onclick = () => openExercise(b.dataset.ex));
  $('#do-ex', body).onclick = () => doExercise(id);
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

/* ================= Identité : sexe, âge, taille ================= */
function identityMissing() {
  const m = [];
  if (!['h', 'f'].includes(state.nutrition.sex)) m.push('sexe');
  const a = num(state.nutrition.age); if (!a || a < 12 || a > 90) m.push('âge');
  const h = num(state.profile.height); if (!h || h < 120 || h > 230) m.push('taille');
  return m;
}
const listFr = arr => arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} et ${arr[arr.length - 1]}`;
function identityHTML(prefix) {
  const n = state.nutrition, p = state.profile;
  return `<div class="field"><span>Sexe <b class="req">obligatoire</b></span>
      <div class="seg seg--choice" role="radiogroup" aria-label="Sexe">${[['h', 'Homme'], ['f', 'Femme']].map(([k, l]) => `<button type="button" role="radio" data-${prefix}sex="${k}" aria-checked="${n.sex === k}" aria-pressed="${n.sex === k}">${l}</button>`).join('')}</div></div>
    <div class="grid-2">
      <label class="field"><span>Âge <b class="req">obligatoire</b></span><input id="${prefix}age" inputmode="numeric" value="${esc(n.age)}" placeholder="Ex. : 32"></label>
      <label class="field"><span>Taille (cm) <b class="req">obligatoire</b></span><input id="${prefix}height" inputmode="decimal" value="${esc(p.height)}" placeholder="Ex. : 188"></label>
    </div>`;
}
function bindIdentity(root, prefix, onChange) {
  $$(`[data-${prefix}sex]`, root).forEach(b => b.onclick = () => {
    state.nutrition.sex = b.getAttribute(`data-${prefix}sex`); save();
    $$(`[data-${prefix}sex]`, root).forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.setAttribute('aria-checked', String(x === b)); });
    onChange && onChange();
  });
  $(`#${prefix}age`, root).oninput = e => { state.nutrition.age = num(e.target.value) ?? ''; save(); onChange && onChange(); };
  $(`#${prefix}height`, root).oninput = e => { state.profile.height = num(e.target.value) ?? ''; save(); onChange && onChange(); };
}
const identityBanner = () => {
  const m = identityMissing();
  return m.length ? `<button class="panel id-banner" type="button" data-complete-id><strong>Complète ton profil</strong><span>Indique ton ${listFr(m)} : FC max, zones cardiaques, IMC et besoins nutritionnels sont calculés à partir de ces infos.</span></button>` : '';
};
function openIdentitySheet() {
  const body = openSheet(`
    <h2 class="sheet__title">Ton profil</h2>
    <p class="muted">Ces infos servent à calculer ta fréquence cardiaque maximale, tes zones, ton IMC et tes besoins en calories et protéines.</p>
    ${identityHTML('o')}
    <label class="field"><span>Poids actuel (kg) <span class="muted">facultatif</span></span><input id="oweight" inputmode="decimal" placeholder="Ex. : 92"></label>
    <p class="callout" id="o-status"></p>
    <button class="btn btn--block" type="button" id="o-save">Valider</button>
  `, { label: 'Ton profil', onClose: () => render() });
  const status = () => {
    const m = identityMissing();
    $('#o-status', body).textContent = m.length ? `Il manque : ${listFr(m)}.` : 'Tout est prêt, les calculs sont personnalisés.';
    $('#o-save', body).disabled = !!m.length;
  };
  bindIdentity(body, 'o', status); status();
  $('#o-save', body).onclick = () => {
    const w = num($('#oweight', body).value);
    if (w && w > 30 && w < 250) state.measures.push({ id: Date.now(), date: new Date().toISOString(), weight: w, height: num(state.profile.height) });
    save(); closeSheet(); toast('Profil complété.');
  };
}

/* ================= Fréquence cardiaque =================
   FC max théorique : Tanaka (208 − 0,7 × âge) chez l'homme, Gulati (206 − 0,88 × âge) chez la femme. */
const HR_ZONES = [
  { n: 1, from: 50, to: 60, label: 'Récupération', desc: 'Très facile, respiration calme.' },
  { n: 2, from: 60, to: 70, label: 'Endurance', desc: 'Facile, tu peux parler normalement.' },
  { n: 3, from: 70, to: 80, label: 'Aérobie', desc: 'Soutenu, phrases courtes.' },
  { n: 4, from: 80, to: 90, label: 'Seuil', desc: 'Difficile, quelques mots seulement.' },
  { n: 5, from: 90, to: 100, label: 'Maximum', desc: 'Effort très court, impossible de parler.' }
];
const HR_TARGET = {
  A: { avg: [60, 75], max: 90, why: 'Séance de force : le cœur monte pendant les séries et redescend au repos.' },
  B: { avg: [60, 75], max: 90, why: 'Séance de force : le cœur monte pendant les séries et redescend au repos.' },
  C: { avg: [65, 80], max: 92, why: 'Séance plus dynamique avec du fractionné à la fin : pointes en zone 4 et 5 normales.' },
  R: { avg: [50, 65], max: 75, why: 'Récupération : reste en zone 1 ou 2, sans forcer.' }
};
function hrProfile() {
  const age = num(state.nutrition.age);
  if (!age || age < 12 || age > 90 || !['h', 'f'].includes(state.nutrition.sex)) return null;
  const female = state.nutrition.sex === 'f';
  const max = Math.round(female ? 206 - 0.88 * age : 208 - 0.7 * age);
  return { max, age, female, formula: female ? 'Gulati : 206 − 0,88 × âge' : 'Tanaka : 208 − 0,7 × âge' };
}
const pctOf = (bpm, max) => Math.round(bpm / max * 100);
function zoneOf(bpm, max) {
  const pc = bpm / max * 100;
  return pc < 50 ? { n: 0, label: 'Très léger' } : HR_ZONES.find(z => pc < z.to) || HR_ZONES[4];
}
const zoneBpm = (z, max) => `${Math.round(max * z.from / 100)} à ${Math.round(max * z.to / 100)}`;
const validBpm = v => { const n = num(v); return n && n >= 35 && n <= 240 ? Math.round(n) : null; };

/* Analyse des BPM d'une séance par rapport à la recommandation. */
function hrFeedback(code, avg, mx) {
  const hp = hrProfile(), t = HR_TARGET[code] || HR_TARGET.A;
  if (!hp) return `<p class="callout">Choisis ton sexe et indique ton âge dans Profil pour comparer tes BPM à ta zone conseillée.</p>`;
  const lo = Math.round(hp.max * t.avg[0] / 100), hi = Math.round(hp.max * t.avg[1] / 100), capBpm = Math.round(hp.max * t.max / 100);
  let out = `<p class="hr-target">Conseillé pour cette séance : <strong>${lo} à ${hi} bpm</strong> en moyenne (${t.avg[0]} à ${t.avg[1]} % de ta FC max de ${hp.max}), pointes jusqu'à ${capBpm} bpm. ${t.why}</p>`;
  const msgs = [];
  if (avg) {
    const z = zoneOf(avg, hp.max), pc = pctOf(avg, hp.max);
    const verdict = pc < t.avg[0] ? ['low', 'un peu bas : raccourcis les repos ou monte un peu les charges.']
      : pc > t.avg[1] ? ['high', 'élevé : allonge un peu les repos et bois régulièrement.']
      : ['ok', 'pile dans la cible.'];
    msgs.push(`<p class="hr-line hr-line--${verdict[0]}"><strong>Moyenne ${avg} bpm</strong>, ${pc} %${z.n ? `, zone ${z.n} (${z.label.toLowerCase()})` : ''} : ${verdict[1]}</p>`);
  }
  if (mx) {
    const pc = pctOf(mx, hp.max);
    const v = mx > hp.max + 8 ? ['info', `au-dessus de ta FC max théorique : c'est normal, la formule est une estimation (à plus ou moins 10 bpm). Ta vraie FC max est sans doute autour de ${mx}.`]
      : pc > t.max ? ['high', 'pointe très haute pour ce type de séance : si ce n\'était pas pendant le fractionné, lève un peu le pied.']
      : ['ok', 'pointe normale.'];
    msgs.push(`<p class="hr-line hr-line--${v[0]}"><strong>Maximum ${mx} bpm</strong>, ${pc} % : ${v[1]}</p>`);
  }
  if (avg && mx && avg > mx) msgs.push('<p class="hr-line hr-line--high">La moyenne ne peut pas dépasser le maximum : vérifie les valeurs.</p>');
  return out + msgs.join('');
}
function hrFieldsHTML(avg, mx) {
  return `<div class="grid-2">
      <label class="field"><span>BPM moyen</span><input id="hr-avg" inputmode="numeric" value="${esc(avg || '')}" placeholder="125"></label>
      <label class="field"><span>BPM max</span><input id="hr-max" inputmode="numeric" value="${esc(mx || '')}" placeholder="165"></label>
    </div>`;
}


/* ================= Coach : quelle séance faire ensuite ? =================
   Regarde ce qui a été travaillé (séances du programme ET séances libres), le temps de
   récupération de chaque groupe, l'équilibre de la semaine, les matchs et la fatigue. */
const REST_H = { legs: 60, push: 48, pull: 48, core: 24, cuff: 24 };
const WEEK_TARGET = { legs: 20, push: 14, pull: 14, core: 9, cuff: 4 };
const CAT_LABEL = () => ({ legs: TT('jambes', 'legs'), push: TT('poussée (pectoraux, épaules)', 'push (chest, shoulders)'), pull: TT('dos', 'back'), core: TT('abdos et gainage', 'abs and core'), cuff: TT('prévention des épaules', 'shoulder prevention') });
function catOf(m) { return Object.keys(CAT).find(k => CAT[k].includes(m)); }
function trainingLoad(at = Date.now(), extra = null) {
  const last = {}, week = {}, sessions = [];
  const add = (items, t) => {
    let any = false; const cs = {};
    for (const it of items || []) {
      const e = EX[it.ex]; if (!e || it.kind === 'warmup' || it.kind === 'time') continue;
      const n = (it.sets || []).filter(x => x.done).length; if (!n) continue;
      any = true;
      (e.target?.p || []).forEach(m => { const c = catOf(m); if (c) cs[c] = (cs[c] || 0) + n; });
      (e.target?.s || []).forEach(m => { const c = catOf(m); if (c) cs[c] = (cs[c] || 0) + n / 3; });
    }
    for (const [c, v] of Object.entries(cs)) {
      if (v >= 2 && (!last[c] || t > last[c])) last[c] = t;
      if (at - t <= 7 * 864e5) week[c] = (week[c] || 0) + v;
    }
    if (any) sessions.push(t);
  };
  for (const h of state.history) add(h.items, +new Date(h.date));
  if (extra) add(extra, Date.now());
  const hours = Object.fromEntries(Object.keys(CAT).map(c => [c, last[c] ? (at - last[c]) / 36e5 : 999]));
  return { hours, week, sessions };
}
function sessionCats(code) {
  const s = SESSIONS[code]; if (!s) return {};
  const w = {}; let tot = 0;
  for (const it of s.items) {
    const e = EX[it.ex]; if (!e || it.duration) continue;
    const n = it.sets || 3; tot += n;
    (e.target?.p || []).forEach(m => { const c = catOf(m); if (c) w[c] = (w[c] || 0) + n; });
  }
  for (const c in w) w[c] /= tot || 1;
  return w;
}
function smartNext({ at = new Date(), extra = null } = {}) {
  const L = trainingLoad(+at, extra), p = state.profile, wd = weekday(at), lab = CAT_LABEL();
  const m = p.matchDay, hasM = m !== null && m !== undefined;
  const matchToday = hasM && m === wd, matchTomorrow = hasM && (m + 6) % 7 === wd, matchYesterday = hasM && (m + 1) % 7 === wd;
  const recent3 = L.sessions.filter(t => +at - t < 3 * 864e5).length;
  const lastHard = state.history.find(h => +at - +new Date(h.date) < 30 * 36e5 && num(h.rpe) >= 9);
  const cands = ['A', 'B', 'C'].concat(SESSIONS.H ? ['H'] : []);
  const scored = cands.map(code => {
    const w = sessionCats(code); let sc = 0; const why = [];
    for (const [c, f] of Object.entries(w)) {
      const h = L.hours[c], rest = REST_H[c];
      if (h < rest) { sc -= f * (1 - h / rest) * 4; if (f > .25) why.push({ neg: true, c, h }); }
      else { sc += f * Math.min(h / 72, 2); if (f > .25) why.push({ neg: false, c, h }); }
      sc += f * Math.max(0, 1 - (L.week[c] || 0) / WEEK_TARGET[c]) * 1.5;
    }
    if (matchTomorrow && code === 'A') sc -= 3;
    if (matchTomorrow && code === 'C') sc -= 1;
    if (code === 'H') sc -= .4;
    return { code, sc, why };
  }).sort((a, b) => b.sc - a.sc);
  const reasons = [];
  // récupération prioritaire ?
  if (matchToday) return { code: null, reasons: [TT('Jour de match : pas de salle aujourd\'hui. Échauffe bien tes épaules avant le match.', 'Match day: no gym today. Warm up your shoulders well before the match.')] };
  let best = scored[0];
  const recoverScore = (matchYesterday ? 3 : 0) + (recent3 >= 3 ? 2 : 0) + (lastHard ? 1.5 : 0) + (best.sc < 0 ? 2 : 0);
  if (recoverScore >= 2 || (SESSIONS.R && best.sc < -0.5)) {
    if (matchYesterday) reasons.push(TT('Match hier : place à la récupération.', 'Match yesterday: time to recover.'));
    if (recent3 >= 3) reasons.push(TT(`${recent3} séances sur les 3 derniers jours : ton corps a besoin de souffler.`, `${recent3} sessions in the last 3 days: your body needs a break.`));
    if (lastHard) reasons.push(TT('Ta dernière séance était très dure (effort 9 ou 10).', 'Your last session was very hard (effort 9 or 10).'));
    if (best.sc < 0) reasons.push(TT('Les groupes travaillés ces deux derniers jours n\'ont pas encore récupéré : une séance légère aujourd\'hui, et tu repars plus fort demain.', 'The groups worked in the last two days haven\'t recovered yet: a light session today, and you come back stronger tomorrow.'));
    return { code: 'R', reasons, alt: best.code };
  }
  const fmtH = h => h >= 999 ? TT('pas encore cette semaine', 'not yet this week') : h < 36 ? TT('hier', 'yesterday') : TT(`il y a ${Math.round(h / 24)} jours`, `${Math.round(h / 24)} days ago`);
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  for (const y of best.why.filter(x => !x.neg).slice(0, 2)) reasons.push(y.h >= 999
    ? TT(`${cap(lab[y.c])} : pas encore travaillé${y.c === 'legs' ? 'es' : ''} cette semaine.`, `${cap(lab[y.c])}: not worked yet this week.`)
    : TT(`${cap(lab[y.c])} : dernière fois ${fmtH(y.h)}, c'est récupéré.`, `${cap(lab[y.c])}: last time ${fmtH(y.h)}, recovered.`));
  for (const y of best.why.filter(x => x.neg).slice(0, 2)) reasons.push(TT(`${cap(lab[y.c])} : ${Math.round(y.h)} h de repos, presque récupéré. Garde des charges modérées.`, `${cap(lab[y.c])}: ${Math.round(y.h)} h of rest, almost recovered. Keep moderate loads.`));
  const own = new Set(best.why.map(x => x.c));
  const tired = Object.keys(CAT).filter(c => c !== 'cuff' && !own.has(c) && L.hours[c] < REST_H[c]);
  if (tired.length) reasons.push(TT(`On laisse récupérer : ${tired.map(c => lab[c]).join(', ')} (travaillé${tired.length > 1 ? 's' : ''} il y a moins de ${Math.max(...tired.map(c => REST_H[c]))} h).`, `Letting these recover: ${tired.map(c => lab[c]).join(', ')} (worked less than ${Math.max(...tired.map(c => REST_H[c]))} h ago).`));
  if (matchTomorrow) reasons.push(TT('Match demain : pas de jambes lourdes aujourd\'hui.', 'Match tomorrow: no heavy legs today.'));
  const low = Object.keys(WEEK_TARGET).filter(c => (L.week[c] || 0) < WEEK_TARGET[c] / 3 && sessionCats(best.code)[c] > .2);
  if (low.length && !best.why.length) reasons.push(TT(`Peu travaillé cette semaine : ${low.map(c => lab[c]).join(', ')}.`, `Little work this week: ${low.map(c => lab[c]).join(', ')}.`));
  if (!reasons.length) reasons.push(TT('La séance la plus équilibrée par rapport à ta semaine.', 'The most balanced session for your week.'));
  return { code: best.code, reasons, alt: scored[1]?.code };
}
function coachHTML(planned) {
  const r = smartNext();
  if (!r.code) return `<section class="panel coach"><div class="panel__head"><h2>${TT('Séance conseillée', 'Suggested session')}</h2></div><ul class="coach__why">${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
  const s = SESSIONS[r.code], same = planned === r.code;
  return `<section class="panel coach" style="--sess:${s.color}">
    <div class="panel__head"><h2>${TT('Séance conseillée', 'Suggested session')}</h2><span class="pill pill--sm">${TT('selon tes dernières séances', 'based on your recent sessions')}</span></div>
    <div class="coach__pick"><span class="tag">${r.code}</span><strong>${esc(s.name)}</strong>${same ? `<span class="coach__ok">${ICON.check} ${TT('c\'est aussi ta séance prévue', 'also your planned session')}</span>` : ''}</div>
    <ul class="coach__why">${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${same ? '' : `<button class="btn btn--block" type="button" data-start="${r.code}" style="background:${s.color}">${ICON.play} ${TT('Faire la séance', 'Do session')} ${r.code}</button>`}
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
  // prochaine séance prévue (pour motiver les jours sans salle)
  let nextTxt = '';
  for (let k = 1; k <= 7; k++) {
    const c = plan[(wd + k) % 7];
    if (SESSIONS[c]) { nextTxt = `${k === 1 ? 'Demain' : DAYS[(wd + k) % 7]} : séance ${c}, ${SESSIONS[c].name.toLowerCase()}`; break; }
  }
  if (code === 'M') {
    hero = `<section class="court court--dark">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}</p>
      <h1 class="court__title">Jour de <span class="hl">match</span></h1>
      <p class="court__meta">Pas de salle aujourd'hui. Avant le match : 5 minutes de rotations d'épaules à l'élastique et quelques sauts progressifs.</p>
      ${nextTxt ? `<p class="court__facts"><span>${esc(nextTxt)}</span></p>` : ''}
    </section>`;
  } else if (SESSIONS[code]) {
    const s = SESSIONS[code];
    hero = `<section class="court" style="--sess:${s.color}">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}, semaine ${cycleWeek()} sur 4</p>
      <h1 class="court__title">${esc(s.name)}</h1>
      <p class="court__meta">${esc(s.goal)}</p>
      <p class="court__facts"><span>${warmMinFor(code)} min d'échauffement</span><span>${fitSession(code).plan.length} exercices</span><span>${estimateMinutes(s)} min au total</span></p>
      <div class="btn-row"><button class="btn btn--court" data-start="${code}" type="button">${ICON.play} Commencer la séance</button>${TEMPLATE[code].fixed ? '' : `<button class="btn btn--court-ghost" data-reroll="${code}" type="button">${ICON.swap} Autres exercices</button>`}</div>
    </section>`;
  } else {
    hero = `<section class="court court--dark court--rest">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}</p>
      <h1 class="court__title">Jour de <span class="hl">repos</span></h1>
      <p class="court__meta">Les muscles se construisent pendant la récupération. Marche, étire-toi, dors bien.</p>
      ${nextTxt ? `<p class="court__facts"><span>${ICON.play} ${esc(nextTxt)}</span></p>` : ''}
    </section>`;
  }


  const goal = weeklyGoal(), done = weekCount(weekStart(now)), st = streak();
  const last = state.history[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = sessionsBetween(monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1));

  el.innerHTML = `
    ${identityBanner()}
    ${hero}
    ${coachHTML(code)}
    ${isDeload() ? '<p class="callout">Semaine 4 du cycle : semaine allégée. Une série de moins par exercice pour bien récupérer.</p>' : ''}
    <section class="panel">
      <div class="panel__head"><h2>Ta semaine</h2><span class="muted small">${done} sur ${goal}</span></div>
      <div class="goalbar" aria-hidden="true">${Array.from({ length: goal }, (_, i) => `<span class="${i < done ? 'on' : ''}"></span>`).join('')}</div>
      ${weekStrip(plan, wd)}
      <p class="legend">${Object.entries(SESSIONS).map(([k, x]) => `${k} ${x.name.toLowerCase()}`).join(', ')}.</p>
    </section>
    <section class="stats3">
      <div class="stat"><p class="stat__value">${st}</p><p class="stat__label">${st > 1 ? 'semaines' : 'semaine'} d'affilée à l'objectif</p></div>
      <div class="stat"><p class="stat__value">${month.length}</p><p class="stat__label">${month.length > 1 ? 'séances' : 'séance'} en ${MONTHS[now.getMonth()]}</p></div>
      <div class="stat"><p class="stat__value">${fmtVolume(month.reduce((t, h) => t + (h.volume || 0), 0))}</p><p class="stat__label">soulevés ce mois</p></div>
    </section>
    ${weekMusclesHTML()}
    ${last ? `<button class="panel last" type="button" data-session="${last.id}">
      <span class="tag" style="--sess:${sessionOf(last.code).color}">${esc(last.code)}</span>
      <span><strong>Dernière séance : ${esc(last.name)}</strong><br><span class="muted small">${fmtDate(last.date)}, ${last.minutes} min, ${fmtVolume(last.volume || 0)}${last.prs?.length ? `, ${plural(last.prs.length, 'record')}` : ''}</span></span>
    </button>` : ''}
    <section class="panel">
      <h2>Faire une autre séance</h2>
      <button class="free-cta" type="button" id="free-machine">${ICON.search}<span><strong>Séance libre</strong><br><span class="small">Tape le nom d'une machine, l'app te donne l'exercice</span></span></button>
      <div class="sess-grid">${Object.entries(SESSIONS).map(([k, s]) =>
        `<button class="sess-btn" style="--sess:${s.color}" data-start="${k}" type="button"><b>${k}</b><span>${esc(s.name)}</span></button>`).join('')}</div>
    </section>`;
  $$('[data-start]', el).forEach(b => b.addEventListener('click', () => startSession(b.dataset.start)));
  $$('[data-session]', el).forEach(b => b.addEventListener('click', () => openSession(b.dataset.session)));
  $$('[data-reroll]', el).forEach(b => b.addEventListener('click', () => rerollSession(b.dataset.reroll)));
  $$('[data-complete-id]', el).forEach(b => b.addEventListener('click', openIdentitySheet));
  $('#free-machine', el)?.addEventListener('click', openMachineSearch);
}

/* ================= Séance en cours ================= */
function buildItems(code, light = false) {
  const s = SESSIONS[code], p = state.profile, fit = fitSession(code, undefined, light);
  const items = [{ ex: warmupFor(code), kind: 'warmup', minutes: warmMinFor(code), home: isHome(code), sets: [{ done: false }] }];
  fit.plan.forEach(it => {
    const slot = it.slot;
    const exId = EX[state.swaps[swapKey(code, slot)]] ? state.swaps[swapKey(code, slot)] : it.ex;
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
  const done = a.items.reduce((t, it) => t + it.sets.filter(x => x.done).length, 0);
  if (done) {
    const body = openSheet(`
      <h2 class="sheet__title">Tu as déjà validé ${plural(done, 'série')}</h2>
      <p class="muted">Pour ne pas perdre ton travail, enregistre la séance telle qu'elle est. Elle comptera dans l'historique, les records et le coach.</p>
      <button class="btn btn--block" type="button" id="cs-save">Enregistrer la séance</button>
      <button class="btn btn--ghost btn--block" type="button" data-close>Continuer la séance</button>
      <button class="btn btn--danger btn--block" type="button" id="cs-drop">Supprimer sans enregistrer</button>`, { label: 'Annuler la séance' });
    $('#cs-save', body).onclick = () => { const n = saveActiveSession(); closeSheet(); toast(n ? `Séance enregistrée, ${plural(n, 'record')} battu${n > 1 ? 's' : ''} !` : 'Séance enregistrée.'); render(); window.scrollTo(0, 0); };
    $('#cs-drop', body).onclick = () => { if (!confirm('Supprimer cette séance et ses séries validées ?')) return; state.active = null; stopTimer(); save(); closeSheet(); render(); window.scrollTo(0, 0); toast('Séance annulée.'); };
    return;
  }
  state.active = null; stopTimer(); save(); render(); window.scrollTo(0, 0);
  toast('Séance annulée.');
}

function beginSession(code, light, checkin) {
  setTimeout(keepAwake, 50);
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
  const a = state.active, s = sessionOf(a.code);
  if (!s || !a.items) { state.active = null; save(); return renderToday(); }
  el.innerHTML = `
    <header class="wk-head" style="--sess:${s.color}">
      <div class="wk-head__row">
        <div><p class="muted small">${a.free ? 'Hors programme' : `Séance ${a.code}`}${a.light ? ', version allégée' : ''}${a.planned ? `, prévue en ${a.planned} min` : ''}</p><h2>${esc(s.name)}</h2></div>
        <div class="wk-head__side"><span class="clock" id="elapsed">0:00</span><button class="icon-btn wk-cancel" id="cancel-top" type="button" aria-label="Annuler la séance">${ICON.close}</button><button class="btn btn--sm" id="finish" type="button">Terminer</button></div>
      </div>
      <div class="progress"><span id="wk-progress"></span></div>
      <div class="hr-row">${hrChip()}</div>
    </header>
    <button class="focus-cta" type="button" id="focus-open" style="--sess:${s.color}">${ICON.play}<span><strong>Mode focus</strong><br><span class="small">Un exercice à la fois, grande animation, chrono de repos</span></span></button>
    ${isDeload() ? '<p class="callout">Semaine allégée : une série de moins.</p>' : ''}
    <div id="wk-items">${a.items.map((it, i) => itemHTML(it, i)).join('')}</div>
    <button class="btn btn--ghost btn--block" id="add-ex" type="button">+ Ajouter un exercice</button>
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
  $('#focus-open').onclick = () => openFocus();
  keepAwake();
  $$('[data-hr-open]', el).forEach(b => b.onclick = openHrLog);
  $('#add-ex').onclick = openMachineSearch;
}

/* Charge de départ selon le poids de corps et le niveau de force. */
const isAssisted = id => LOADS[id]?.[1] === 'assist';
function bodyWeight() { return currentWeight() || 75; }
function startLoad(id, level = state.profile.level) {
  const L = LOADS[id];
  if (!L) return null;
  const [ratio, kind] = L, bw = bodyWeight();
  if (kind === 'assist') return Math.max(5, Math.round(bw * ASSIST_BY_LEVEL[level] / 5) * 5);
  const raw = bw * ratio * LEVELS[level].factor;
  const step = kind === 'stack' ? 5 : kind === 'cable' ? (raw < 10 ? 1.25 : 2.5) : 2.5;
  return Math.max(step, Math.round(raw / step) * step);
}
function loadNote(id) {
  return isAssisted(id) ? 'Contrepoids : plus il est lourd, plus c\'est facile. Baisse-le quand tu progresses.'
    : LOADS[id]?.[1] === 'smith' ? 'Charge des disques ajoutés sur la barre guidée.'
    : LOADS[id]?.[1] === 'cable' ? 'Charge affichée sur la poulie.' : 'Charge affichée sur la machine.';
}

/* Charge suggérée : +2,5 ou +5 kg si toutes les répétitions ont été réussies la dernière fois. */
function suggestFor(it) {
  const e = EX[it.ex];
  if (!e?.loaded || (it.kind !== 'reps' && it.kind !== 'hold')) return null;
  const prev = lastSetsFor(it.ex).filter(x => num(x.kg));
  if (!prev.length) { const k = startLoad(it.ex); return k ? { kg: k, start: true } : null; }
  const assisted = isAssisted(it.ex);
  const kg = assisted ? Math.min(...prev.map(x => num(x.kg))) : Math.max(...prev.map(x => num(x.kg)));
  const top = it.kind === 'hold' ? it.hold : Math.max(...(String(it.reps).match(/\d+/g) || [10]).map(Number));
  const hit = prev.every(x => (it.kind === 'hold' ? num(x.sec) : num(x.reps)) >= top);
  if (!hit || state.active?.light) return { kg, up: false, same: true };
  if (assisted) return kg > 5 ? { kg, next: kg - 5, up: true, from: kg, assisted } : { kg, up: false, same: true };
  return { kg, next: kg + (kg < 30 ? 2.5 : 5), up: true, from: kg };
}

function itemHTML(it, i) {
  const e = EX[it.ex], s = sessionOf(state.active.code);
  const complete = it.sets.length && it.sets.every(x => x.done);
  const canSwap = it.slot !== undefined && TEMPLATE[state.active.code] && (it.kind !== 'warmup' && e.alt?.length || state.swaps[swapKey(state.active.code, it.slot)]);
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
    body = `${isW && !it.home ? `<div class="seg" role="group" aria-label="Machine">${WARMUP_MACHINES.map(m => `<button type="button" data-machine="${i}" data-m="${m}" aria-pressed="${it.ex === m}">${EX[m].short}</button>`).join('')}</div>` : ''}
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
    body = `${sug?.up ? `<div class="suggest"><span>Même charge que la dernière fois : <strong>${fmtKg(sug.kg)} kg</strong>. Tu avais réussi toutes tes répétitions : si c'était facile, ${sug.assisted ? 'baisse le contrepoids' : 'monte'} d'un cran.</span><button class="btn btn--ghost btn--sm" type="button" data-bump="${i}">${sug.assisted ? 'Contrepoids' : 'Monter à'} ${fmtKg(sug.next)} kg</button></div>` : sug?.same ? `<p class="suggest suggest--same"><span>Même charge que la dernière fois : <strong>${fmtKg(sug.kg)} kg</strong>.</span></p>` : ''}${sug?.start ? `<p class="suggest suggest--start">${ICON.up}<span>${isAssisted(it.ex) ? 'Contrepoids' : 'Charge'} de départ conseillée : <strong>${fmtKg(sug.kg)} kg</strong> (${LEVELS[state.profile.level].label.toLowerCase()}, ${fmtKg(bodyWeight())} kg). Si tu fais facilement plus de répétitions, ${isAssisted(it.ex) ? 'baisse le contrepoids' : 'monte'} à la série suivante ; si tu n'y arrives pas, ${isAssisted(it.ex) ? 'monte-le' : 'baisse'}.</span></p>` : ''}<div class="sets ${loaded ? '' : 'sets--nokg'}" role="table" aria-label="Séries">
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
  if (d.bump !== undefined) {
    const it = a.items[+d.bump], sg = suggestFor(it);
    if (sg?.next != null) { it.sets.forEach(x => { if (!x.done) x.kg = String(sg.next); }); save(); rerenderItem(+d.bump); toast(`Charge réglée à ${fmtKg(sg.next)} kg.`); }
    return;
  }
  if (d.addset !== undefined) {
    const it = a.items[+d.addset];
    it.sets.push({ kg: '', reps: '', sec: '', done: false });
    save(); return rerenderItem(+d.addset);
  }
  if (d.machine !== undefined) { a.items[+d.machine].ex = d.m; save(); return rerenderItem(+d.machine); }
  if (d.min !== undefined) {
    const it = a.items[+d.min], step = +d.d;
    it.minutes = it.kind === 'warmup' ? (it.home ? Math.min(15, Math.max(5, it.minutes + step)) : Math.min(25, Math.max(15, it.minutes + step))) : Math.min(60, Math.max(1, it.minutes + step));
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
  st.t = st.done ? Date.now() : null;
  if (st.done) {
    const row = $(`#row-${i}-${k}`);
    if (row) $$('input', row).forEach(inp => {
      const f = inp.dataset.f;
      if (st[f]) inp.value = st[f];
      else if (!inp.value && inp.placeholder) { inp.value = inp.placeholder; st[f] = inp.placeholder; }
    });
  }
  save();
  if (it.kind === 'warmup' || it.kind === 'time') return rerenderItem(i);
  const row = $(`#row-${i}-${k}`);
  if (row) { row.classList.toggle('is-done', st.done); $('.check', row).setAttribute('aria-pressed', String(st.done)); }
  $('#wx-' + i)?.classList.toggle('is-complete', it.sets.every(x => x.done));
  updateProgress();
  if (st.done && a.items.every(x => x.sets.every(y => y.done))) {
    setTimeout(() => toast('Toutes les séries sont faites : enregistre ta séance !', { action: 'Terminer', onAction: openFinish, duration: 9000 }), 400);
  }
  if (st.done && it.rest) {
    const lastSet = it.sets.every(x => x.done);
    const next = a.items.slice(i + 1).find(x => !x.sets.every(s => s.done));
    startTimer(it.rest, lastSet && next ? `Ensuite : ${EX[next.ex].name}` : 'Repos', null, true);
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
  const key = swapKey(a.code, it.slot);
  const original = SESSIONS[a.code].items[it.slot].ex;
  const tpl = TEMPLATE[a.code].items[it.slot];
  const options = [...new Set([original, ...poolOf(tpl), ...(EX[original].alt || [])])].filter(id => id !== it.ex && EX[id]?.type === EX[original].type);
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
    if ($('#focus')) drawFocus();
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


/* ================= Bilan de séance : résumé, muscles, avis, prochaine fois ================= */
const TT = (fr, en) => window.LANG === 'en' ? en : fr;
const CAT = {
  push: ['pectoraux', 'deltoides', 'triceps'], pull: ['dorsaux', 'deltoides-arr', 'biceps', 'trapezes'],
  legs: ['quadriceps', 'ischios', 'fessiers', 'mollets', 'adducteurs', 'abducteurs'], core: ['abdos', 'obliques', 'lombaires'], cuff: ['coiffe']
};
const CAT_EX = { push: ['chest-press', 'shoulder-press'], pull: ['tirage-vertical', 'rowing-assis'], legs: ['presse', 'leg-curl'], core: ['crunch-machine', 'extension-lombaire'], cuff: ['rot-ext', 'face-pull'] };
function sessionReview({ items, code, rpe, minutes, start, live }) {
  const strength = items.filter(it => (it.kind === 'reps' || it.kind === 'hold') && EX[it.ex]);
  const done = strength.map(it => ({ it, n: (it.sets || []).filter(x => x.done).length, total: (it.sets || []).length })).filter(x => x.total);
  const setsDone = done.reduce((t, x) => t + x.n, 0), setsTotal = done.reduce((t, x) => t + x.total, 0);
  const warm = items.some(it => (it.kind === 'warmup' || it.kind === 'time') && it.sets?.[0]?.done);
  const mus = {};
  for (const { it, n } of done) {
    (EX[it.ex].target?.p || []).forEach(m => mus[m] = (mus[m] || 0) + n);
    (EX[it.ex].target?.s || []).forEach(m => mus[m] = (mus[m] || 0) + n / 2);
  }
  const cat = Object.fromEntries(Object.entries(CAT).map(([k, list]) => [k, list.reduce((t, m) => t + (mus[m] || 0), 0)]));
  const good = [], more = [], next = [];
  // ce qui est bien
  if (setsDone >= 12) good.push(TT(`Bon volume : ${setsDone} séries validées.`, `Good volume: ${setsDone} sets confirmed.`));
  if (setsTotal && setsDone === setsTotal) good.push(TT('Toutes les séries prévues ont été faites.', 'Every planned set was done.'));
  if (cat.cuff > 0) good.push(TT('Prévention des épaules faite : parfait pour le volley.', 'Shoulder prevention done: perfect for volleyball.'));
  if (cat.push && cat.pull && Math.max(cat.push, cat.pull) <= 1.5 * Math.min(cat.push, cat.pull)) good.push(TT('Poussée et tirage bien équilibrés.', 'Push and pull well balanced.'));
  // ce qu'il faut faire en plus
  if (setsDone < 6) more.push(TT(`Séance courte (${setsDone} séries) : vise au moins 10 à 12 séries pour progresser.`, `Short session (${setsDone} sets): aim for at least 10 to 12 sets to progress.`));
  if (setsTotal && setsDone < setsTotal) more.push(TT(`${setsTotal - setsDone} série${setsTotal - setsDone > 1 ? 's' : ''} non validée${setsTotal - setsDone > 1 ? 's' : ''} : finis-les ou retire-les si tu manquais de temps.`, `${setsTotal - setsDone} set(s) not confirmed: finish them or remove them if you were short on time.`));
  if (code === 'L' && !warm) more.push(TT('Pense à 5 à 10 minutes d\'échauffement cardio avant la prochaine séance libre.', 'Remember 5 to 10 minutes of cardio warm-up before your next free session.'));
  if (cat.push > 1.5 * (cat.pull || 0) && cat.push >= 3) more.push(TT(`Beaucoup de poussée, peu de tirage : ajoute ${EX[CAT_EX.pull[0]].name.toLowerCase()} ou ${EX[CAT_EX.pull[1]].name.toLowerCase()} pour protéger tes épaules.`, `Lots of pushing, little pulling: add ${EX[CAT_EX.pull[0]].name.toLowerCase()} or ${EX[CAT_EX.pull[1]].name.toLowerCase()} to protect your shoulders.`));
  if (cat.pull > 1.5 * (cat.push || 0) && cat.pull >= 3) more.push(TT(`Beaucoup de tirage, peu de poussée : ajoute ${EX[CAT_EX.push[0]].name.toLowerCase()} pour équilibrer.`, `Lots of pulling, little pushing: add ${EX[CAT_EX.push[0]].name.toLowerCase()} to balance.`));
  if ((cat.push || cat.pull) && !cat.cuff) more.push(TT(`Haut du corps sans prévention : ajoute 2 séries de ${EX['rot-ext'].name.toLowerCase()} à la fin.`, `Upper body without prevention: add 2 sets of ${EX['rot-ext'].name.toLowerCase()} at the end.`));
  if (num(rpe) >= 9) more.push(TT('Effort très dur : garde au moins 48 heures avant de retravailler les mêmes muscles.', 'Very hard effort: allow at least 48 hours before working the same muscles again.'));
  if (num(rpe) && num(rpe) <= 4 && setsDone) more.push(TT('Effort facile : tu peux monter les charges ou ajouter une série.', 'Easy effort: you can raise the loads or add a set.'));
  // la prochaine fois
  const since = Date.now() - 7 * 864e5, wk = {};
  for (const h of state.history) if (+new Date(h.date) >= since) for (const it of h.items || []) { const e = EX[it.ex]; if (!e) continue; const n = (it.sets || []).filter(x => x.done).length; (e.target?.p || []).forEach(m => wk[m] = (wk[m] || 0) + n); }
  for (const { it, n } of done) (EX[it.ex].target?.p || []).forEach(m => wk[m] = (wk[m] || 0) + n);
  const missing = Object.keys(CAT).filter(k => k !== 'cuff' && !CAT[k].some(m => wk[m]));
  if (missing.length) next.push(TT(`Cette semaine, il manque encore : ${missing.map(k => ({ push: 'pectoraux et épaules', pull: 'dos', legs: 'jambes', core: 'abdos et gainage' })[k]).join(', ')}. Par exemple : ${missing.map(k => EX[CAT_EX[k][0]].name.toLowerCase()).join(', ')}.`,
    `This week you're still missing: ${missing.map(k => ({ push: 'chest and shoulders', pull: 'back', legs: 'legs', core: 'abs and core' })[k]).join(', ')}. For example: ${missing.map(k => EX[CAT_EX[k][0]].name.toLowerCase()).join(', ')}.`));
  const loads = done.filter(x => EX[x.it.ex].loaded && x.n).map(({ it }) => {
    const ds = it.sets.filter(x => x.done && num(x.kg));
    if (!ds.length) return null;
    const kg = isAssisted(it.ex) ? Math.min(...ds.map(x => num(x.kg))) : Math.max(...ds.map(x => num(x.kg)));
    const top = it.kind === 'hold' ? it.hold : Math.max(...(String(it.reps || '10').match(/\d+/g) || [10]).map(Number));
    const hit = ds.length === it.sets.length && ds.every(x => (it.kind === 'hold' ? num(x.sec) : num(x.reps)) >= top);
    return { ex: it.ex, kg, hit };
  }).filter(Boolean);
  if (live) {
    const nx = smartNext({ at: new Date(Date.now() + 24 * 36e5), extra: items });
    if (nx.code && SESSIONS[nx.code]) next.unshift(TT(`Prochaine séance conseillée : séance ${nx.code}, ${SESSIONS[nx.code].name.toLowerCase()}. ${nx.reasons[0] || ''}`, `Suggested next session: session ${nx.code}, ${SESSIONS[nx.code].name.toLowerCase()}. ${nx.reasons[0] || ''}`));
  }
  if (loads.some(l => l.hit)) next.push(TT('Exercices réussis à 100 % : l\'app te proposera de monter d\'un cran, tu décideras sur place.', 'Exercises done at 100 %: the app will offer to go up one step, you decide on the spot.'));
  if (!missing.length && !more.length) next.push(TT('Continue comme ça : même structure, mêmes charges, et monte quand tout passe facilement.', 'Keep it up: same structure, same loads, and go up when everything feels easy.'));
  return { minutes, setsDone, setsTotal, exercises: done.filter(x => x.n).length, mus, good, more, next, loads };
}
function reviewHTML(r) {
  const ranked = Object.entries(r.mus).sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] || 1;
  const levels = Object.fromEntries(ranked.map(([k, v]) => [k, v >= max * .66 ? 3 : v >= max * .33 ? 2 : 1]));
  const list = (title, arr, cls) => arr.length ? `<div class="rv-block ${cls}"><h4>${title}</h4><ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  return `<section class="review">
    <h3 class="sub">${TT('Bilan de la séance', 'Session review')}</h3>
    <p class="rv-sum">${TT(`${r.exercises} exercice${r.exercises > 1 ? 's' : ''}, ${r.setsDone} série${r.setsDone > 1 ? 's' : ''} sur ${r.setsTotal}, ${r.minutes} min.`, `${r.exercises} exercise(s), ${r.setsDone} of ${r.setsTotal} sets, ${r.minutes} min.`)}</p>
    ${ranked.length ? `<div class="muscles rv-mus">${FIG.muscles({}, TT('Muscles touchés', 'Muscles worked'), levels)}
      <div class="muscles__legend"><p><strong>${TT('Muscles touchés', 'Muscles worked')}</strong><br>${ranked.slice(0, 6).map(([k]) => MUSCLES[k]).join(', ')}</p></div></div>` : ''}
    ${list(TT('Ce qui est bien', 'What went well'), r.good, 'rv-good')}
    ${list(TT('À faire en plus', 'To add'), r.more, 'rv-more')}
    ${list(TT('La prochaine fois', 'Next time'), r.next, 'rv-next')}
    ${r.loads.length ? `<div class="rv-block rv-loads"><h4>${TT('Charges gardées pour la prochaine fois', 'Loads kept for next time')}</h4>
      <ul>${r.loads.map(l => `<li><span>${esc(EX[l.ex].name)}</span><strong>${fmtKg(l.kg)} kg</strong></li>`).join('')}</ul></div>` : ''}
  </section>`;
}


/* ================= BPM pendant la séance : relevés multiples + résumé ================= */
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>';
function hrChip() {
  const a = state.active, log = a?.hr || [], last = log[log.length - 1], hp = hrProfile();
  const z = last && hp ? zoneOf(last.bpm, hp.max) : null;
  return `<button class="hr-chip${z?.n ? ' hr-chip--z' + z.n : ''}" type="button" data-hr-open>${HEART}<span>${last ? `${last.bpm} bpm${z?.n ? ` · Z${z.n}` : ''}` : TT('Ajouter mon BPM', 'Add my BPM')}</span>${log.length ? `<em>${log.length}</em>` : ''}</button>`;
}
function refreshHrChips() { $$('[data-hr-open]').forEach(b => { b.outerHTML = hrChip(); }); $$('[data-hr-open]').forEach(b => { if (!b.closest('#focus')) b.onclick = openHrLog; }); }
function openHrLog() {
  const a = state.active; if (!a) return;
  a.hr = a.hr || [];
  const hp = hrProfile();
  const body = openSheet(`
    <h2 class="sheet__title">${TT('Mes BPM', 'My BPM')}</h2>
    <p class="muted">${TT('Regarde ta montre et note ton BPM, autant de fois que tu veux : pendant une série, juste après, pendant le repos.', 'Check your watch and log your BPM as often as you like: during a set, right after, during rest.')}</p>
    <div class="hr-add">
      <button type="button" data-hrd="-5" aria-label="${TT('Moins 5', 'Minus 5')}">−5</button>
      <input id="hr-in" inputmode="numeric" aria-label="BPM" placeholder="${a.hr.length ? a.hr[a.hr.length - 1].bpm : 120}" value="">
      <button type="button" data-hrd="5" aria-label="${TT('Plus 5', 'Plus 5')}">+5</button>
    </div>
    <button class="btn btn--block" type="button" id="hr-save">${HEART} ${TT('Ajouter ce relevé', 'Add this reading')}</button>
    <div id="hr-list">${hrLogHTML(a.hr, a.start, true)}</div>
  `, { label: TT('Mes BPM', 'My BPM'), onClose: () => refreshHrChips() });
  const inp = $('#hr-in', body);
  $$('[data-hrd]', body).forEach(b => b.onclick = () => { inp.value = String(Math.max(40, (num(inp.value) || num(inp.placeholder) || 120) + +b.dataset.hrd)); });
  const add = () => {
    const v = validBpm(inp.value || inp.placeholder);
    if (!v) { toast(TT('Entre un BPM entre 35 et 240.', 'Enter a BPM between 35 and 240.')); return; }
    a.hr.push({ t: Date.now(), bpm: v }); save();
    inp.value = ''; inp.placeholder = v;
    const z = hp ? zoneOf(v, hp.max) : null;
    toast(`${v} bpm${z?.n ? ` : ${TT('zone', 'zone')} ${z.n}` : ''}`);
    $('#hr-list', body).innerHTML = hrLogHTML(a.hr, a.start, true); bindDel();
  };
  $('#hr-save', body).onclick = add;
  inp.onkeydown = e => { if (e.key === 'Enter') add(); };
  const bindDel = () => $$('[data-hrdel]', body).forEach(b => b.onclick = () => { a.hr.splice(+b.dataset.hrdel, 1); save(); $('#hr-list', body).innerHTML = hrLogHTML(a.hr, a.start, true); bindDel(); });
  bindDel();
  setTimeout(() => inp.focus(), 150);
}
function hrStats(log) {
  if (!log?.length) return null;
  const v = log.map(x => x.bpm);
  return { n: v.length, min: Math.min(...v), max: Math.max(...v), avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) };
}
function hrLogHTML(log, start, editable = false) {
  if (!log?.length) return `<p class="empty">${TT('Aucun relevé pour l\'instant.', 'No readings yet.')}</p>`;
  const hp = hrProfile(), st = hrStats(log);
  // courbe des relevés dans le temps, bandes de zones en fond
  const W = 340, H = 150, P = { l: 34, r: 10, t: 10, b: 22 };
  const t0 = start || log[0].t, t1 = Math.max(log[log.length - 1].t, t0 + 60000);
  const y0 = Math.min(st.min - 10, hp ? Math.round(hp.max * .5) : st.min - 10), y1 = Math.max(st.max + 10, hp ? Math.round(hp.max * .95) : st.max + 10);
  const X = t => P.l + (t - t0) / (t1 - t0) * (W - P.l - P.r), Y = b => P.t + (1 - (b - y0) / (y1 - y0)) * (H - P.t - P.b);
  const bands = hp ? HR_ZONES.map(z => { const a = Math.max(y0, hp.max * z.from / 100), b = Math.min(y1, hp.max * z.to / 100); return b > a ? `<rect class="zb zb--${z.n}" x="${P.l}" width="${W - P.l - P.r}" y="${Y(b)}" height="${Y(a) - Y(b)}"/>` : ''; }).join('') : '';
  const path = log.map((x, i) => `${i ? 'L' : 'M'}${X(x.t).toFixed(1)},${Y(x.bpm).toFixed(1)}`).join('');
  const chart = `<svg class="chart hr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${TT('Courbe des BPM', 'BPM curve')}">${bands}
    <path class="curve" d="${path}"/>${log.map(x => `<circle class="dot" cx="${X(x.t)}" cy="${Y(x.bpm)}" r="3.5"/>`).join('')}
    ${[y0, Math.round((y0 + y1) / 2), y1].map(v => `<text x="${P.l - 5}" y="${Y(v) + 3}" text-anchor="end">${Math.round(v)}</text>`).join('')}
    <text x="${P.l}" y="${H - 6}">0 min</text><text x="${W - P.r}" y="${H - 6}" text-anchor="end">${Math.round((t1 - t0) / 60000)} min</text></svg>`;
  const zones = hp ? HR_ZONES.map(z => ({ z, c: log.filter(x => zoneOf(x.bpm, hp.max).n === z.n).length })).filter(x => x.c) : [];
  return `<div class="hr-sum">
      <div class="stats3 stats3--flat hr-stats">
        <div class="stat"><p class="stat__value">${st.min}</p><p class="stat__label">min</p></div>
        <div class="stat"><p class="stat__value">${st.avg}</p><p class="stat__label">${TT('moyenne', 'average')}</p></div>
        <div class="stat"><p class="stat__value">${st.max}</p><p class="stat__label">max</p></div>
      </div>
      ${log.length > 1 ? chart : ''}
      ${zones.length ? `<div class="hr-zones">${zones.map(({ z, c }) => `<div class="hr-zrow"><span class="zone__n zone--${z.n}" style="background:var(--zc)">Z${z.n}</span><span>${TT(z.label, ({ 1: 'Recovery', 2: 'Endurance', 3: 'Aerobic', 4: 'Threshold', 5: 'Maximum' })[z.n])}</span><span class="share__bar"><span style="width:${c / log.length * 100}%"></span></span><strong>${Math.round(c / log.length * 100)} %</strong></div>`).join('')}</div>` : ''}
      <p class="muted small">${TT(`${st.n} relevé${st.n > 1 ? 's' : ''}`, `${st.n} reading(s)`)}${hp ? TT(`, FC max théorique ${hp.max} bpm.`, `, theoretical max HR ${hp.max} bpm.`) : '.'}</p>
      ${editable ? `<div class="list list--plain hr-items">${log.map((x, i) => ({ x, i })).reverse().map(({ x, i }) => { const z = hp ? zoneOf(x.bpm, hp.max) : null; return `<div class="food-row"><span><strong>${x.bpm} bpm</strong>${z?.n ? ` <span class="pill pill--sm">Z${z.n}</span>` : ''}<br><span class="muted small">${fmtTime(new Date(x.t).toISOString())}, ${TT('à', 'at')} ${Math.max(0, Math.round((x.t - (start || x.t)) / 60000))} min</span></span><button class="icon-btn" type="button" data-hrdel="${i}" aria-label="${TT('Retirer', 'Remove')}">${ICON.trash}</button></div>`; }).join('')}</div>` : ''}
    </div>`;
}

function openFinish() {
  const a = state.active, s = sessionOf(a.code);
  const hst = hrStats(a.hr);
  if (hst) { if (!a.hrAvg) a.hrAvg = hst.avg; if (!a.hrMax) a.hrMax = hst.max; }
  const st = sessionStats(a), prs = detectPRs(a.items);
  const body = openSheet(`
    <h2 class="sheet__title">${st.done ? 'Bien joué !' : 'Terminer la séance ?'}</h2>
    <div class="stats3 stats3--flat">
      <div class="stat"><p class="stat__value">${st.minutes}</p><p class="stat__label">minutes</p></div>
      <div class="stat"><p class="stat__value">${st.done}/${st.total}</p><p class="stat__label">séries</p></div>
      <div class="stat"><p class="stat__value">${fmtVolume(st.volume)}</p><p class="stat__label">soulevés</p></div>
    </div>
    ${prs.length ? `<div class="prs"><h3 class="sub">${ICON.trophy} ${prs.length > 1 ? 'Nouveaux records' : 'Nouveau record'}</h3>${prs.map(p => `<p><strong>${esc(EX[p.ex].name)}</strong> : ${p.text}</p>`).join('')}</div>` : ''}
    <div id="fin-review">${reviewHTML(sessionReview({ items: a.items, code: a.code, rpe: a.rpe, minutes: st.minutes, live: true }))}</div>
    <h3 class="sub">Fréquence cardiaque <span class="muted small">(Apple Watch, facultatif)</span></h3>
    ${a.hr?.length ? hrLogHTML(a.hr, a.start) : ''}
    ${hrFieldsHTML(a.hrAvg, a.hrMax)}
    <div id="hr-fb">${hrFeedback(a.code, a.hrAvg, a.hrMax)}</div>
    <h3 class="sub">Ressenti de l'effort</h3>
    <div class="rpe" role="group" aria-label="Ressenti de 1 à 10">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-rpe="${i + 1}" aria-pressed="${String(a.rpe) === String(i + 1)}">${i + 1}</button>`).join('')}</div>
    <p class="small muted">1 très facile, 10 effort maximal.</p>
    <label class="field"><span>Notes (douleur, sensations, charges à revoir)</span><textarea id="fin-notes">${esc(a.notes)}</textarea></label>
    <button class="btn btn--block" id="save-session" type="button" style="background:${s.color}">Enregistrer la séance</button>
    <button class="btn btn--quiet btn--block" type="button" data-close>Continuer la séance</button>
  `, { label: 'Fin de séance' });
  const hrInput = () => {
    a.hrAvg = validBpm($('#hr-avg', body).value); a.hrMax = validBpm($('#hr-max', body).value); save();
    $('#hr-fb', body).innerHTML = hrFeedback(a.code, a.hrAvg, a.hrMax);
  };
  $('#hr-avg', body).oninput = hrInput; $('#hr-max', body).oninput = hrInput;
  $$('[data-rpe]', body).forEach(b => b.onclick = () => {
    a.rpe = b.dataset.rpe; save();
    $('#fin-review', body).innerHTML = reviewHTML(sessionReview({ items: a.items, code: a.code, rpe: a.rpe, minutes: st.minutes, live: true }));
    $$('[data-rpe]', body).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  $('#fin-notes').oninput = e => { a.notes = e.target.value; save(); };
  $('#save-session').onclick = () => {
    if (st.done === 0 && !confirm('Aucune série validée. Enregistrer quand même ?')) return;
    const n = saveActiveSession();
    closeSheet();
    toast(n ? `Séance enregistrée, ${plural(n, 'record')} battu${n > 1 ? 's' : ''} !` : 'Séance enregistrée.');
    render(); window.scrollTo(0, 0);
  };
}

/* Enregistre la séance en cours dans l'historique (bouton, annulation ou automatique). */
function lastActivity(a) {
  let t = a.start;
  for (const it of a.items || []) for (const x of it.sets || []) if (x.t && x.t > t) t = x.t;
  for (const r of a.hr || []) if (r.t > t) t = r.t;
  return t;
}
function saveActiveSession({ auto = false } = {}) {
  const a = state.active; if (!a) return 0;
  const s = sessionOf(a.code);
  const total = a.items.reduce((t, it) => t + it.sets.length, 0), done = a.items.reduce((t, it) => t + it.sets.filter(x => x.done).length, 0);
  const end = auto ? lastActivity(a) : Date.now();
  const minutes = Math.max(1, Math.round((end - a.start) / 60000));
  const prs = detectPRs(a.items);
  const hst = hrStats(a.hr);
  if (hst) { if (!a.hrAvg) a.hrAvg = hst.avg; if (!a.hrMax) a.hrMax = hst.max; }
  state.history.unshift({
    id: Date.now(), code: a.code, name: a.free ? `Séance libre : ${[...new Set(a.items.map(it => EX[it.ex]?.name).filter(Boolean))].slice(0, 2).join(', ')}${a.items.length > 2 ? '…' : ''}` : s.name, date: new Date(a.start).toISOString(),
    minutes, volume: sessionVolume(a.items), setsDone: done, setsTotal: total, auto: auto || undefined,
    rpe: a.rpe, notes: a.notes, hrAvg: a.hrAvg || null, hrMax: a.hrMax || null, hrLog: a.hr?.length ? a.hr : null, prs: prs.map(p => p.ex), light: !!a.light, checkin: a.checkin || null,
    items: a.items.map(it => ({ ex: it.ex, kind: it.kind, minutes: it.minutes, sets: it.sets.map(x => ({ ...x })) }))
  });
  state.active = null;
  stopTimer(); releaseAwake(); save();
  return prs.length;
}
/* Séance oubliée : enregistrée automatiquement 3 h après la dernière série validée. */
function autoSaveForgotten() {
  const a = state.active; if (!a || !a.items) return;
  if (Date.now() - lastActivity(a) < 3 * 36e5) return;
  const anyDone = a.items.some(it => it.sets.some(x => x.done));
  if (anyDone) { saveActiveSession({ auto: true }); setTimeout(() => toast('Ta dernière séance n\'avait pas été terminée : elle a été enregistrée automatiquement.', { duration: 6000 }), 600); }
  else { state.active = null; save(); }
}

/* ================= Chronos ================= */
let timer = null, timerInt = null, wakeLock = null;
/* Écran allumé pendant toute la séance (sauf si tu verrouilles toi-même le téléphone). */
async function keepAwake() {
  if (!state.active || document.hidden || !('wakeLock' in navigator) || wakeLock) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } catch (e) { /* refusé par le navigateur */ }
}
function releaseAwake() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }
document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAwake(); });
/* Minuteur officiel de l'iPhone via le raccourci « Repos VolleyFit » : visible sur l'écran verrouillé. */
const IOS_SHORTCUT = 'Repos VolleyFit';
function launchIosTimer(sec) {
  location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(IOS_SHORTCUT)}&input=text&text=${Math.max(5, Math.round(sec))}`;
}
function startTimer(sec, label, onDone, rest = false) {
  unlockAudio();
  if (rest && state.profile.iosTimer === 'auto') launchIosTimer(sec);
  timer = { end: Date.now() + sec * 1000, total: sec, label, onDone };
  $('#timer-label').textContent = label;
  $('#timer').hidden = false;
  $('#timer').classList.remove('is-done');
  clearInterval(timerInt);
  timerInt = setInterval(tick, 250);
  tick();
  keepAwake();
  $('#timer-ios').hidden = state.profile.iosTimer === 'off';
}
function tick() {
  if (!timer) return;
  const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  $('#timer-time').textContent = fmtClock(left);
  $('#timer-progress').style.width = `${100 - (left / timer.total) * 100}%`;
  focusTick(left, timer.total);
  if (state.profile.sound && left > 0 && left <= 3 && timer.lastPip !== left) { timer.lastPip = left; beep('pip'); }
  if (left <= 0) {
    clearInterval(timerInt);
    $('#timer').classList.add('is-done');
    $('#timer-label').textContent = 'Terminé, c\'est reparti';
    if (state.profile.sound) beep();
    const cb = timer.onDone; timer = null;
    focusTick(0, 1, true);
    if (cb) cb();
    setTimeout(() => { if (!timer) $('#timer').hidden = true; }, 3500);
  }
}
function stopTimer() {
  clearInterval(timerInt); timer = null; $('#timer').hidden = true;
  if (!state.active) releaseAwake();
}
$('#timer-ios').onclick = () => { if (timer) launchIosTimer(Math.ceil((timer.end - Date.now()) / 1000)); };
$('#timer-minus').onclick = () => { if (timer) { timer.end -= 15000; tick(); } };
$('#timer-plus').onclick = () => { if (timer) { timer.end += 15000; timer.total += 15; tick(); } };
$('#timer-skip').onclick = stopTimer;

let audioCtx;
/* Son : iOS n'autorise le son d'une page qu'après un toucher. On « débloque » donc le son
   au premier toucher (validation d'une série, bouton…), puis on le réutilise à la fin du repos.
   « transient » : le bip passe même en mode silencieux (iOS 17+) et baisse la musique un instant. */
function unlockAudio() {
  try {
    if (navigator.audioSession) { try { navigator.audioSession.type = 'transient'; } catch (e) {} }
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!audioCtx._unlocked) {
      const b = audioCtx.createBuffer(1, 1, 22050), src = audioCtx.createBufferSource();
      src.buffer = b; src.connect(audioCtx.destination); src.start(0);
      audioCtx._unlocked = true;
    }
  } catch (e) { /* son indisponible */ }
}
['touchend', 'pointerdown', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));
function tone(freq, start, dur, vol) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
  const t0 = audioCtx.currentTime + start;
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + .02);
}
function beep(kind = 'end') {
  try {
    if (!audioCtx) unlockAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (kind === 'pip') tone(740, 0, .12, .35);
    else { tone(988, 0, .22, .6); tone(988, .3, .22, .6); tone(1318, .6, .45, .6); }
  } catch (e) { /* son indisponible */ }
}
function tickElapsed() {
  const el = $('#elapsed');
  const fe = $('#f-elapsed');
  if (fe && state.active) fe.textContent = fmtClock(Math.floor((Date.now() - state.active.start) / 1000));
  if (el && state.active) el.textContent = fmtClock(Math.floor((Date.now() - state.active.start) / 1000)).replace(/^(\d+):/, (m, h) => h >= 60 ? `${Math.floor(h / 60)}:${pad(h % 60)}:` : m);
}
setInterval(tickElapsed, 1000);


/* ================= Mode focus : un exercice à la fois ================= */
let focusIdx = 0, focusAnim = null;
const GROUPS = [
  { k: 'pectoraux', label: 'Pectoraux', m: ['pectoraux'], sm: ['pectoraux'], side: 'front', crop: 'upper' },
  { k: 'dos', label: 'Dos', m: ['dorsaux', 'trapezes', 'lombaires'], sm: ['dorsaux'], side: 'back', crop: 'upper' },
  { k: 'epaules', label: 'Épaules', m: ['deltoides', 'deltoides-arr', 'coiffe'], sm: ['deltoides', 'deltoides-arr', 'coiffe'], side: 'front', crop: 'upper' },
  { k: 'bras', label: 'Bras', m: ['biceps', 'triceps'], sm: ['biceps', 'triceps'], side: 'front', crop: 'upper' },
  { k: 'abdos', label: 'Abdominaux', m: ['abdos', 'obliques'], sm: ['abdos', 'obliques'], side: 'front', crop: 'torso' },
  { k: 'cuisses', label: 'Cuisses', m: ['quadriceps', 'ischios', 'adducteurs'], sm: ['quadriceps', 'ischios'], side: 'front', crop: 'lower' },
  { k: 'fessiers', label: 'Fessiers', m: ['fessiers', 'abducteurs'], sm: ['fessiers'], side: 'back', crop: 'hips' },
  { k: 'mollets', label: 'Mollets', m: ['mollets'], sm: ['mollets'], side: 'back', crop: 'calves' }
];
const groupOf = e => GROUPS.find(g => g.m.includes(e?.target?.p?.[0]));
const ring = (pct, inner, label, id = '') => `<div class="ring" ${id ? `id="${id}"` : ''}>
    <svg viewBox="0 0 80 80" aria-hidden="true"><circle class="ring__bg" cx="40" cy="40" r="34"/><circle class="ring__fg" cx="40" cy="40" r="34" stroke-dasharray="213.6" stroke-dashoffset="${(213.6 * (1 - pct)).toFixed(1)}"/></svg>
    <span class="ring__v">${inner}</span><span class="ring__l">${label}</span></div>`;
function kgStep(id, kg) { const k = LOADS[id]?.[1]; return k === 'stack' ? 5 : k === 'cable' && kg < 10 ? 1.25 : 2.5; }

function openFocus(i) {
  const a = state.active; if (!a) return;
  const first = a.items.findIndex(it => !it.sets.every(x => x.done));
  focusIdx = i ?? Math.max(0, first);
  let ov = $('#focus');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'focus'; ov.className = 'focus';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Mode focus');
    document.body.appendChild(ov);
  }
  document.body.classList.add('has-sheet', 'has-focus');
  drawFocus();
}
function closeFocus() {
  focusAnim?.stop(); focusAnim = null;
  $('#focus')?.remove();
  document.body.classList.remove('has-sheet', 'has-focus');
  if (state.active && view === 'today') renderWorkout($('#view-today'));
}
function focusTick(left, total, done) {
  const r = $('#f-rest'); if (!r) return;
  const fg = $('.ring__fg', r), v = $('.ring__v', r);
  if (done) { v.textContent = 'Go'; fg.setAttribute('stroke-dashoffset', '0'); r.classList.add('is-go'); return; }
  r.classList.remove('is-go');
  v.textContent = fmtClock(left);
  fg.setAttribute('stroke-dashoffset', (213.6 * (1 - left / total)).toFixed(1));
}
function drawFocus() {
  const a = state.active, ov = $('#focus');
  if (!a || !ov) return closeFocus();
  focusAnim?.stop();
  const it = a.items[focusIdx], e = EX[it.ex], n = a.items.length, s = sessionOf(a.code);
  const grp = it.kind === 'warmup' ? 'Échauffement' : it.cooldown ? 'Retour au calme' : groupOf(e)?.label || e.zone;
  const isTime = it.kind === 'warmup' || it.kind === 'time';
  const firstOpen = it.sets.findIndex(x => !x.done), allDone = firstOpen < 0, cur = allDone ? it.sets.length - 1 : firstOpen;
  const st = it.sets[cur], f = it.kind === 'hold' ? 'sec' : 'reps';
  const sug = isTime ? null : suggestFor(it), prev = lastSetsFor(it.ex), pv = prev[cur] || prev[prev.length - 1];
  const kgVal = st.kg || (sug ? String(sug.kg) : (pv?.kg ?? ''));
  const repVal = st[f] || (pv?.[f] ?? targetNum(it));
  const doneN = it.sets.filter(x => x.done).length;
  const doneSets = it.sets.map((x, j) => ({ ...x, j })).filter(x => x.done).reverse();

  ov.innerHTML = `
    <header class="focus__top">
      <button class="icon-btn" type="button" data-fclose aria-label="Revenir à la liste">${ICON.left}</button>
      <p><strong>${focusIdx + 1}/${n}</strong> ${esc(grp)}</p>
      <span class="clock" id="f-elapsed">0:00</span>
    </header>
    <div class="focus__hr">${hrChip()}</div>
    <header hidden>
    </header>
    <div class="focus__body">
      <div class="focus__stage">
        <div id="f-anim" class="focus__fig"></div>
        <div class="focus__tools">
          ${!isTime && it.slot !== undefined && TEMPLATE[a.code] && (e.alt?.length || TEMPLATE[a.code]?.items[it.slot]?.pool?.length > 1) ? `<button class="tool" type="button" data-fswap aria-label="Remplacer l'exercice">${ICON.swap}</button>` : ''}
          <button class="tool" type="button" data-finfo aria-label="Comment faire">i</button>
        </div>
      </div>
      <h2 class="focus__name">${esc(e.name)}</h2>
      ${primaryText(e) ? `<p class="focus__mus">${esc(primaryText(e))}</p>` : ''}
      ${e.loaded && sug ? `<p class="focus__rec">${sug.start ? `${isAssisted(it.ex) ? 'Contrepoids' : 'Charge'} conseillée` : 'Même charge que la dernière fois'} : <strong>${fmtKg(sug.kg)} kg</strong>${sug.up ? ` <button class="pill pill--btn" type="button" data-fbump>${sug.assisted ? 'Contrepoids' : 'Monter à'} ${fmtKg(sug.next)} kg</button>` : ''}</p>` : ''}
      ${state.exNotes[it.ex] ? `<p class="wx__note">Mes réglages : ${esc(state.exNotes[it.ex])}</p>` : ''}
      ${isTime ? `
        <div class="rings">${ring(it.sets[0].done ? 1 : 0, `${it.minutes}`, 'minutes')}${ring(1, fmtClock(0), 'Chrono', 'f-rest')}</div>
        <div class="btn-row"><button class="btn btn--ghost" type="button" data-frun style="flex:1">${ICON.play} Lancer ${it.minutes} min</button></div>
        <button class="btn btn--block btn--big" type="button" data-fvalid style="background:${s.color}" ${it.sets[0].done ? 'disabled' : ''}>${it.sets[0].done ? 'Fait' : 'C\'est fait'}</button>`
      : `
        <div class="rings">
          ${ring(1, esc(repVal), it.kind === 'hold' ? 'secondes' : 'répétitions')}
          ${ring(1, fmtClock(it.rest), 'repos', 'f-rest')}
          ${ring(doneN / it.sets.length, `${doneN}/${it.sets.length}`, 'séries')}
        </div>
        ${state.profile.iosTimer !== 'off' ? `<button class="btn btn--ghost btn--sm ios-timer-btn" type="button" data-fios>⏱ ${TT('Minuteur iPhone', 'iPhone timer')} ${fmtClock(it.rest)}</button>` : ''}
        <div class="focus__inputs">
          ${e.loaded ? `<div class="stepper2"><button type="button" data-fkg="-1" aria-label="Moins lourd">−</button><label><input id="f-kg" inputmode="decimal" value="${esc(kgVal)}" aria-label="Charge en kg"><small>kg</small></label><button type="button" data-fkg="1" aria-label="Plus lourd">+</button></div>` : ''}
          <div class="stepper2"><button type="button" data-frep="-1" aria-label="Moins">−</button><label><input id="f-rep" inputmode="numeric" value="${esc(repVal)}" aria-label="${f === 'sec' ? 'Secondes' : 'Répétitions'}"><small>${f === 'sec' ? 'sec' : 'rép.'}</small></label><button type="button" data-frep="1" aria-label="Plus">+</button></div>
        </div>
        ${it.kind === 'hold' && !allDone ? `<button class="btn btn--ghost btn--block" type="button" data-fhold>${ICON.play} Chrono ${it.hold} s</button>` : ''}
        <button class="btn btn--block btn--big" type="button" data-fvalid style="background:${s.color}" ${allDone ? 'disabled' : ''}>${allDone ? 'Exercice terminé' : `Valider la série ${cur + 1}`}</button>
        ${allDone ? '' : `<button class="btn btn--quiet btn--block" type="button" data-faddset>+ Ajouter une série</button>`}
        ${doneSets.length ? `<ol class="focus__log">${doneSets.map(x => `<li><span>N°${x.j + 1}</span><span>${e.loaded && num(x.kg) ? `${fmtKg(num(x.kg))} kg × ` : ''}${x[f]} ${f === 'sec' ? 's' : 'rép.'}</span><time>${x.t ? fmtTime(new Date(x.t).toISOString()) : ''}</time></li>`).join('')}</ol>` : ''}`}
    </div>
    <nav class="focus__nav">
      <button class="btn btn--ghost" type="button" data-fprev ${focusIdx === 0 ? 'disabled' : ''}>${ICON.left} Précédent</button>
      <button class="btn" type="button" data-fnext style="background:${s.color}">${focusIdx === n - 1 ? 'Terminer la séance' : 'Suivant'} ${ICON.right}</button>
    </nav>`;

  focusAnim = FIG.mount($('#f-anim', ov), e.fig, { label: 'Animation : ' + e.name, target: e.target });
  if (timer) focusTick(Math.max(0, Math.ceil((timer.end - Date.now()) / 1000)), timer.total);
  tickElapsed();

  const readInputs = () => {
    if ($('#f-kg', ov)) st.kg = $('#f-kg', ov).value.replace(',', '.');
    if ($('#f-rep', ov)) st[f] = $('#f-rep', ov).value;
    save();
  };
  ov.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (b.hasAttribute('data-hr-open')) return openHrLog();
    if ('fclose' in d) return closeFocus();
    if ('finfo' in d) return openExercise(it.ex);
    if ('fswap' in d) return openSwap(focusIdx);
    if ('fprev' in d) { focusIdx = Math.max(0, focusIdx - 1); return drawFocus(); }
    if ('fnext' in d) { if (focusIdx === n - 1) { closeFocus(); return openFinish(); } focusIdx++; return drawFocus(); }
    if (d.fkg) { const inp = $('#f-kg', ov), v = num(inp.value) || 0, stp = kgStep(it.ex, v); inp.value = String(Math.max(0, +(v + stp * +d.fkg).toFixed(2))); return readInputs(); }
    if (d.frep) { const inp = $('#f-rep', ov), v = num(inp.value) || 0; inp.value = String(Math.max(1, v + +d.frep)); readInputs(); $('.rings .ring__v', ov).textContent = inp.value; return; }
    if ('fios' in d) return launchIosTimer(timer ? Math.ceil((timer.end - Date.now()) / 1000) : it.rest);
    if ('fbump' in d) { const sg = suggestFor(it); if (sg?.next != null) { it.sets.forEach(x => { if (!x.done) x.kg = String(sg.next); }); save(); toast(`Charge réglée à ${fmtKg(sg.next)} kg.`); } return drawFocus(); }
    if ('faddset' in d) { it.sets.push({ kg: '', reps: '', sec: '', done: false }); save(); return drawFocus(); }
    if ('frun' in d) return startTimer(it.minutes * 60, e.name, () => { if (state.active === a) { it.sets[0].done = true; it.sets[0].t = Date.now(); save(); if ($('#focus')) drawFocus(); } });
    if ('fhold' in d) return startTimer(it.hold, `${e.name}, tiens bon`);
    if ('fvalid' in d) {
      if (isTime) { it.sets[0].done = true; it.sets[0].t = Date.now(); save(); }
      else { readInputs(); toggleSet(focusIdx, cur); }
      const finished = it.sets.every(x => x.done);
      if (finished && focusIdx < n - 1) { toast(`${e.name} terminé. Exercice suivant !`); focusIdx++; }
      return drawFocus();
    }
  };
  ov.oninput = ev => { if (ev.target.id === 'f-kg' || ev.target.id === 'f-rep') readInputs(); };
}

/* ================= Muscles : groupes et zones ciblées ================= */
let musMode = 'groupes', musGroup = null, musPeriod = 'semaine';
function renderMuscles() {
  const el = $('#view-muscles');
  const head = `<h1 class="page-title">Muscles</h1>
    <div class="seg seg--wide" role="tablist">${[['groupes', 'Par groupe'], ['zones', 'Zones ciblées']].map(([k, l]) =>
      `<button type="button" data-mmode="${k}" aria-pressed="${k === musMode}">${l}</button>`).join('')}</div>`;
  if (musMode === 'zones') renderZones(el, head);
  else if (musGroup) renderGroup(el, musGroup, head);
  else renderGroups(el, head);
  $$('[data-mmode]', el).forEach(b => b.onclick = () => { musMode = b.dataset.mmode; musGroup = null; renderMuscles(); });
}
const NOT_STRENGTH = id => ['Cardio', 'Étirements'].includes(EX[id].zone) || /^echauffement|^etirements/.test(id);
const exOfGroup = (g, which = 'p') => Object.entries(EX).filter(([id, e]) => {
  if (NOT_STRENGTH(id)) return false;
  const p = e.target?.p || [], s = e.target?.s || [];
  if (which === 'p') return g.m.includes(p[0]);
  return !g.m.includes(p[0]) && [...p.slice(1), ...s].some(m => g.sm.includes(m));
}).map(([id]) => id);
function renderGroups(el, head) {
  el.innerHTML = `${head}
    <div class="groups">${GROUPS.map(g => `
      <button class="group-card" type="button" data-group="${g.k}">
        <span class="group-card__txt"><strong>${g.label}</strong><span>${exOfGroup(g).length} exercices</span></span>
        <span class="group-card__fig">${FIG.muscleFigure(g.side, { p: g.m }, g.crop, null, g.label)}</span>
      </button>`).join('')}
      <button class="group-card group-card--plain" type="button" data-group="cardio"><span class="group-card__txt"><strong>Cardio et récupération</strong><span>${Object.values(EX).filter(e => e.zone === 'Cardio' || e.zone === 'Étirements').length} exercices</span></span><span class="group-card__fig">${exThumb('tapis')}</span></button>
    </div>`;
  $$('[data-group]', el).forEach(b => b.onclick = () => { musGroup = b.dataset.group; renderMuscles(); window.scrollTo(0, 0); });
}
function renderGroup(el, key, head) {
  const g = GROUPS.find(x => x.k === key);
  const atHome = id => EX[id].zone === 'Maison';
  const main = (g ? exOfGroup(g, 'p') : Object.keys(EX).filter(id => ['Cardio', 'Étirements'].includes(EX[id].zone))).filter(id => !atHome(id));
  const also = g ? exOfGroup(g, 's').filter(id => !main.includes(id) && !atHome(id)) : [];
  const home = g ? [...exOfGroup(g, 'p'), ...exOfGroup(g, 's')].filter((id, i, arr) => atHome(id) && arr.indexOf(id) === i && !/^echauffement|^etirements/.test(id))
    : Object.keys(EX).filter(id => /^echauffement-maison|^etirements-maison/.test(id));
  const homeMain = g ? home.filter(id => g.m.includes(EX[id].target.p?.[0])) : home;
  const homeAlso = home.filter(id => !homeMain.includes(id));
  const row = id => `<button class="row" type="button" data-ex="${id}">${exThumb(id, 'thumb--sm')}<span class="row__main"><strong>${esc(EX[id].name)}</strong><br><span class="muted small">${esc(EX[id].equip)}</span></span>${ICON.right}</button>`;
  el.innerHTML = `${head}
    <button class="btn btn--quiet" type="button" id="grp-back">${ICON.left} Tous les groupes</button>
    <section class="group-hero">
      <div><h1 class="page-title">${g ? g.label : 'Cardio et récupération'}</h1>${g ? `<p>${g.m.map(m => MUSCLES[m]).join(', ')}</p>` : ''}</div>
      ${g ? `<div class="group-hero__fig">${FIG.muscleFigure(g.side, { p: g.m }, 'full', null, g.label)}</div>` : ''}
    </section>
    <section class="panel"><h2>Exercices principaux</h2><div class="list">${main.map(row).join('')}</div></section>
    ${also.length ? `<section class="panel"><h2>Travaillent aussi ${g ? g.label.toLowerCase() : ''}</h2><div class="list">${also.map(row).join('')}</div></section>` : ''}
    ${home.length ? `<section class="panel home-panel"><div class="panel__head"><h2>À la maison, sans machine</h2><span class="pill">poids du corps ou élastique</span></div>
      <div class="list">${[...homeMain, ...homeAlso].map(row).join('')}</div></section>` : ''}`;
  $('#grp-back', el).onclick = () => { musGroup = null; renderMuscles(); };
  $$('[data-ex]', el).forEach(b => b.onclick = () => openExercise(b.dataset.ex));
}
function periodSessions(p) {
  if (p === 'derniere') return state.history.slice(0, 1);
  const since = p === 'semaine' ? Date.now() - 7 * 864e5 : p === 'mois' ? Date.now() - 30 * 864e5 : 0;
  return state.history.filter(h => +new Date(h.date) >= since);
}
function renderZones(el, head) {
  const list = periodSessions(musPeriod), count = {};
  for (const h of list) for (const it of h.items || []) {
    const e = EX[it.ex]; if (!e || it.kind === 'warmup' || it.kind === 'time') continue;
    const n = (it.sets || []).filter(x => x.done).length;
    (e.target?.p || []).forEach(m => count[m] = (count[m] || 0) + n);
    (e.target?.s || []).forEach(m => count[m] = (count[m] || 0) + n / 2);
  }
  const total = Object.values(count).reduce((a, b) => a + b, 0), max = Math.max(0, ...Object.values(count));
  const levels = Object.fromEntries(Object.entries(count).map(([k, v]) => [k, v >= max * .66 ? 3 : v >= max * .33 ? 2 : 1]));
  const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const missing = Object.keys(MUSCLES).filter(k => !count[k]);
  el.innerHTML = `${head}
    <h2 class="sub">Focus sur les zones ciblées</h2>
    <div class="seg" role="group" aria-label="Période">${[['derniere', 'Dernière'], ['semaine', 'Semaine'], ['mois', 'Mois'], ['tout', 'Tout']].map(([k, l]) =>
      `<button type="button" data-period="${k}" aria-pressed="${k === musPeriod}">${l}</button>`).join('')}</div>
    ${total ? `
    <section class="panel zones-map">
      <div class="zones-map__figs">
        <div>${FIG.muscleFigure('front', {}, 'full', levels, 'Face')}<p>Face</p></div>
        <div>${FIG.muscleFigure('back', {}, 'full', levels, 'Dos')}<p>Dos</p></div>
      </div>
      <p class="heat"><span class="heat__sw l1"></span>peu<span class="heat__sw l2"></span>moyen<span class="heat__sw l3"></span>beaucoup</p>
    </section>
    <section class="panel">
      <div class="panel__head"><h2>Répartition du travail</h2><span class="muted small">${plural(list.length, 'séance')}</span></div>
      <div class="share">${ranked.map(([k, v]) => `<div class="share__row"><span class="share__pct">${Math.round(v / total * 100)} %</span><span class="share__name">${MUSCLES[k]}</span><span class="share__bar"><span style="width:${v / max * 100}%"></span></span></div>`).join('')}</div>
      <p class="muted small">Part des séries travaillant chaque muscle (muscle principal 1 série, secondaire une demi-série).</p>
    </section>
    ${missing.length ? `<p class="callout"><strong>Pas travaillés sur la période :</strong> ${missing.map(k => MUSCLES[k].toLowerCase()).join(', ')}.</p>` : ''}`
    : `<p class="empty">Aucune séance sur cette période. Termine une séance pour voir quels muscles tu as travaillés.</p>`}`;
  $$('[data-period]', el).forEach(b => b.onclick = () => { musPeriod = b.dataset.period; renderMuscles(); });
}

/* ================= Programme ================= */
let progMode = 'plan';
function renderProgram() {
  const el = $('#view-program');
  const head = `<h1 class="page-title">Entraînement</h1>
    <div class="seg seg--wide" role="tablist">${[['plan', 'Mon programme'], ['lib', 'Tous les exercices']].map(([k, l]) =>
      `<button type="button" data-pmode="${k}" aria-pressed="${k === progMode}">${l}</button>`).join('')}</div>`;
  if (progMode === 'lib') { renderLibrary(el, head); }
  else renderPlan(el, head);
  $$('[data-pmode]', el).forEach(b => b.onclick = () => { progMode = b.dataset.pmode; renderProgram(); });
}
function renderPlan(el, head) {
  const p = state.profile, v = VARIETY[p.variety];
  el.innerHTML = `
    ${head}
    <p>Trois séances par semaine à Basic-Fit, plus une séance de récupération après les matchs. Chaque séance dure entre 50 et 70 minutes, dont ${p.warmupMin} minutes d'échauffement cardio.</p>
    <p class="callout"><strong>Structure fixe, exercices variés.</strong> Chaque séance garde les mêmes familles de mouvements. Dans chaque famille, l'exercice change : ${v.label.toLowerCase() === 'jamais' ? 'jamais (réglage actuel)' : v.label.toLowerCase()}. <button class="link" type="button" id="goto-variety">Régler</button></p>
    <p class="muted small">Cycles de 4 semaines : 3 semaines où tu augmentes les charges, puis une semaine allégée.</p>
    ${Object.entries(SESSIONS).map(([k, s]) => `
      <article class="panel prog" style="--sess:${s.color}">
        <div class="panel__head"><h2>Séance ${k}</h2><span class="muted small">${estimateMinutes(s)} min</span></div>
        <p><strong>${esc(s.name)}.</strong> ${esc(s.goal)}</p>
        <div class="list">
          <button class="row" type="button" data-ex="${warmupFor(k)}">${exThumb(warmupFor(k), 'thumb--sm')}<span><span class="fam">Échauffement</span><br><strong>${esc(EX[warmupFor(k)].name)}</strong><br><span class="muted small">${warmMinFor(k)} min</span></span></button>
          ${fitSession(k).plan.map(it => { const id = EX[state.swaps[swapKey(k, it.slot)]] ? state.swaps[swapKey(k, it.slot)] : it.ex; const varies = (TEMPLATE[k].items[it.slot].pool || []).length > 1;
            return `<button class="row" type="button" data-ex="${id}">${exThumb(id, 'thumb--sm')}<span><span class="fam">${esc(TEMPLATE[k].items[it.slot].slot)}${varies ? ' <span class="fam__var">variable</span>' : ''}</span><br><strong>${esc(EX[id].name)}</strong><br><span class="muted small">${targetText(it)}</span></span></button>`; }).join('')}
          ${fitSession(k).cool ? `<button class="row" type="button" data-ex="${s.cooldown.ex}">${exThumb(s.cooldown.ex, 'thumb--sm')}<span><span class="fam">Retour au calme</span><br><strong>${esc(EX[s.cooldown.ex].name)}</strong><br><span class="muted small">${fitSession(k).cool} min</span></span></button>` : ''}
        </div>
        <div class="btn-row">
          <button class="btn" style="background:${s.color};flex:1" data-start="${k}" type="button">${ICON.play} Commencer</button>
          ${TEMPLATE[k].fixed ? '' : `<button class="btn btn--ghost" type="button" data-reroll="${k}" ${state.active ? 'disabled' : ''}>${ICON.swap} Autres exercices</button>`}
        </div>
      </article>`).join('')}
    <p class="muted small">Ce programme ne remplace pas l'avis d'un médecin ou d'un kiné, surtout en cas de douleur ou de blessure.</p>`;
  $$('[data-ex]', el).forEach(b => b.onclick = () => openExercise(b.dataset.ex));
  $$('[data-start]', el).forEach(b => b.onclick = () => startSession(b.dataset.start));
  $$('[data-reroll]', el).forEach(b => b.onclick = () => rerollSession(b.dataset.reroll));
  $('#goto-variety', el).onclick = () => { go('profile'); setTimeout(() => $('#variety-section')?.scrollIntoView({ block: 'start' }), 50); };
}

/* ================= Bibliothèque ================= */
let libQuery = '', libZone = 'Tous';
function renderLibrary(el, head) {
  el.innerHTML = `
    ${head}
    <p class="muted">${Object.keys(EX).length} exercices, tous sur les machines, la Smith ou les poulies de Basic-Fit.</p>
    <label class="search">${ICON.search}<input type="search" id="lib-q" placeholder="Exercice, machine ou muscle" value="${esc(libQuery)}" aria-label="Rechercher"></label>
    <div class="chips chips--scroll" role="group" aria-label="Zone de la salle">${['Tous', ...ZONES].map(z => `<button class="chip" type="button" data-zone="${z}" aria-pressed="${z === libZone}">${z}</button>`).join('')}</div>
    <div id="lib-grid" class="lib-grid"></div>`;
  const draw = () => {
    const q = libQuery.trim().toLowerCase();
    const list = Object.entries(EX).filter(([, e]) =>
      (libZone === 'Tous' || e.zone === libZone) &&
      (!q || `${e.name} ${e.equip} ${muscleNames([...(e.target?.p || []), ...(e.target?.s || [])]).join(' ')} ${(MACHINE_NAMES[id] || []).join(' ')}`.toLowerCase().includes(q) || searchMachine(q, 12).some(r => r.id === id)));
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
    ${hrHistoryHTML()}
    <section class="panel">
      <h2>Séances</h2>
      ${monthSessions.length ? `<div class="list">${monthSessions.map(h => `
        <button class="row" type="button" data-session="${h.id}">
          <span class="tag" style="--sess:${sessionOf(h.code).color}">${esc(h.code)}</span>
          <span class="row__main"><strong>${esc(h.name)}</strong><br><span class="muted small">${fmtDateTime(h.date)}, ${h.minutes} min${h.rpe ? `, effort ${esc(h.rpe)}/10` : ''}${h.hrAvg ? `, ${h.hrAvg} bpm` : ''}</span></span>
          ${h.prs?.length ? `<span class="row__value">${ICON.trophy}${h.prs.length}</span>` : ''}
        </button>`).join('')}</div>` : '<p class="empty">Aucune séance ce mois-ci.</p>'}
    </section>`;
  $$('[data-cal]', el).forEach(b => b.onclick = () => { calOffset = Math.min(0, calOffset + +b.dataset.cal); renderHistory(el); });
  $$('[data-session]', el).forEach(b => b.onclick = () => openSession(b.dataset.session));
}

function hrHistoryHTML() {
  const pts = [...state.history].reverse().filter(h => h.hrAvg).map(h => ({ date: h.date, v: h.hrAvg }));
  if (!pts.length) return '';
  const hp = hrProfile();
  return `<section class="panel">
    <div class="panel__head"><h2>BPM moyen par séance</h2>${hp ? `<span class="muted small">FC max ${hp.max}</span>` : ''}</div>
    ${lineChart(pts, 'bpm', 'BPM moyen par séance')}
  </section>`;
}

function openSession(id) {
  const h = state.history.find(x => String(x.id) === String(id));
  if (!h) return;
  const body = openSheet(`
    <h2 class="sheet__title">${esc(h.name)}</h2>
    <p class="muted">${fmtDateTime(h.date)}${h.auto ? ', enregistrée automatiquement' : ''}</p>
    <div class="stats3 stats3--flat">
      <div class="stat"><p class="stat__value">${h.minutes}</p><p class="stat__label">minutes</p></div>
      <div class="stat"><p class="stat__value">${h.setsDone}/${h.setsTotal}</p><p class="stat__label">séries</p></div>
      <div class="stat"><p class="stat__value">${fmtVolume(h.volume || 0)}</p><p class="stat__label">soulevés</p></div>
    </div>
    ${reviewHTML(sessionReview({ items: h.items || [], code: h.code, rpe: h.rpe, minutes: h.minutes }))}
    <h3 class="sub">${TT('Détail', 'Details')}</h3>
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
    <h3 class="sub">Fréquence cardiaque</h3>
    ${h.hrLog?.length ? hrLogHTML(h.hrLog, +new Date(h.date)) : ''}
    ${hrFieldsHTML(h.hrAvg, h.hrMax)}
    <div id="hr-fb">${h.hrAvg || h.hrMax ? hrFeedback(h.code, h.hrAvg, h.hrMax) : '<p class="muted small">Recopie ici les BPM affichés par ta montre pour cette séance.</p>'}</div>
    <button class="btn btn--danger btn--block" type="button" id="del-session">Supprimer cette séance</button>`, { label: h.name, onClose: () => { if (view === 'progress') renderProgress(); } });
  const hrInput = () => {
    h.hrAvg = validBpm($('#hr-avg', body).value); h.hrMax = validBpm($('#hr-max', body).value); save();
    $('#hr-fb', body).innerHTML = h.hrAvg || h.hrMax ? hrFeedback(h.code, h.hrAvg, h.hrMax) : '';
  };
  $('#hr-avg', body).oninput = hrInput; $('#hr-max', body).oninput = hrInput;
  $('#del-session', body).onclick = () => {
    if (!confirm('Supprimer cette séance de l\'historique ?')) return;
    state.history = state.history.filter(x => x !== h);
    save(); closeSheet(); render();
  };
}

/* ================= Profil ================= */
function hrZonesHTML() {
  const hp = hrProfile();
  if (!hp) return '<p class="muted small">Choisis ton sexe et indique ton âge dans la section « Toi » : la fréquence cardiaque maximale et les zones se calculent à partir de là.</p>';
  return `<p class="hr-max"><strong>${hp.max} bpm</strong> FC max théorique <span class="muted small">(${hp.formula}, ${hp.age} ans)</span></p>
    <div class="zones">${HR_ZONES.map(z => `<div class="zone zone--${z.n}"><span class="zone__n">Z${z.n}</span><span class="zone__txt"><strong>${z.label}</strong> <span class="muted small">${z.desc}</span></span><span class="zone__bpm">${zoneBpm(z, hp.max)}</span></div>`).join('')}</div>
    <p class="muted small">Cible pendant tes séances : zones 2 et 3 en moyenne, zone 1 ou 2 pour la récupération. La formule est une estimation à plus ou moins 10 bpm : si ta montre mesure régulièrement plus haut, c'est que ta vraie FC max est plus élevée.</p>`;
}

function openIosGuide() {
  const body = openSheet(`
    <h2 class="sheet__title">${TT('Minuteur sur l\'écran verrouillé', 'Timer on the lock screen')}</h2>
    <p class="muted">${TT('À faire une seule fois. Le minuteur officiel de l\'iPhone s\'affiche ensuite sur l\'écran verrouillé et sonne même téléphone verrouillé.', 'Do this once. The official iPhone timer then shows on the lock screen and rings even when locked.')}</p>
    <ol class="steps">
      <li>${TT('Ouvre l\'app <strong>Raccourcis</strong> et touche <strong>+</strong> en haut à droite.', 'Open the <strong>Shortcuts</strong> app and tap <strong>+</strong> at the top right.')}</li>
      <li>${TT('Touche <strong>Ajouter une action</strong>, cherche <strong>minuteur</strong> et choisis <strong>Démarrer le minuteur</strong>.', 'Tap <strong>Add Action</strong>, search <strong>timer</strong> and choose <strong>Start Timer</strong>.')}</li>
      <li>${TT('Touche le nombre (30 par défaut), puis choisis <strong>Entrée du raccourci</strong>. Touche l\'unité et choisis <strong>secondes</strong>.', 'Tap the number (30 by default), then choose <strong>Shortcut Input</strong>. Tap the unit and choose <strong>seconds</strong>.')}</li>
      <li>${TT('Touche le nom en haut et renomme le raccourci exactement :', 'Tap the name at the top and rename the shortcut exactly:')} <strong>${IOS_SHORTCUT}</strong></li>
      <li>${TT('Touche <strong>OK</strong>. C\'est prêt.', 'Tap <strong>Done</strong>. You\'re all set.')}</li>
    </ol>
    <p class="callout">${TT('Pour tester, touche le bouton ci-dessous : un minuteur de 10 secondes doit démarrer. Pour revenir, touche « ◀ VolleyFit » en haut à gauche de l\'écran.', 'To test, tap the button below: a 10-second timer should start. To come back, tap “◀ VolleyFit” at the top left of the screen.')}</p>
    <button class="btn btn--block" type="button" id="ios-test">⏱ ${TT('Tester avec 10 secondes', 'Test with 10 seconds')}</button>
  `, { label: TT('Minuteur iPhone', 'iPhone timer') });
  $('#ios-test', body).onclick = () => launchIosTimer(10);
}

function renderProfile() {
  const el = $('#view-profile'), p = state.profile;
  el.innerHTML = `
    <h1 class="page-title">Profil</h1>
    <section class="panel form" id="id-section">
      <h2>Toi</h2>
      <label class="field"><span>Prénom</span><input id="p-name" value="${esc(p.name)}" autocomplete="given-name"></label>
      ${identityHTML('p')}
      <p class="id-status" id="id-status"></p>
    </section>

    <section class="panel form">
      <h2>Niveau de force</h2>
      <p class="muted small">Sert à proposer une charge de départ sur chaque exercice. Après ta première séance, l'app se base sur tes vraies charges.</p>
      <div class="goal-pick" role="group" aria-label="Niveau de force">${Object.entries(LEVELS).map(([k, l]) => `
        <button type="button" data-level="${k}" aria-pressed="${p.level === k}"><strong>${l.label}</strong><span>${esc(l.desc)}</span></button>`).join('')}</div>
    </section>

    <section class="panel form" id="variety-section">
      <h2>Variété des exercices</h2>
      <p class="muted small">La structure des séances reste la même. Choisis quand l'app change les exercices dans chaque famille de mouvement.</p>
      <div class="goal-pick" role="group" aria-label="Variété des exercices">${Object.entries(VARIETY).map(([k, v]) => `
        <button type="button" data-variety="${k}" aria-pressed="${p.variety === k}"><strong>${esc(v.label)}</strong><span>${esc(v.desc)}${k === 'cycle' ? ' Conseillé.' : ''}</span></button>`).join('')}</div>
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

    <section class="panel form" id="hr-section">
      <h2>Zones cardiaques</h2>
      <div id="hr-zones">${hrZonesHTML()}</div>
    </section>

    <section class="panel form">
      <h2>Langue</h2>
      <div class="seg" role="group" aria-label="Langue">${[['fr', 'Français'], ['en', 'English']].map(([k, l]) => `<button type="button" data-lang="${k}" aria-pressed="${(p.lang || 'fr') === k}" lang="${k}">${l}</button>`).join('')}</div>
    </section>

    <section class="panel form">
      <h2>Apparence</h2>
      <div class="seg" role="group" aria-label="Thème">${[['system', 'Système'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) =>
        `<button type="button" data-theme-choice="${k}" aria-pressed="${p.theme === k}">${l}</button>`).join('')}</div>
      <p class="muted small">Système suit le réglage clair ou sombre de ton téléphone.</p>
    </section>

    <section class="panel form">
      <h2>Chrono de repos</h2>
      <p class="muted small">${TT('L\'écran reste allumé pendant toute la séance, sauf si tu verrouilles le téléphone.', 'The screen stays on for the whole session, unless you lock your phone.')}</p>
      <label class="switch"><input type="checkbox" id="p-sound" ${p.sound ? 'checked' : ''}><span>Bip à la fin du repos</span></label>
      <button class="btn btn--ghost btn--sm" type="button" id="p-sound-test">🔊 ${TT('Tester le bip', 'Test the beep')}</button>
      <div class="field"><span>${TT('Minuteur iPhone sur l\'écran verrouillé', 'iPhone timer on the lock screen')}</span>
        <div class="seg" role="group" aria-label="${TT('Minuteur iPhone', 'iPhone timer')}">${[['off', TT('Désactivé', 'Off')], ['button', TT('Bouton', 'Button')], ['auto', TT('Automatique', 'Automatic')]].map(([k, l]) => `<button type="button" data-ios="${k}" aria-pressed="${p.iosTimer === k}">${l}</button>`).join('')}</div>
      </div>
      <p class="muted small">${TT('Bouton : « ⏱ Minuteur iPhone » à côté du chrono de repos. Automatique : le minuteur iPhone démarre à chaque repos. Il faut d\'abord créer le raccourci une fois.', 'Button: “⏱ iPhone timer” next to the rest timer. Automatic: the iPhone timer starts at every rest. You first need to create the shortcut once.')}</p>
      <button class="btn btn--ghost btn--block" type="button" id="ios-guide">${TT('Créer le raccourci (1 minute)', 'Create the shortcut (1 minute)')}</button>
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
  $('#p-match').onchange = e => { p.matchDay = e.target.value === '' ? null : +e.target.value; save(); preview(); };
  $('#p-cycle').onchange = e => { if (e.target.value) { p.cycleStart = e.target.value; save(); renderProfile(); } };
  $('#p-wmachine').onchange = e => { p.warmupMachine = e.target.value; save(); };
  $('#p-gw').oninput = e => { p.goalWeight = num(e.target.value) ?? ''; save(); };
  $('#p-gf').oninput = e => { p.goalFat = num(e.target.value) ?? ''; save(); };
  $('#p-sound').onchange = e => { p.sound = e.target.checked; save(); };
  $('#p-sound-test').onclick = () => { unlockAudio(); beep('pip'); setTimeout(() => beep('pip'), 1000); setTimeout(() => beep('pip'), 2000); setTimeout(() => beep(), 3000); };
  $$('[data-ios]', el).forEach(b => b.onclick = () => {
    p.iosTimer = b.dataset.ios; save();
    $$('[data-ios]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (p.iosTimer !== 'off' && !p.iosTimerGuided) { p.iosTimerGuided = true; save(); openIosGuide(); }
  });
  $('#ios-guide').onclick = openIosGuide;
  const idStatus = () => {
    const m = identityMissing(), hp = hrProfile();
    $('#id-status').innerHTML = m.length
      ? `<span class="warn-dot"></span>Il manque : <strong>${listFr(m)}</strong>. Les calculs restent désactivés tant que ce n'est pas rempli.`
      : `<span class="ok-dot"></span>${state.nutrition.sex === 'f' ? 'Femme' : 'Homme'}, ${num(state.nutrition.age)} ans, ${num(p.height)} cm${hp ? ` : FC max ${hp.max} bpm` : ''}.`;
    $('#hr-zones').innerHTML = hrZonesHTML();
  };
  bindIdentity(el, 'p', idStatus); idStatus();
  $$('[data-level]', el).forEach(b => b.onclick = () => {
    p.level = b.dataset.level; save();
    $$('[data-level]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    toast(`Niveau ${LEVELS[p.level].label.toLowerCase()} : charges de départ mises à jour.`);
  });
  $$('[data-variety]', el).forEach(b => b.onclick = () => {
    p.variety = b.dataset.variety; resolveSessions(); save();
    $$('[data-variety]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    toast(`Variété : ${VARIETY[p.variety].label.toLowerCase()}.`);
  });
  $$('[data-lang]', el).forEach(b => b.onclick = () => {
    if ((p.lang || 'fr') === b.dataset.lang) return;
    p.lang = b.dataset.lang; save(); location.reload();
  });
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
        state = hydrate(s); resolveSessions(); save(); applyTheme(); toast('Données importées.'); renderProfile();
      } catch { toast('Fichier non reconnu : choisis un export VolleyFit (.json).'); }
    };
    r.readAsText(file);
  };
  $('#reset').onclick = () => {
    if (!confirm('Effacer toutes tes mesures, séances et réglages ? Exporte-les avant si besoin.')) return;
    state = defaults(); resolveSessions(); save(); applyTheme(); toast('Données effacées.'); renderProfile();
  };
}



/* ================= Analyse automatique d'un repas écrit en français =================
   « pâtes sauce blanche avec mozzarella et 200 g de filet de poulet » :
   reconnaît les aliments (même avec une faute de frappe), lit les quantités
   (200 g, 2 œufs, un bol, une tranche, un pot…) ou prend une portion normale. */
const norm = str => String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/g, 'oe').replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2')
  .replace(/[’'`]/g, ' ').replace(/[,;+\n/]|\bpuis\b|\bavec\b|\bet\b|\bplus\b|\band\b|\bwith\b|\bthen\b/g, ' | ').replace(/[^a-z0-9.| ]/g, ' ').replace(/\s+/g, ' ').trim();
const sing = w => w.length > 3 ? w.replace(/(s|x)$/, '') : w;
const NUMW = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, demi: .5, demie: .5, moitie: .5, quart: .25, one: 1, two: 2, three: 3, four: 4, five: 5, half: .5 };
const SIZEW = { petit: .7, petite: .7, grand: 1.4, grande: 1.4, gros: 1.4, grosse: 1.4, double: 2, small: .7, large: 1.4, big: 1.4 };
const STOP = new Set(['of', 'the', 'some', 'my', 'ate', 'had', 'i', 'for', 'lunch', 'dinner', 'breakfast', 'snack', 'plain', 'cooked', 'cup', 'cups', 'slice', 'slices', 'can', 'glass', 'bowl', 'piece', 'scoop', 'serving', 'de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'au', 'aux', 'a', 'en', 'sur', 'dans', 'mon', 'ma', 'mes', 'un', 'une', 'peu', 'normal', 'normale', 'nature', 'maison', 'sauce', 'avec', 'sans', 'bien', 'cuit', 'cuite', 'cuits', 'cuites', 'frais', 'fraiche', 'j', 'ai', 'mange', 'bu', 'pris', 'il', 'y', 'c', 'est', 'midi', 'soir', 'matin', 'repas', 'dejeuner', 'diner', 'souper', 'gouter', 'collation', 'encas', 'petit', 'hier', 'aujourd', 'hui', 'apres', 'avant', 'match', 'seance', 'entrainement', 'assiette', 'bol', 'verre', 'pot', 'tranche', 'tranches', 'portion', 'part', 'g', 'gr', 'kg', 'ml', 'cl', 'l']);
function unitGrams(u, f) {
  u = sing(u);
  if (['g', 'gr', 'gramme'].includes(u)) return 1;
  if (u === 'kg' || u === 'kilo') return 1000;
  if (u === 'ml') return 1; if (u === 'cl') return 10; if (u === 'l' || u === 'litre') return 1000;
  if (u === 'tranche' || u === 'slice') return f.slice || 30;
  if (u === 'cup') return 240;
  if (u === 'oz') return 28;
  if (u === 'can' || u === 'tin') return f.can || f.portion;
  if (u === 'glas' || u === 'glass') return 200;
  if (u === 'bowl') return f.id === 'soupe' ? 300 : 250;
  if (u === 'plate') return 300;
  if (u === 'tbsp') return 15;
  if (u === 'tsp') return 5;
  if (u === 'handful') return 30;
  if (u === 'serving') return f.portion;
  if (u === 'pot') return f.pot || f.portion;
  if (u === 'boite' || u === 'canette' || u === 'cannette') return f.can || f.portion;
  if (u === 'bouteille') return f.can || 330;
  if (u === 'boule') return f.ball || f.portion;
  if (u === 'bol') return f.id === 'soupe' ? 300 : f.id === 'cereales' || f.id === 'avoine' ? 60 : 250;
  if (u === 'assiette') return 300;
  if (u === 'verre' || u === 'tasse') return 200;
  if (u === 'cuillere' || u === 'cas') return 15;
  if (u === 'cac') return 5;
  if (u === 'poignee') return 30;
  if (u === 'carre') return 5;
  if (u === 'dose' || u === 'scoop' || u === 'mesure') return 30;
  if (u === 'piece' || u === 'morceau' || u === 'unite') return f.piece || f.portion;
  if (u === 'part' || u === 'portion') return f.portion;
  return null;
}
let FOOD_INDEX = null;
function foodIndex() {
  if (FOOD_INDEX) return FOOD_INDEX;
  const list = [];
  for (const f of FOODS) for (const a of f.a) list.push({ f, toks: norm(a).split(' ').map(sing) });
  list.sort((x, y) => y.toks.length - x.toks.length);
  return (FOOD_INDEX = list);
}
function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const isNum = t => /^\d+(\.\d+)?$/.test(t) || t in NUMW;
const numVal = t => t in NUMW ? NUMW[t] : parseFloat(t);
function parseMeal(text) {
  const toks = norm(text).split(' ').filter(Boolean), st = toks.map(sing), used = new Array(toks.length).fill(false), found = [];
  const idx = foodIndex();
  // 1) correspondances exactes (expressions les plus longues d'abord)
  for (let i = 0; i < toks.length; i++) {
    if (used[i] || toks[i] === '|') continue;
    for (const { f, toks: at } of idx) {
      if (i + at.length > toks.length) continue;
      let ok = true;
      for (let k = 0; k < at.length; k++) if (used[i + k] || st[i + k] !== at[k]) { ok = false; break; }
      if (ok) { for (let k = 0; k < at.length; k++) used[i + k] = true; found.push({ f, i, j: i + at.length - 1, exact: true }); break; }
    }
  }
  // 2) fautes de frappe : mots seuls proches d'un alias (« yagouret » → yaourt)
  const unknown = [];
  for (let i = 0; i < toks.length; i++) {
    const t = st[i];
    if (used[i] || t === '|' || t.length < 4 || STOP.has(toks[i]) || isNum(toks[i]) || unitGrams(toks[i], { portion: 1 }) !== null || toks[i] in SIZEW) continue;
    let best = null, bd = 9;
    for (const { f, toks: at } of idx) {
      if (at.length !== 1 || Math.abs(at[0].length - t.length) > 2) continue;
      const d = lev(t, at[0]);
      if (d < bd) { bd = d; best = f; }
    }
    if (best && bd <= (t.length >= 7 ? 2 : 1)) { used[i] = true; found.push({ f: best, i, j: i, exact: false, typed: toks[i] }); }
    else unknown.push(toks[i]);
  }
  // 3) quantités : avant l'aliment (200 g de…, 2 œufs, un bol de…) ou juste après (poulet 200 g)
  found.sort((a, b) => a.i - b.i);
  const items = found.map(m => {
    let grams = null, mult = 1, k = m.i - 1, unit = null, count = null;
    while (k >= 0 && k >= m.i - 5 && toks[k] !== '|' && !found.some(o => o !== m && k >= o.i && k <= o.j)) {
      const t = toks[k];
      if (t in SIZEW) mult *= SIZEW[t];
      else if (unit === null && unitGrams(t, m.f) !== null) unit = t;
      else if (isNum(t)) { count = numVal(t); break; }
      else if (!STOP.has(t)) break;
      k--;
    }
    if (count === null) {
      const a1 = toks[m.j + 1], a2 = toks[m.j + 2];
      if (a1 && /^\d/.test(a1) && a2 && unitGrams(a2, m.f) !== null) { count = parseFloat(a1); unit = a2; }
    }
    if (count !== null && unit) grams = count * unitGrams(unit, m.f);
    else if (unit) grams = unitGrams(unit, m.f);
    else if (count !== null) grams = count * (m.f.piece || m.f.portion);
    else grams = m.f.portion;
    grams = Math.max(1, Math.round(grams * mult));
    return { id: m.f.id, n: m.f.n, g: grams, typed: m.exact ? null : m.typed };
  });
  // regrouper les doublons (ex. « poulet … poulet »)
  const merged = [];
  for (const it of items) { const o = merged.find(x => x.id === it.id); if (o) o.g += it.g; else merged.push(it); }
  return { items: merged, unknown: [...new Set(unknown)] };
}
const foodById = id => FOODS.find(f => f.id === id);
const itemMacros = it => { const f = foodById(it.id); return { kcal: Math.round(f.kcal * it.g / 100), p: Math.round(f.p * it.g / 10) / 10 }; };
const mealTotals = items => items.reduce((t, it) => { const m = itemMacros(it); return { kcal: t.kcal + m.kcal, p: Math.round((t.p + m.p) * 10) / 10 }; }, { kcal: 0, p: 0 });

/* ================= Nutrition ================= */
const OBJECTIVES = {
  muscle: { label: 'Prise de muscle', kcal: 250, prot: 1.8, desc: 'Léger surplus calorique pour construire du muscle sans trop de gras.' },
  recompo: { label: 'Recomposition', kcal: -250, prot: 2.0, desc: 'Perdre du gras en gagnant du muscle : léger déficit, beaucoup de protéines.' },
  maintien: { label: 'Maintien', kcal: 0, prot: 1.6, desc: 'Garder ton poids et performer sur le terrain.' },
  perte: { label: 'Perte de gras', kcal: -450, prot: 2.0, desc: 'Déficit modéré qui préserve tes muscles et ton énergie.' }
};
let foodRange = 7, mealMoment = 'tous', smartDraft = '', smartItems = [], smartUnknown = [], smartSource = '';
const todayKey = () => isoDate(new Date());
function dayLog(key = todayKey()) {
  if (!state.food[key]) state.food[key] = { entries: [], water: 0 };
  return state.food[key];
}
function pruneFood() {
  const keep = new Set(Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return isoDate(d); }));
  for (const k of Object.keys(state.food)) if (!keep.has(k)) delete state.food[k];
}
function currentWeight() {
  const m = [...state.measures].filter(x => x.weight != null).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  return m ? m.weight : null;
}
function autoObjective() {
  const w = currentWeight(), g = num(state.profile.goalWeight);
  if (w && g && w > g + 1) return 'recompo';
  return 'muscle';
}
function isTrainingDay(d = new Date()) {
  const c = planWeek()[weekday(d)];
  return !!c && c !== 'R';
}
function needs(trainingDay) {
  const n = state.nutrition, w = currentWeight(), h = num(state.profile.height), age = num(n.age);
  if (!w || !h || !age || !['h', 'f'].includes(n.sex)) return null;
  const bmr = 10 * w + 6.25 * h - 5 * age + (n.sex === 'f' ? -161 : 5);
  const sessions = state.profile.gymDays.length + (state.profile.matchDay != null ? 1 : 0);
  const factor = sessions <= 2 ? 1.45 : sessions === 3 ? 1.55 : sessions === 4 ? 1.62 : 1.7;
  const objKey = n.objective === 'auto' ? autoObjective() : n.objective, obj = OBJECTIVES[objKey];
  const kcal = Math.round((bmr * factor + obj.kcal + (trainingDay ? 150 : -150)) / 10) * 10;
  const prot = Math.round(obj.prot * w), fat = Math.round(0.9 * w);
  const carbs = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  const water = Math.round((0.035 * w + (trainingDay ? 0.6 : 0)) * 10) / 10;
  return { kcal, prot, fat, carbs, water, objKey, obj, bmr: Math.round(bmr), factor };
}

function renderNutrition() {
  const el = $('#view-nutrition'), n = state.nutrition;
  pruneFood();
  const training = isTrainingDay();
  const need = needs(training);
  const log = dayLog();
  const eaten = log.entries.reduce((t, e) => ({ p: t.p + e.p, kcal: t.kcal + e.kcal }), { p: 0, kcal: 0 });
  eaten.p = Math.round(eaten.p); eaten.kcal = Math.round(eaten.kcal);
  const objKey = n.objective === 'auto' ? autoObjective() : n.objective;
  const pct = (a, b) => Math.min(100, b ? Math.round(a / b * 100) : 0);

  const miss = identityMissing();
  const setup = miss.length || !currentWeight()
    ? `<section class="panel form">
        <h2>Pour calculer tes besoins</h2>
        ${miss.length ? `<p>Il manque ton <strong>${listFr(miss)}</strong>.</p>` : ''}
        ${!currentWeight() ? '<p>Il manque ton <strong>poids</strong> : ajoute une mesure dans Progrès.</p>' : ''}
        <button class="btn btn--block" type="button" data-complete-id>Compléter mon profil</button>
      </section>`
    : `<p class="muted small id-summary">Calcul basé sur : ${state.nutrition.sex === 'f' ? 'femme' : 'homme'}, ${num(state.nutrition.age)} ans, ${num(state.profile.height)} cm, ${fmtNum(currentWeight())} kg. <button class="link" type="button" data-goto-profile>Modifier</button></p>`;

  el.innerHTML = `
    <h1 class="page-title">Nutrition</h1>
    ${need ? `
    <section class="panel nutri-hero">
      <div class="panel__head"><h2>Tes besoins aujourd'hui</h2><span class="pill">${training ? 'Jour de séance' : 'Jour de repos'}</span></div>
      <p class="kcal"><span>${need.kcal.toLocaleString('fr-BE')}</span> kcal</p>
      <div class="macros">
        ${[['Protéines', need.prot, 'p'], ['Glucides', need.carbs, 'c'], ['Lipides', need.fat, 'f']].map(([l, g, k]) => `
          <div class="macro macro--${k}"><p class="macro__g">${g} g</p><p class="macro__l">${l}</p></div>`).join('')}
      </div>
      <p class="muted small">Eau : environ <strong>${fmtNum(need.water)} L</strong>${training ? ', séance comprise' : ''}. ${training ? 'Plus de glucides les jours de séance et de match pour l\'énergie.' : 'Un peu moins de glucides les jours sans entraînement.'}</p>
    </section>` : ''}

    <section class="panel">
      <h2>Ton objectif</h2>
      <div class="goal-pick goal-pick--2">${[['auto', 'Automatique', `Choisi selon ton poids visé et ton programme : ${OBJECTIVES[autoObjective()].label.toLowerCase()}.`], ...Object.entries(OBJECTIVES).map(([k, o]) => [k, o.label, o.desc])].map(([k, l, d]) => `
        <button type="button" data-obj="${k}" aria-pressed="${n.objective === k}"><strong>${l}</strong><span>${esc(d)}</span></button>`).join('')}</div>
    </section>

    ${setup}

    <section class="panel">
      <div class="panel__head"><h2>Aujourd'hui</h2><span class="muted small">${fmtDate(new Date().toISOString())}</span></div>
      <div class="track">
        <p><strong>Protéines</strong> <span>${Math.round(eaten.p)} ${need ? `/ ${need.prot}` : ''} g</span></p>
        <div class="meter meter--p"><span style="width:${pct(eaten.p, need?.prot || 150)}%"></span></div>
        <p><strong>Calories</strong> <span>${eaten.kcal.toLocaleString('fr-BE')} ${need ? `/ ${need.kcal.toLocaleString('fr-BE')}` : ''} kcal</span></p>
        <div class="meter meter--k"><span style="width:${pct(eaten.kcal, need?.kcal || 2500)}%"></span></div>
        <p><strong>Eau</strong> <span>${fmtNum(log.water / 1000)} ${need ? `/ ${fmtNum(need.water)}` : ''} L</span></p>
        <div class="water">${Array.from({ length: Math.max(8, Math.ceil((need?.water || 3) / 0.25)) }, (_, i) => `<span class="${i < log.water / 250 ? 'on' : ''}"></span>`).join('')}</div>
        <div class="btn-row"><button class="btn btn--sm" type="button" id="water-add">+ 1 verre (25 cl)</button><button class="btn btn--quiet btn--sm" type="button" id="water-rm" ${log.water ? '' : 'disabled'}>Retirer un verre</button></div>
      </div>
      <h3 class="sub">Écris ce que tu as mangé</h3>
      <div class="smart">
        <textarea id="smart-in" rows="1" placeholder="Ex. : riz et 200 g de poulet">${esc(smartDraft)}</textarea>
        <div id="smart-out" aria-live="polite"></div>
      </div>
      <h3 class="sub">Ajout rapide</h3>
      <div class="quick">${QUICK_FOODS.map((f, i) => `<button class="chip chip--food" type="button" data-qf="${i}"><span class="qf__i" aria-hidden="true">${f.icon || ''}</span><strong>${esc(f.name)}</strong><span class="qf__p">${f.p} g</span></button>`).join('')}</div>
      <button class="btn btn--ghost btn--sm" type="button" id="food-custom">+ Autre aliment</button>
      ${log.entries.length ? `<div class="list list--plain food-log">${log.entries.map(e => `
        <div class="food-row"><span><strong>${esc(e.name)}</strong><br><span class="muted small">${fmtNum(e.p)} g de protéines, ${e.kcal} kcal${e.items ? `<br>${e.items.map(x => `${esc(x.n)} ${x.g} g`).join(', ')}` : ''}</span></span>
        <button class="icon-btn" type="button" data-fdel="${e.id}" aria-label="Retirer ${esc(e.name)}">${ICON.trash}</button></div>`).join('')}</div>` : '<p class="empty">Rien de noté aujourd\'hui. Ajoute un aliment ou un repas des idées plus bas.</p>'}
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Historique</h2><span class="muted small">protéines par jour</span></div>
      <div class="seg" role="group" aria-label="Période">${[[7, '7 jours'], [30, '30 jours']].map(([k, l]) => `<button type="button" data-frange="${k}" aria-pressed="${foodRange === k}">${l}</button>`).join('')}</div>
      ${weekProteinChart(need?.prot, foodRange)}
      ${foodRange === 30 ? foodDaysList(need) : ''}
    </section>

    <section class="panel">
      <h2>Idées de repas</h2>
      <div class="chips chips--scroll" role="group" aria-label="Moment">${[['tous', 'Tous'], ...Object.entries(MEAL_MOMENTS)].map(([k, l]) => `<button class="chip" type="button" data-moment="${k}" aria-pressed="${k === mealMoment}">${l}</button>`).join('')}</div>
      <div id="meals" class="meals"></div>
    </section>

    <section class="panel">
      <h2>Bien manger autour du volley</h2>
      ${[
        ['Avant une séance', 'Un vrai repas 2 à 3 heures avant (glucides et protéines), ou une collation légère 30 à 60 minutes avant : banane, pain et beurre de cacahuète.'],
        ['Après une séance', 'Dans les 2 heures : 25 à 40 g de protéines et des glucides pour récupérer. Un shake et une banane font l\'affaire si le repas est loin.'],
        ['Jour de match', 'Repas riche en glucides et pauvre en gras 3 heures avant (pâtes, riz, poulet). Bois régulièrement et garde une banane pour la pause entre les sets.'],
        ['Protéines', 'Répartis-les sur 3 à 5 prises de 25 à 40 g dans la journée : c\'est plus efficace qu\'une grosse prise le soir.'],
        ['Hydratation', 'Bois avant d\'avoir soif. Urine claire = bien hydraté. Pense à boire pendant les matchs, surtout en salle chaude.'],
        ['Créatine', 'Le complément le plus étudié pour la force et la masse musculaire (3 à 5 g par jour). Demande l\'avis d\'un médecin ou d\'un diététicien avant de commencer.']
      ].map(([t, d]) => `<details class="tip"><summary>${t}</summary><p>${d}</p></details>`).join('')}
    </section>
    ${need ? `<p class="muted small">Calcul : métabolisme de base ${need.bmr} kcal (formule de Mifflin-St Jeor) × ${String(need.factor).replace('.', ',')} pour ton activité, ajusté pour l'objectif « ${need.obj.label.toLowerCase()} ». Ce sont des repères, pas un avis médical : pour un suivi précis, vois un diététicien du sport.</p>` : ''}`;

  const drawMeals = () => {
    const list = MEALS.filter(m => mealMoment === 'tous' || m.tags.includes(mealMoment));
    $('#meals', el).innerHTML = list.map((m, i) => `
      <article class="meal">
        <div class="meal__top"><strong>${esc(m.name)}</strong><span class="meal__p">${m.p} g</span></div>
        <p class="muted small">${esc(m.how)}</p>
        <div class="meal__bottom"><span class="muted small">${m.kcal} kcal, ${m.tags.map(t => MEAL_MOMENTS[t].toLowerCase()).join(', ')}</span>
        <button class="btn btn--ghost btn--sm" type="button" data-meal="${MEALS.indexOf(m)}">Ajouter</button></div>
      </article>`).join('');
    $$('[data-meal]', el).forEach(b => b.onclick = () => { const m = MEALS[+b.dataset.meal]; addFood(m.name, m.p, m.kcal); });
  };
  drawMeals();

  const addFood = (name, p, kcal) => {
    dayLog().entries.push({ id: Date.now(), name, p, kcal });
    save(); toast(`${name} ajouté : ${p} g de protéines.`); renderNutrition();
  };
  $$('[data-complete-id]', el).forEach(b => b.onclick = openIdentitySheet);
  $$('[data-goto-profile]', el).forEach(b => b.onclick = () => go('profile'));
  // analyse automatique
  const out = $('#smart-out', el);
  const drawSmart = () => {
    if (!smartDraft.trim()) { out.innerHTML = ''; smartItems = []; return; }
    if (!smartItems.length || smartSource !== smartDraft) { const r = parseMeal(smartDraft); smartItems = r.items; smartUnknown = r.unknown; smartSource = smartDraft; }
    const tot = mealTotals(smartItems);
    out.innerHTML = smartItems.length ? `
      <div class="smart__list">${smartItems.map((it, i) => { const m = itemMacros(it); return `
        <div class="smart__row">
          <span class="smart__name"><strong>${esc(it.n)}</strong>${it.typed ? `<span class="muted small"> (« ${esc(it.typed)} »)</span>` : ''}<br><span class="muted small">${fmtNum(m.p)} g de protéines, ${m.kcal} kcal</span></span>
          <span class="smart__g"><button type="button" data-sg="${i}" data-d="-1" aria-label="Moins">−</button><input inputmode="numeric" data-sgi="${i}" value="${it.g}" aria-label="Grammes de ${esc(it.n)}"><span>g</span><button type="button" data-sg="${i}" data-d="1" aria-label="Plus">+</button></span>
          <button class="icon-btn" type="button" data-sdel="${i}" aria-label="Retirer ${esc(it.n)}">${ICON.close}</button>
        </div>`; }).join('')}</div>
      ${smartUnknown.length ? `<p class="muted small">Pas reconnu : ${smartUnknown.map(esc).join(', ')}. Ajoute-le avec « Autre aliment » si besoin.</p>` : ''}
      <div class="smart__tot"><span><strong>${fmtNum(tot.p)} g</strong> de protéines</span><span><strong>${tot.kcal}</strong> kcal</span></div>
      <button class="btn btn--block" type="button" id="smart-add">Ajouter à aujourd'hui</button>`
      : `<p class="muted small">Aucun aliment reconnu pour l'instant. Essaie par exemple « riz poulet brocolis » ou « 2 œufs et une banane ».</p>`;
    $$('[data-sg]', out).forEach(b => b.onclick = () => { const it = smartItems[+b.dataset.sg]; const step = it.g < 50 ? 5 : it.g < 150 ? 10 : 25; it.g = Math.max(5, it.g + step * +b.dataset.d); drawSmart(); });
    $$('[data-sgi]', out).forEach(inp => inp.onchange = () => { smartItems[+inp.dataset.sgi].g = Math.max(1, Math.round(num(inp.value) || 0)); drawSmart(); });
    $$('[data-sdel]', out).forEach(b => b.onclick = () => { smartItems.splice(+b.dataset.sdel, 1); drawSmart(); });
    const add = $('#smart-add', out);
    if (add) add.onclick = () => {
      const t = mealTotals(smartItems), label = smartDraft.trim().replace(/\s+/g, ' ');
      dayLog().entries.push({ id: Date.now(), name: label.length > 60 ? label.slice(0, 57) + '…' : label, p: t.p, kcal: t.kcal, items: smartItems.map(x => ({ n: x.n, g: x.g })) });
      smartDraft = ''; smartItems = []; smartSource = ''; save();
      toast(`Ajouté : ${fmtNum(t.p)} g de protéines, ${t.kcal} kcal.`); renderNutrition();
    };
  };
  let smartTimer;
  $('#smart-in', el).oninput = e => { smartDraft = e.target.value; clearTimeout(smartTimer); smartTimer = setTimeout(() => { smartItems = []; drawSmart(); }, 350); };
  drawSmart();
  $$('[data-obj]', el).forEach(b => b.onclick = () => { n.objective = b.dataset.obj; save(); renderNutrition(); });
  $$('[data-moment]', el).forEach(b => b.onclick = () => {
    mealMoment = b.dataset.moment;
    $$('[data-moment]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    drawMeals();
  });
  $$('[data-qf]', el).forEach(b => b.onclick = () => { const f = QUICK_FOODS[+b.dataset.qf]; addFood(f.name, f.p, f.kcal); });
  $$('[data-fdel]', el).forEach(b => b.onclick = () => { const l = dayLog(); l.entries = l.entries.filter(x => String(x.id) !== b.dataset.fdel); save(); renderNutrition(); });
  $$('[data-day]', el).forEach(b => b.onclick = () => openDayLog(b.dataset.day));
  $$('[data-frange]', el).forEach(b => b.onclick = () => { foodRange = +b.dataset.frange; renderNutrition(); });
  $$('.bars-wrap--long', el).forEach(w => { w.scrollLeft = w.scrollWidth; });
  $('#water-add', el).onclick = () => { dayLog().water += 250; save(); renderNutrition(); };
  $('#water-rm', el).onclick = () => { const l = dayLog(); l.water = Math.max(0, l.water - 250); save(); renderNutrition(); };
  $('#food-custom', el).onclick = () => {
    const body = openSheet(`
      <h2 class="sheet__title">Autre aliment</h2>
      <form id="food-form" class="form">
        <label class="field"><span>Nom</span><input name="name" required placeholder="Ex. : sandwich poulet"></label>
        <div class="grid-2">
          <label class="field"><span>Protéines (g)</span><input name="p" inputmode="numeric" required placeholder="25"></label>
          <label class="field"><span>Calories (kcal)</span><input name="kcal" inputmode="numeric" placeholder="400"></label>
        </div>
        <button class="btn btn--block" type="submit">Ajouter à aujourd'hui</button>
      </form>`, { label: 'Autre aliment' });
    $('#food-form', body).onsubmit = ev => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const name = String(f.get('name')).trim(), p = Math.round(num(f.get('p')) || 0), kcal = Math.round(num(f.get('kcal')) || 0);
      if (!name) return;
      closeSheet(); addFood(name, p, kcal);
    };
  };
}

function weekProteinChart(goal, n = 7) {
  const days = Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1) + i); return d; });
  const vals = days.map(d => Math.round((state.food[isoDate(d)]?.entries || []).reduce((t, e) => t + e.p, 0)));
  const max = Math.max(goal || 0, ...vals, 50);
  return `<div class="bars-wrap ${n > 7 ? 'bars-wrap--long' : ''}"><div class="bars" style="grid-template-columns:repeat(${n}, ${n > 7 ? '26px' : '1fr'})">${days.map((d, i) => `
    <button class="bars__col" type="button" data-day="${isoDate(d)}" aria-label="Voir les repas du ${dayTitle(isoDate(d))}">
      <span class="bars__track">${goal ? `<span class="bars__goal" style="bottom:${goal / max * 100}%"></span>` : ''}<span class="bars__fill ${goal && vals[i] >= goal ? 'ok' : ''}" style="height:${vals[i] / max * 100}%"></span></span>
      <span class="bars__v">${vals[i] || ''}</span><span class="bars__d">${n > 7 ? d.getDate() : DAYS_SHORT[weekday(d)]}</span></button>`).join('')}</div></div>
    <p class="muted small">Touche un jour pour voir ses repas.${goal ? ' Le trait marque ton objectif de protéines ; en menthe, objectif atteint.' : ''}</p>`;
}
function foodDaysList(need) {
  const keys = Object.keys(state.food).filter(k => (state.food[k].entries || []).length || state.food[k].water).sort().reverse();
  if (!keys.length) return '<p class="empty">Aucun repas noté sur les 30 derniers jours.</p>';
  const tot = k => (state.food[k].entries || []).reduce((t, e) => ({ p: t.p + e.p, kcal: t.kcal + e.kcal }), { p: 0, kcal: 0 });
  const avgP = Math.round(keys.reduce((t, k) => t + tot(k).p, 0) / keys.length);
  const avgK = Math.round(keys.reduce((t, k) => t + tot(k).kcal, 0) / keys.length);
  return `<p class="muted small">Moyenne sur ${plural(keys.length, 'jour')} noté${keys.length > 1 ? 's' : ''} : <strong>${avgP} g</strong> de protéines et <strong>${avgK.toLocaleString('fr-BE')} kcal</strong> par jour.</p>
    <div class="list day-list">${keys.map(k => { const t = tot(k), n = state.food[k].entries.length, ok = need && t.p >= need.prot; const title = dayTitle(k); return `
      <button class="row" type="button" data-day="${k}">
        <span class="row__main"><strong>${esc(title.charAt(0).toUpperCase() + title.slice(1))}</strong><br><span class="muted small">${plural(n, 'repas').replace('repass', 'repas')}, ${t.kcal.toLocaleString('fr-BE')} kcal</span></span>
        <span class="row__value ${ok ? 'day-ok' : ''}">${fmtNum(Math.round(t.p))} g</span>${ICON.right}
      </button>`; }).join('')}</div>`;
}
function dayTitle(key) {
  const d = new Date(key + 'T12:00'), today = isoDate(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  const label = `${DAYS[weekday(d)].toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return key === today ? `aujourd'hui, ${label}` : key === isoDate(y) ? `hier, ${label}` : label;
}
/* Repas d'un jour : détail, totaux, suppression, navigation sur 30 jours */
function openDayLog(key) {
  const minKey = (() => { const d = new Date(); d.setDate(d.getDate() - 29); return isoDate(d); })();
  const today = isoDate(new Date());
  const shift = n => { const d = new Date(key + 'T12:00'); d.setDate(d.getDate() + n); return isoDate(d); };
  const log = state.food[key] || { entries: [], water: 0 };
  const tot = log.entries.reduce((t, e) => ({ p: t.p + e.p, kcal: t.kcal + e.kcal }), { p: 0, kcal: 0 });
  const training = isTrainingDay(new Date(key + 'T12:00')), need = needs(training);
  const t = dayTitle(key);
  const body = openSheet(`
    <div class="day-nav">
      <button class="icon-btn" type="button" data-dshift="-1" aria-label="Jour précédent" ${key <= minKey ? 'disabled' : ''}>${ICON.left}</button>
      <h2 class="sheet__title day-nav__t">${esc(t.charAt(0).toUpperCase() + t.slice(1))}</h2>
      <button class="icon-btn" type="button" data-dshift="1" aria-label="Jour suivant" ${key >= today ? 'disabled' : ''}>${ICON.right}</button>
    </div>
    <div class="stats3 stats3--flat">
      <div class="stat"><p class="stat__value">${fmtNum(Math.round(tot.p * 10) / 10)}</p><p class="stat__label">g de protéines${need ? ` sur ${need.prot}` : ''}</p></div>
      <div class="stat"><p class="stat__value">${tot.kcal.toLocaleString('fr-BE')}</p><p class="stat__label">kcal${need ? ` sur ${need.kcal.toLocaleString('fr-BE')}` : ''}</p></div>
      <div class="stat"><p class="stat__value">${fmtNum(log.water / 1000)}</p><p class="stat__label">L d'eau</p></div>
    </div>
    ${need ? `<div class="meter meter--p"><span style="width:${Math.min(100, tot.p / need.prot * 100)}%"></span></div>` : ''}
    <h3 class="sub">Repas (${log.entries.length})</h3>
    ${log.entries.length ? `<div class="list list--plain">${log.entries.map(e => `
      <div class="food-row"><span><strong>${esc(e.name)}</strong> <span class="muted small">${e.id > 1e12 ? fmtTime(new Date(e.id).toISOString()) : ''}</span><br>
        <span class="muted small">${fmtNum(e.p)} g de protéines, ${e.kcal} kcal${e.items ? `<br>${e.items.map(x => `${esc(x.n)} ${x.g} g`).join(', ')}` : ''}</span></span>
        <button class="icon-btn" type="button" data-ddel="${e.id}" aria-label="Retirer ${esc(e.name)}">${ICON.trash}</button></div>`).join('')}</div>`
      : '<p class="empty">Aucun repas noté ce jour-là.</p>'}
  `, { label: 'Repas du ' + t, onClose: () => { if (view === 'nutrition') renderNutrition(); } });
  $$('[data-dshift]', body).forEach(b => b.onclick = () => openDayLog(shift(+b.dataset.dshift)));
  $$('[data-ddel]', body).forEach(b => b.onclick = () => {
    if (!confirm('Retirer ce repas ?')) return;
    log.entries = log.entries.filter(x => String(x.id) !== b.dataset.ddel); save(); openDayLog(key);
  });
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

const APP_VERSION = '38';
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

autoSaveForgotten();
render();
if (identityMissing().length && !state.active) setTimeout(openIdentitySheet, 400);
document.addEventListener('visibilitychange', () => { if (!document.hidden && state.active) { const was = state.active; autoSaveForgotten(); if (!state.active && was) render(); } });
