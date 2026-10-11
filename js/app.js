'use strict';

/* ================= Outils ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localInput = d => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDate = iso => { const d = new Date(iso); return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`; };
const fmtDateTime = iso => { const d = new Date(iso); return `${fmtDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const weekday = d => (d.getDay() + 6) % 7; // 0 = lundi
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmtNum = (n, d = 1) => n == null ? '–' : n.toFixed(d).replace('.', ',');
const fmtRest = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`) : `${s} s`;
const fmtClock = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const METRICS = {
  weight: { label: 'Poids', unit: 'kg' },
  fat: { label: 'Masse grasse', unit: '%' },
  muscle: { label: 'Masse musculaire', unit: '%' },
  bone: { label: 'Masse osseuse', unit: '%' },
  water: { label: 'Eau corporelle', unit: '%' }
};
const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

/* ================= Données ================= */
const STORE_KEY = 'volleyfit-v1';
const defaults = () => ({
  profile: { name: '', height: '', position: 'polyvalent', gymDays: [0, 2, 4], matchDay: null, cycleStart: isoDate(new Date()) },
  measures: [],
  history: [],
  loads: {},
  active: null
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaults();
      return { ...d, ...s, profile: { ...d.profile, ...s.profile } };
    }
  } catch (e) { /* stockage indisponible */ }
  return defaults();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Sauvegarde impossible : le stockage du navigateur est bloqué.'); }
}

/* ================= Planning ================= */
function planWeek(p) {
  const plan = Array(7).fill(null);
  const m = p.matchDay;
  const hasMatch = m !== null && m !== undefined;
  if (hasMatch) plan[m] = 'M';
  const queue = ['A', 'B', 'C', 'A', 'B', 'C', 'A'];
  [...p.gymDays].sort((a, b) => a - b).forEach(d => {
    if (plan[d] === 'M') return;
    if (hasMatch && d === (m + 1) % 7) { plan[d] = 'R'; return; }        // lendemain de match
    if (hasMatch && d === (m + 6) % 7) {                                   // veille de match : pas de jambes
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
const setsFor = it => it.kind === 'time' ? 1 : (isDeload() ? Math.max(1, it.sets - 1) : it.sets);

function itemMeta(it) {
  if (it.kind === 'time') return `${it.duration} min`;
  const n = setsFor(it);
  if (it.kind === 'hold') return `${n} × ${it.hold} s${it.perSide ? ' par côté' : ''}, repos ${fmtRest(it.rest)}`;
  return `${n} × ${it.reps}, repos ${fmtRest(it.rest)}`;
}
function estimateMinutes(s) {
  const sec = s.items.reduce((t, it) => {
    if (it.kind === 'time') return t + it.duration * 60;
    const work = it.kind === 'hold' ? it.hold * (it.perSide ? 2 : 1) : 45;
    return t + setsFor(it) * (work + it.rest);
  }, 0);
  return Math.round(sec / 300) * 5;
}

/* ================= Navigation ================= */
let view = 'today';
function go(v) {
  view = v;
  $$('.view').forEach(s => { s.hidden = s.id !== 'view-' + v; });
  $$('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.view === v ? 'page' : 'false'));
  render();
  window.scrollTo(0, 0);
}
function render() {
  ({ today: renderToday, program: renderProgram, tracking: renderTracking, profile: renderProfile })[view]();
}
$$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.view)));

/* ================= Aujourd'hui ================= */
const NET = '<div class="court__net" aria-hidden="true"></div>';

function weekStrip(plan, today) {
  return `<ol class="week">${plan.map((c, i) => {
    const s = SESSIONS[c];
    return `<li class="week__day ${i === today ? 'is-today' : ''}">
      <span class="week__name" aria-label="${DAYS[i]}">${DAYS_SHORT[i]}</span>
      <span class="week__code" ${s ? `style="--sess:${s.color}"` : ''} title="${c === 'M' ? 'Match' : s ? esc(s.name) : 'Repos'}">${c === 'M' ? '🏐' : c || '·'}</span>
    </li>`;
  }).join('')}</ol>`;
}

function renderToday() {
  const el = $('#view-today');
  if (state.active) return renderWorkout(el);

  const now = new Date(), wd = weekday(now);
  const plan = planWeek(state.profile);
  const code = plan[wd];
  const wk = cycleWeek();
  const hello = state.profile.name ? `Salut ${esc(state.profile.name)}. ` : '';
  let hero;

  if (code === 'M') {
    hero = `<section class="court" style="--sess:#15213A">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}</p>
      <h1 class="court__title">Jour de match</h1>
      <p class="court__meta">Pas de salle aujourd'hui. Avant le match : 5 minutes de rotations d'épaules à l'élastique et quelques sauts progressifs.</p>
    </section>`;
  } else if (SESSIONS[code]) {
    const s = SESSIONS[code];
    hero = `<section class="court" style="--sess:${s.color}">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}, semaine ${wk} sur 4 du cycle</p>
      <h1 class="court__title">${esc(s.name)}</h1>
      <p class="court__meta">${esc(s.goal)} ${s.items.length} exercices, environ ${estimateMinutes(s)} min.</p>
      <button class="btn btn--court" data-start="${code}" type="button">Commencer la séance</button>
    </section>`;
  } else {
    hero = `<section class="court" style="--sess:#4A5876">${NET}
      <p class="court__kicker">${hello}${DAYS[wd]}</p>
      <h1 class="court__title">Jour de repos</h1>
      <p class="court__meta">Les muscles se construisent pendant la récupération. Marche, étire-toi, dors bien.</p>
    </section>`;
  }

  const pos = POSITIONS[state.profile.position] || POSITIONS.polyvalent;
  const last = state.history[0];
  const doneThisWeek = state.history.filter(h => {
    const d = new Date(h.date), monday = new Date(now);
    monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - wd);
    return d >= monday;
  }).length;
  const planned = plan.filter(c => SESSIONS[c]).length;

  el.innerHTML = `
    ${hero}
    ${isDeload() ? '<p class="note">Semaine 4 du cycle : semaine allégée. Une série de moins par exercice pour bien récupérer avant le cycle suivant.</p>' : ''}
    <div class="panel">
      <h2>Ta semaine</h2>
      ${weekStrip(plan, wd)}
      <p class="legend">A jambes, B épaules, C explosivité, R récupération. ${doneThisWeek} séance${doneThisWeek > 1 ? 's' : ''} faite${doneThisWeek > 1 ? 's' : ''} sur ${planned} prévue${planned > 1 ? 's' : ''}.</p>
    </div>
    <p class="note"><strong>${esc(pos.label)}.</strong> ${esc(pos.tip)}</p>
    <div class="panel">
      <h2>Faire une autre séance</h2>
      <div class="chips">${Object.entries(SESSIONS).map(([k, s]) =>
        `<button class="chip chip--sess" style="--sess:${s.color}" data-start="${k}" type="button">${k}, ${esc(s.name)}</button>`).join('')}</div>
    </div>
    ${last ? `<p class="muted small">Dernière séance : ${esc(last.name)}, le ${fmtDate(last.date)} (${last.minutes} min).</p>` : ''}
  `;
  $$('[data-start]', el).forEach(b => b.addEventListener('click', () => startSession(b.dataset.start)));
}

function startSession(code) {
  state.active = { code, start: Date.now(), done: {}, loads: {}, rpe: '', notes: '' };
  save();
  go('today');
}

/* ================= Séance en cours ================= */
function renderWorkout(el) {
  const a = state.active, s = SESSIONS[a.code];
  if (!s) { state.active = null; save(); return renderToday(); }
  const started = new Date(a.start);

  el.innerHTML = `
    <header class="workout-head" style="--sess:${s.color}">
      <div class="workout-head__row">
        <h2>${esc(s.name)}</h2>
        <span class="muted small">Commencée à ${pad(started.getHours())}:${pad(started.getMinutes())}</span>
      </div>
      <div class="progress"><span id="wk-progress"></span></div>
    </header>
    ${isDeload() ? '<p class="note">Semaine allégée : une série de moins.</p>' : ''}
    <ol class="ex-list">
      ${s.items.map((it, i) => exerciseHTML(it, i, a)).join('')}
    </ol>
    <div class="panel">
      <label class="field"><span>Ressenti de l'effort (1 facile, 10 maximal)</span>
        <select id="rpe">
          <option value="">Choisir</option>
          ${[...Array(10)].map((_, i) => `<option ${String(a.rpe) === String(i + 1) ? 'selected' : ''}>${i + 1}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Notes (douleur, sensations, charges à revoir)</span>
        <textarea id="notes">${esc(a.notes)}</textarea>
      </label>
      <button class="btn btn--block" id="finish" type="button" style="background:${s.color}">Terminer la séance</button>
      <button class="btn btn--quiet btn--block" id="abandon" type="button">Abandonner sans enregistrer</button>
    </div>`;

  updateProgress();

  el.onclick = e => {
    const setBtn = e.target.closest('.set');
    if (setBtn) return toggleSet(+setBtn.dataset.i, +setBtn.dataset.set, setBtn);
    const tBtn = e.target.closest('[data-timer]');
    if (tBtn) {
      const i = +tBtn.dataset.timer, it = s.items[i];
      if (it.kind === 'time') {
        startTimer(it.duration * 60, it.name, () => { a.done[i] = [true]; save(); refreshItem(i); });
      } else {
        startTimer(it.hold, `${it.name}, tiens la position`);
      }
    }
  };
  el.oninput = e => {
    if (e.target.matches('[data-load]')) { a.loads[e.target.dataset.load] = num(e.target.value); save(); }
    if (e.target.id === 'notes') { a.notes = e.target.value; save(); }
  };
  $('#rpe').onchange = e => { a.rpe = e.target.value; save(); };
  $('#finish').onclick = finishSession;
  $('#abandon').onclick = () => {
    if (confirm('Abandonner la séance ? Rien ne sera enregistré.')) { state.active = null; stopTimer(); save(); renderToday(); }
  };
}

function exerciseHTML(it, i, a) {
  const n = setsFor(it);
  const done = a.done[i] || [];
  const complete = done.filter(Boolean).length >= n;
  const lastLoad = state.loads[it.id];
  const curLoad = a.loads[it.id] ?? lastLoad ?? '';
  let controls = `<div class="sets" role="group" aria-label="Séries">${[...Array(n)].map((_, k) =>
    `<button class="set" type="button" data-i="${i}" data-set="${k}" aria-pressed="${!!done[k]}" aria-label="Série ${k + 1}">${k + 1}</button>`).join('')}</div>`;
  if (it.kind === 'time') controls += `<button class="btn btn--ghost" type="button" data-timer="${i}">Lancer ${it.duration} min</button>`;
  if (it.kind === 'hold') controls += `<button class="btn btn--ghost" type="button" data-timer="${i}">Chrono ${it.hold} s</button>`;
  if (it.load) controls += `<label class="load">Charge <input type="number" inputmode="decimal" step="0.5" min="0" data-load="${it.id}" value="${curLoad ?? ''}" placeholder="kg"> kg</label>`;

  return `<li class="ex ${complete ? 'is-complete' : ''}" id="ex-${i}">
    <h3>${esc(it.name)}</h3>
    <p class="ex__meta">${itemMeta(it)}</p>
    <p class="ex__where">${esc(it.where)}${it.load && lastLoad != null ? `. La dernière fois : ${fmtNum(lastLoad, lastLoad % 1 ? 1 : 0)} kg` : ''}</p>
    <div class="ex__controls">${controls}</div>
    <details><summary>Comment faire</summary><p>${esc(it.how)}</p><p class="why">Pour le volley : ${esc(it.why)}</p></details>
  </li>`;
}

function toggleSet(i, k, btn) {
  const a = state.active, it = SESSIONS[a.code].items[i];
  a.done[i] = a.done[i] || [];
  a.done[i][k] = !a.done[i][k];
  save();
  btn.setAttribute('aria-pressed', String(a.done[i][k]));
  refreshItem(i, false);
  if (a.done[i][k] && it.kind !== 'time' && it.rest) {
    const last = a.done[i].filter(Boolean).length >= setsFor(it);
    startTimer(it.rest, last ? 'Repos, puis exercice suivant' : `Repos, ${it.name}`);
  }
}
function refreshItem(i, redrawSets = true) {
  const a = state.active; if (!a) return;
  const it = SESSIONS[a.code].items[i], li = $('#ex-' + i);
  if (!li) return;
  const done = a.done[i] || [];
  li.classList.toggle('is-complete', done.filter(Boolean).length >= setsFor(it));
  if (redrawSets) $$('.set', li).forEach((b, k) => b.setAttribute('aria-pressed', String(!!done[k])));
  updateProgress();
}
function updateProgress() {
  const a = state.active; if (!a) return;
  const items = SESSIONS[a.code].items;
  const total = items.reduce((t, it) => t + setsFor(it), 0);
  const done = items.reduce((t, it, i) => t + Math.min(setsFor(it), (a.done[i] || []).filter(Boolean).length), 0);
  const bar = $('#wk-progress'); if (bar) bar.style.width = `${total ? (done / total) * 100 : 0}%`;
  return { total, done };
}

function finishSession() {
  const a = state.active, s = SESSIONS[a.code];
  const { total, done } = updateProgress();
  if (done === 0 && !confirm('Aucune série cochée. Enregistrer quand même ?')) return;
  const loads = Object.fromEntries(Object.entries(a.loads).filter(([, v]) => v != null));
  state.history.unshift({
    id: Date.now(), code: a.code, name: s.name, date: new Date(a.start).toISOString(),
    minutes: Math.max(1, Math.round((Date.now() - a.start) / 60000)),
    setsDone: done, setsTotal: total, rpe: a.rpe, notes: a.notes, loads
  });
  Object.assign(state.loads, loads);
  state.active = null;
  stopTimer();
  save();
  toast('Séance enregistrée. Bien joué !');
  renderToday();
  window.scrollTo(0, 0);
}

/* ================= Chrono ================= */
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
    beep();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    const cb = timer.onDone; timer = null;
    if (cb) cb();
    setTimeout(() => { if (!timer) $('#timer').hidden = true; }, 4000);
  }
}
function stopTimer() {
  clearInterval(timerInt); timer = null; $('#timer').hidden = true;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
$('#timer-add').onclick = () => { if (timer) { timer.end += 15000; timer.total += 15; tick(); } };
$('#timer-stop').onclick = stopTimer;

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

/* ================= Programme ================= */
function renderProgram() {
  const el = $('#view-program');
  el.innerHTML = `
    <h2>Ton programme</h2>
    <p>Trois séances par semaine à Basic-Fit, pensées pour le volley : détente, épaules solides, déplacements et gainage. Le programme suit des cycles de 4 semaines : trois semaines où tu augmentes les charges, puis une semaine allégée.</p>
    <p class="note">Pour progresser : quand tu réussis toutes les répétitions proprement, ajoute 2,5 à 5 % de charge la séance suivante. Si un exercice fait mal (pas juste brûler), arrête-le et parles-en à un kiné.</p>
    <p class="muted">Le planning évite les jambes la veille d'un match et place la récupération le lendemain. Règle tes jours dans Profil.</p>
    ${Object.entries(SESSIONS).map(([k, s]) => `
      <article class="panel prog" style="--sess:${s.color}">
        <h3>Séance ${k} : ${esc(s.name)}</h3>
        <p class="muted">${esc(s.goal)} Environ ${estimateMinutes(s)} min.</p>
        <ol>${s.items.map(it => `<li><strong>${esc(it.name)}</strong>, ${itemMeta(it)}<br><span class="muted small">${esc(it.why)}</span></li>`).join('')}</ol>
        <button class="btn" style="background:${s.color}" data-start="${k}" type="button">Faire cette séance</button>
      </article>`).join('')}`;
  $$('[data-start]', el).forEach(b => b.addEventListener('click', () => {
    if (state.active && !confirm('Une séance est déjà en cours. La remplacer ?')) return;
    startSession(b.dataset.start);
  }));
}

/* ================= Suivi ================= */
let chartMetric = 'weight';

function bmi(m) {
  const h = num(m.height) ?? num(state.profile.height);
  if (m.weight == null || !h) return null;
  return m.weight / ((h / 100) ** 2);
}
function bmiLabel(b) {
  if (b == null) return '';
  if (b < 18.5) return 'insuffisant';
  if (b < 25) return 'normal';
  if (b < 30) return 'surpoids';
  return 'obésité';
}

function chartSVG(key) {
  const meta = METRICS[key];
  const pts = state.measures.filter(m => m[key] != null).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (pts.length < 2) return `<p class="empty">Ajoute au moins deux mesures de ${meta.label.toLowerCase()} pour voir la courbe.</p>`;
  const W = 340, H = 170, P = { l: 36, r: 12, t: 12, b: 24 };
  const xs = pts.map(p => +new Date(p.date)), ys = pts.map(p => p[key]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + 1;
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const py = (y1 - y0) * 0.2 || 1; y0 -= py; y1 += py;
  const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r);
  const Y = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join('');
  const grid = [0, .5, 1].map(f => { const v = y0 + (y1 - y0) * f; return `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${P.l - 6}" y="${Y(v) + 3}" text-anchor="end">${fmtNum(v)}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution : ${meta.label}">
    ${grid}
    <path class="curve" d="${path}"/>
    ${pts.map((p, i) => `<circle class="dot" cx="${X(xs[i])}" cy="${Y(ys[i])}" r="3.5"><title>${fmtDate(p.date)} : ${fmtNum(ys[i])} ${meta.unit}</title></circle>`).join('')}
    <text x="${P.l}" y="${H - 6}">${fmtDate(pts[0].date)}</text>
    <text x="${W - P.r}" y="${H - 6}" text-anchor="end">${fmtDate(pts[pts.length - 1].date)}</text>
  </svg>`;
}

function deltaHTML(key, digits = 1) {
  const pts = state.measures.filter(m => m[key] != null).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (pts.length < 2) return '';
  const d = pts[pts.length - 1][key] - pts[0][key];
  if (Math.abs(d) < 0.05) return '<span class="muted">stable</span>';
  // pour la masse grasse et le poids, baisser est généralement l'objectif
  const cls = key === 'muscle' ? (d > 0 ? 'delta-down' : 'delta-up') : (d > 0 ? 'delta-up' : 'delta-down');
  return `<span class="${cls}">${d > 0 ? '+' : '−'}${fmtNum(Math.abs(d), digits)}</span> depuis le début`;
}

function renderTracking() {
  const el = $('#view-tracking');
  const sorted = [...state.measures].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastW = sorted.find(m => m.weight != null);
  const lastF = sorted.find(m => m.fat != null);
  const b = lastW ? bmi(lastW) : null;

  el.innerHTML = `
    <h2>Suivi</h2>
    <div class="panel stats">
      <div><p class="stat__value">${lastW ? fmtNum(lastW.weight) : '–'}</p><p class="stat__label">Poids (kg)<br>${deltaHTML('weight')}</p></div>
      <div><p class="stat__value">${fmtNum(b)}</p><p class="stat__label">IMC ${bmiLabel(b)}</p></div>
      <div><p class="stat__value">${lastF ? fmtNum(lastF.fat) : '–'}</p><p class="stat__label">Masse grasse (%)<br>${deltaHTML('fat')}</p></div>
    </div>
    <p class="muted small">L'IMC surestime souvent la corpulence des sportifs musclés : suis plutôt la masse grasse et ton tour de taille.</p>

    <form class="panel" id="measure-form">
      <h3>Ajouter une mesure</h3>
      <label class="field"><span>Date et heure</span><input type="datetime-local" name="date" value="${localInput(new Date())}" required></label>
      <div class="grid-2">
        <label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" placeholder="82,5"></label>
        <label class="field"><span>Taille (cm)</span><input name="height" inputmode="decimal" value="${esc(state.profile.height)}" placeholder="185"></label>
        <label class="field"><span>Masse grasse (%)</span><input name="fat" inputmode="decimal" placeholder="22,0"></label>
        <label class="field"><span>Masse musculaire (%)</span><input name="muscle" inputmode="decimal" placeholder="74,0"></label>
        <label class="field"><span>Masse osseuse (%)</span><input name="bone" inputmode="decimal" placeholder="4,0"></label>
        <label class="field"><span>Eau corporelle (%)</span><input name="water" inputmode="decimal" placeholder="51,3"></label>
      </div>
      <button class="btn btn--block" type="submit">Enregistrer la mesure</button>
    </form>

    <div class="panel">
      <h3>Évolution</h3>
      <div class="chips" role="group" aria-label="Valeur affichée">
        ${Object.entries(METRICS).map(([k, m]) => `<button class="chip" type="button" data-metric="${k}" aria-pressed="${k === chartMetric}">${m.label}</button>`).join('')}
      </div>
      <div id="chart">${chartSVG(chartMetric)}</div>
    </div>

    <div class="panel">
      <h3>Mesures</h3>
      ${sorted.length ? sorted.map(m => `
        <div class="measure">
          <div>
            <p class="measure__date">${fmtDateTime(m.date)}</p>
            <div class="measure__values">
              ${Object.entries(METRICS).filter(([k]) => m[k] != null).map(([k, meta]) =>
                `<span><b>${fmtNum(m[k])}${meta.unit === '%' ? '%' : ' kg'}</b><span>${meta.label}</span></span>`).join('')}
            </div>
          </div>
          <button class="icon-btn" type="button" data-del="${m.id}" aria-label="Supprimer la mesure du ${fmtDateTime(m.date)}">${TRASH}</button>
        </div>`).join('') : '<p class="empty">Aucune mesure pour l\'instant. Pèse-toi le matin à jeun, toujours dans les mêmes conditions, pour comparer d\'une semaine à l\'autre.</p>'}
    </div>

    <div class="panel">
      <h3>Séances réalisées</h3>
      ${state.history.length ? state.history.slice(0, 15).map(h => `
        <div class="history-item">
          <div>
            <span class="tag" style="--sess:${SESSIONS[h.code]?.color || 'var(--court)'}">${esc(h.code)}</span>
            <strong>${esc(h.name)}</strong>
            <p class="muted small">${fmtDateTime(h.date)}, ${h.minutes} min, ${h.setsDone}/${h.setsTotal} séries${h.rpe ? `, effort ${esc(h.rpe)}/10` : ''}</p>
            ${h.notes ? `<p class="small">${esc(h.notes)}</p>` : ''}
          </div>
          <button class="icon-btn" type="button" data-del-session="${h.id}" aria-label="Supprimer la séance du ${fmtDateTime(h.date)}">${TRASH}</button>
        </div>`).join('') : '<p class="empty">Tes séances terminées apparaîtront ici.</p>'}
    </div>`;

  $('#measure-form').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const entry = { id: Date.now(), date: new Date(f.get('date')).toISOString() };
    ['weight', 'height', 'fat', 'muscle', 'bone', 'water'].forEach(k => { entry[k] = num(f.get(k)); });
    if (['weight', 'fat', 'muscle', 'bone', 'water'].every(k => entry[k] == null)) {
      toast('Renseigne au moins une valeur : poids ou composition.');
      return;
    }
    if (entry.height) state.profile.height = entry.height;
    state.measures.push(entry);
    save();
    toast('Mesure enregistrée.');
    renderTracking();
  };
  $$('[data-metric]', el).forEach(b => b.onclick = () => {
    chartMetric = b.dataset.metric;
    $$('[data-metric]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#chart').innerHTML = chartSVG(chartMetric);
  });
  $$('[data-del]', el).forEach(b => b.onclick = () => {
    if (!confirm('Supprimer cette mesure ?')) return;
    state.measures = state.measures.filter(m => String(m.id) !== b.dataset.del);
    save(); renderTracking();
  });
  $$('[data-del-session]', el).forEach(b => b.onclick = () => {
    if (!confirm('Supprimer cette séance de l\'historique ?')) return;
    state.history = state.history.filter(h => String(h.id) !== b.dataset.delSession);
    save(); renderTracking();
  });
}

/* ================= Profil ================= */
function renderProfile() {
  const el = $('#view-profile'), p = state.profile;
  el.innerHTML = `
    <h2>Profil</h2>
    <div class="panel">
      <label class="field"><span>Prénom</span><input id="p-name" value="${esc(p.name)}" autocomplete="given-name"></label>
      <label class="field"><span>Taille (cm)</span><input id="p-height" inputmode="decimal" value="${esc(p.height)}" placeholder="185"></label>
      <label class="field"><span>Poste</span>
        <select id="p-position">${Object.entries(POSITIONS).map(([k, v]) => `<option value="${k}" ${k === p.position ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
      </label>
    </div>

    <div class="panel">
      <h3>Jours de salle</h3>
      <p class="muted small">Trois jours conseillés, avec au moins un jour de repos entre deux séances.</p>
      <div class="chips" id="p-days">${DAYS.map((d, i) => `<button class="chip" type="button" data-day="${i}" aria-pressed="${p.gymDays.includes(i)}">${d}</button>`).join('')}</div>
      <label class="field"><span>Jour de match habituel</span>
        <select id="p-match">
          <option value="" ${p.matchDay == null ? 'selected' : ''}>Pas de jour fixe</option>
          ${DAYS.map((d, i) => `<option value="${i}" ${p.matchDay === i ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Début du cycle de 4 semaines</span><input id="p-cycle" type="date" value="${esc(p.cycleStart)}"></label>
      <p class="muted small">Tu es en semaine ${cycleWeek()} sur 4${isDeload() ? ' (semaine allégée)' : ''}.</p>
    </div>

    <div class="panel">
      <h3>Sauvegarde</h3>
      <p class="muted small">Tes données restent sur ce téléphone, dans le navigateur. Exporte-les de temps en temps pour ne rien perdre, ou pour les passer sur un autre appareil.</p>
      <div class="chips">
        <button class="btn" id="export" type="button">Exporter mes données</button>
        <label class="btn btn--ghost" style="min-height:48px">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
      </div>
      <button class="btn btn--danger" id="reset" type="button">Tout effacer</button>
    </div>
    <p class="muted small">Ce programme ne remplace pas l'avis d'un médecin ou d'un kiné, surtout en cas de douleur ou de blessure récente.</p>`;

  $('#p-name').oninput = e => { p.name = e.target.value.trim(); save(); };
  $('#p-height').oninput = e => { p.height = num(e.target.value) ?? ''; save(); };
  $('#p-position').onchange = e => { p.position = e.target.value; save(); };
  $('#p-match').onchange = e => { p.matchDay = e.target.value === '' ? null : +e.target.value; save(); };
  $('#p-cycle').onchange = e => { if (e.target.value) { p.cycleStart = e.target.value; save(); renderProfile(); } };
  $$('[data-day]', el).forEach(b => b.onclick = () => {
    const d = +b.dataset.day;
    p.gymDays = p.gymDays.includes(d) ? p.gymDays.filter(x => x !== d) : [...p.gymDays, d];
    b.setAttribute('aria-pressed', String(p.gymDays.includes(d)));
    save();
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
        const d = defaults();
        state = { ...d, ...s, profile: { ...d.profile, ...s.profile } };
        save(); toast('Données importées.'); renderProfile();
      } catch { toast('Fichier non reconnu : choisis un export VolleyFit (.json).'); }
    };
    r.readAsText(file);
  };
  $('#reset').onclick = () => {
    if (!confirm('Effacer toutes tes mesures, séances et réglages ? Exporte-les avant si besoin.')) return;
    state = defaults(); save(); toast('Données effacées.'); renderProfile();
  };
}

/* ================= Divers ================= */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800);
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
