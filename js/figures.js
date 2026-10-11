'use strict';
/* =========================================================
   Illustrations des exercices : un personnage filaire (dessin original)
   animé entre deux positions. Angles en degrés : 0 = vers le bas,
   90 = vers l'avant (droite), 180 = vers le haut, -90 = vers l'arrière.
   ========================================================= */
const FIG = (() => {
  const T = 46, U = 24, F = 22, L1 = 32, L2 = 32, FOOT = 10;
  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;
  const dir = (a, l = 1) => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const f1 = n => n.toFixed(1);

  function ik(base, target, l1, l2, sign) {
    const dx = target[0] - base[0], dy = target[1] - base[1];
    const phi = deg(Math.atan2(dx, dy));
    const d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, Math.hypot(dx, dy)));
    const A = deg(Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
    return [add(base, dir(phi + sign * A, l1)), add(base, dir(phi, d))];
  }

  function solve(p) {
    const hip = p.hip, sh = add(hip, dir(p.t, T));
    const J = { hip, sh, head: add(sh, dir(p.t, 13)), t: p.t };
    for (const i of [0, 1]) {
      const as = p.as ? p.as[i] : 1;
      if (p.hands) { [J['e' + i], J['w' + i]] = ik(sh, p.hands[i], U * as, F * as, p.eb ? p.eb[i] : -1); }
      else { J['e' + i] = add(sh, dir(p.a[2 * i], U * as)); J['w' + i] = add(J['e' + i], dir(p.a[2 * i + 1], F * as)); }
      if (p.wr && p.wr[i]) J['w' + i] = p.wr[i];
      const tl = p.tl ? p.tl[i] : 1;
      if (p.feet) { [J['k' + i], J['a' + i]] = ik(hip, p.feet[i], L1 * tl, L2, p.kb ? p.kb[i] : 1); }
      else { J['k' + i] = add(hip, dir(p.l[2 * i], L1 * tl)); J['a' + i] = add(J['k' + i], dir(p.l[2 * i + 1], L2)); }
      J['t' + i] = add(J['a' + i], dir(p.f ? p.f[i] : 90, FOOT));
    }
    return J;
  }

  function lerp(a, b, u) {
    if (typeof a === 'number') return a + (b - a) * u;
    if (a === null || a === undefined) return a;
    if (Array.isArray(a)) return a.map((v, i) => lerp(v, b ? b[i] : v, u));
    if (typeof a === 'object') { const o = {}; for (const k in a) o[k] = b && k in b ? lerp(a[k], b[k], u) : a[k]; return o; }
    return a;
  }
  const smooth = x => x * x * (3 - 2 * x);

  /* Lecture : pause en position de départ, mouvement, pause en position d'arrivée, retour. */
  function poseU(f, u) {
    const p = lerp(f.p0, f.p1, u);
    if (f.arc) {
      const lift = f.arc * Math.sin(Math.PI * u);
      p.hip = [p.hip[0], p.hip[1] - lift];
      if (p.feet) p.feet = p.feet.map(q => [q[0], q[1] - lift]);
    }
    return p;
  }
  function poseCrank(f, phase) {
    const th = phase * 2 * Math.PI, [cx, cy] = f.crank.c, [rx, ry] = f.crank.r;
    const p = JSON.parse(JSON.stringify(f.p0));
    p.feet = [[cx + rx * Math.cos(th), cy + ry * Math.sin(th)], [cx - rx * Math.cos(th), cy - ry * Math.sin(th)]];
    return p;
  }
  function uAt(f, ph) {
    if (f.loop) return .5 - .5 * Math.cos(2 * Math.PI * ph);
    if (f.hold) return ph < .2 ? smooth(ph / .2) : ph < .8 ? 1 : smooth(1 - (ph - .8) / .2);
    if (ph < .12) return 0;
    if (ph < .45) return smooth((ph - .12) / .33);
    if (ph < .62) return 1;
    if (ph < .95) return 1 - smooth((ph - .62) / .33);
    return 0;
  }
  function phaseLabel(f, ph) {
    if (f.crank || f.loop) return 'Mouvement continu';
    if (f.hold) return ph < .2 ? 'Mise en position' : ph < .8 ? 'Tiens la position' : 'Relâche';
    return ph < .12 ? 'Départ' : ph < .45 ? 'Mouvement' : ph < .62 ? 'Arrivée' : ph < .95 ? 'Retour contrôlé' : 'Départ';
  }
  const poseAt = (f, ph) => f.crank ? poseCrank(f, ph) : poseU(f, uAt(f, ph));
  const endPhase = f => f.crank ? .25 : f.loop ? .5 : .5;

  /* ---------- dessin ---------- */
  const ln = (a, b, cls) => `<line class="${cls}" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`;
  const circ = (c, r, cls) => `<circle class="${cls}" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}"/>`;

  function bgSVG(shapes = []) {
    return shapes.map(s => {
      if (s[0] === 'r') return `<rect class="eq" x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" rx="${s[5] || 0}"/>`;
      if (s[0] === 'l') return `<line class="eq-l" x1="${s[1]}" y1="${s[2]}" x2="${s[3]}" y2="${s[4]}" stroke-width="${s[5] || 4}"/>`;
      if (s[0] === 'c') return `<circle class="eq" cx="${s[1]}" cy="${s[2]}" r="${s[3]}"/>`;
      return '';
    }).join('');
  }

  /* Segments qui bougent le plus = ceux qui travaillent : affichés en couleur. */
  const SEGS = [['sh', 'e0'], ['e0', 'w0'], ['sh', 'e1'], ['e1', 'w1'], ['hip', 'k0'], ['k0', 'a0'], ['hip', 'k1'], ['k1', 'a1'], ['hip', 'sh']];
  const segAngle = (J, a, b) => deg(Math.atan2(J[b][0] - J[a][0], J[b][1] - J[a][1]));
  function activeSet(f) {
    if (f._act) return f._act;
    const A = solve(f.crank ? poseCrank(f, 0) : poseU(f, 0)), B = solve(f.crank ? poseCrank(f, .5) : poseU(f, 1));
    const s = new Set(f.active || []);
    for (const [a, b] of SEGS) {
      let d = Math.abs(segAngle(A, a, b) - segAngle(B, a, b)); d = Math.min(d, 360 - d);
      if (d > 22) s.add(a + '-' + b);
    }
    return (f._act = s);
  }

  /* Trajet du point qui bouge le plus, en pointillés avec une flèche. */
  function trail(f) {
    if (f._trail !== undefined) return f._trail;
    let s = '';
    if (f.crank) {
      const [cx, cy] = f.crank.c, [rx, ry] = f.crank.r;
      s = `<ellipse class="trail" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
    } else if (!f.loop) {
      const J0 = solve(poseU(f, 0)), J1 = solve(poseU(f, 1));
      let key = null, best = 14;
      for (const k of ['w0', 't0', 'a0', 'head', 'hip']) {
        const d = Math.hypot(J1[k][0] - J0[k][0], J1[k][1] - J0[k][1]);
        if (d > best + 3) { best = d; key = k; }
      }
      if (key) {
        const pts = Array.from({ length: 17 }, (_, i) => solve(poseU(f, i / 16))[key]);
        const q = pts[16], p = pts[14];
        const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const tip = [q[0] + Math.cos(a) * 3, q[1] + Math.sin(a) * 3];
        const l = [q[0] + Math.cos(a + 2.5) * 9, q[1] + Math.sin(a + 2.5) * 9];
        const r = [q[0] + Math.cos(a - 2.5) * 9, q[1] + Math.sin(a - 2.5) * 9];
        s = `<polyline class="trail" points="${pts.slice(0, 15).map(x => f1(x[0]) + ',' + f1(x[1])).join(' ')}"/>` +
            `<polygon class="trail-head" points="${[tip, l, r].map(x => f1(x[0]) + ',' + f1(x[1])).join(' ')}"/>`;
      }
    }
    return (f._trail = s);
  }

  function body(J, cls, act, f) {
    const L = (a, b, extra = '') => ln(J[a], J[b], 'limb' + extra + (act && act.has(a + '-' + b) ? ' act' : ''));
    const eye = f && (f.view || 'side') === 'side' ? circ(add(J.head, dir(J.t - 90, 5)), 2.6, 'eye') : '';
    return `<g class="${cls}">
      <g class="far">${L('hip', 'k1')}${L('k1', 'a1')}${ln(J.a1, J.t1, 'limb foot')}${L('sh', 'e1')}${L('e1', 'w1')}</g>
      <g class="near">${L('hip', 'sh', ' trunk')}${circ(J.head, 9, 'head')}${eye}${L('hip', 'k0')}${L('k0', 'a0')}${ln(J.a0, J.t0, 'limb foot')}${L('sh', 'e0')}${L('e0', 'w0')}</g>
    </g>`;
  }

  function propsBack(f, J) {
    let s = '';
    if (f.bar) s += circ([J.sh[0] - 7, J.sh[1] + 3], 11, 'plate');
    if (f.seat) s += `<rect class="eq" x="${f1(J.hip[0] - 13)}" y="${f1(J.hip[1] + 4)}" width="26" height="6" rx="3"/>`;
    if (f.cable) s += ln(f.cable, J.w0, 'cable') + circ(f.cable, 4, 'pad');
    if (f.lever) s += ln(f.lever.p, J[f.lever.j], 'lever');
    return s;
  }
  function propsFront(f, J) {
    let s = '';
    const mid = [(J.w0[0] + J.w1[0]) / 2, (J.w0[1] + J.w1[1]) / 2];
    if (f.lever) s += circ(J[f.lever.j], 6, 'pad');
    if (f.kpad) s += circ(J.k0, 5, 'pad') + circ(J.k1, 5, 'pad');
    switch (f.hand) {
      case 'grip': s += circ(J.w0, 4.5, 'pad'); break;
      case 'bar': s += circ(mid, 10, 'plate'); break;
      case 'hipbar': s += circ([J.hip[0], J.hip[1] - 9], 10, 'plate'); break;
    }
    if (f.plate) s += ln([J.t0[0] - 8, J.t0[1] - 9], [J.t0[0] + 8, J.t0[1] + 9], 'lever');
    return s;
  }

  function frame(f, phase, ghost) {
    if (f.draw) return (ghost ? `<g class="ghost">${f.draw(0, false)}</g>` : '') + f.draw(uAt(f, phase), true);
    const J = solve(poseAt(f, phase));
    let g = trail(f);
    if (ghost) g += body(solve(f.crank ? poseCrank(f, 0) : poseU(f, 0)), 'ghost', null, f);
    return g + propsBack(f, J) + body(J, '', activeSet(f), f) + propsFront(f, J) + (f.labels || []).map(([x, y, t, a]) => `<text class="lbl" x="${x}" y="${y}"${a ? ` text-anchor="${a}"` : ''}>${t}</text>`).join('');
  }

  function wrap(f, inner, label) {
    return `<svg class="fig" viewBox="0 0 200 150" role="img" aria-label="${label || 'Illustration'}">
      ${f.view === 'top' ? '' : '<line class="ground" x1="6" y1="140" x2="194" y2="140"/>'}${bgSVG(f.bg)}<g class="fig-live">${inner}</g></svg>`;
  }

  /* ---------- définitions ---------- */
  const D = (p0, p1, extra = {}) => ({ p0, p1: { ...p0, ...p1 }, ...extra });
  const STAND_FEET = [[106, 137], [102, 137]];
  const TREAD = [['r', 36, 131, 132, 7, 3], ['l', 150, 131, 162, 78, 4], ['r', 150, 70, 26, 9, 3]];
  const LEGPRESS = [['l', 44, 84, 72, 124, 9], ['r', 64, 120, 30, 7, 3], ['l', 96, 124, 170, 58, 4], ['r', 20, 130, 170, 6, 3], ['l', 60, 127, 60, 136, 5]];
  const SMITH = [['l', 60, 14, 60, 140, 4], ['l', 160, 14, 160, 140, 4], ['l', 60, 16, 160, 16, 3]];
  const SEATED = [['r', 58, 100, 46, 8, 3], ['l', 60, 104, 54, 52, 8], ['l', 80, 108, 80, 140, 5], ['r', 60, 132, 40, 6, 3]];
  const WALL = [['r', 178, 10, 8, 130, 2]];

  const run = D(
    { hip: [96, 70], t: 172, a: [-40, 55, 40, 130], feet: [[120, 128], [72, 110]], f: [95, 20] },
    { a: [40, 130, -40, 55], feet: [[72, 110], [120, 128]], f: [20, 95] },
    { bg: TREAD, dur: 900 });

  const DEFS = {
    tapis: run,
    fractionne: { ...run, dur: 650 },
    velo: { p0: { hip: [72, 74], t: 135, hands: [[137, 76], [135, 78]], feet: [[96, 104], [96, 128]], f: [95, 95] },
      crank: { c: [96, 116], r: [12, 12] }, dur: 1400,
      bg: [['l', 72, 80, 96, 116, 5], ['r', 58, 73, 26, 6, 3], ['l', 96, 116, 134, 80, 5], ['r', 128, 73, 16, 6, 3], ['c', 96, 116, 14], ['r', 54, 132, 96, 6, 3], ['l', 96, 116, 100, 132, 4]] },
    rameur: D(
      { hip: [98, 122], t: 158, a: [96, 96, 94, 94], feet: [[146, 124], [144, 124]], f: [150, 150] },
      { hip: [84, 122], t: 200, a: [-40, 80, -42, 78] },
      { bg: [['r', 20, 130, 150, 5, 2], ['l', 150, 132, 156, 108, 5], ['c', 174, 112, 15]], hand: 'grip', cable: [174, 110], seat: true, dur: 2200 }),
    elliptique: { p0: { hip: [94, 66], t: 176, hands: [[146, 74], [144, 76]], feet: [[100, 128], [100, 128]], f: [95, 95] },
      crank: { c: [100, 128], r: [16, 4] }, dur: 1600,
      bg: [['r', 40, 134, 130, 6, 3], ['l', 150, 134, 160, 64, 4], ['r', 152, 58, 20, 8, 3], ['l', 140, 78, 160, 70, 4]] },
    escalier: D(
      { hip: [100, 64], t: 176, hands: [[132, 88], [130, 90]], feet: [[126, 107], [94, 125]], f: [92, 92] },
      { feet: [[94, 125], [126, 107]] },
      { bg: [['r', 60, 128, 46, 12], ['r', 106, 110, 46, 30], ['r', 152, 92, 36, 48], ['l', 118, 86, 168, 86, 4]], dur: 1500 }),

    'box-jump': D(
      { hip: [82, 98], t: 132, a: [-60, -40, -62, -42], feet: [[90, 137], [86, 137]] },
      { hip: [134, 72], t: 155, a: [100, 112, 96, 108], feet: [[140, 101], [136, 101]] },
      { bg: [['r', 114, 104, 46, 36, 3]], arc: 38 }),
    'squat-jump': D(
      { hip: [96, 100], t: 138, a: [-55, -40, -57, -42], feet: [[106, 137], [102, 137]] },
      { hip: [100, 72], t: 178, a: [168, 172, 164, 170], feet: [[104, 130], [100, 130]], f: [40, 40] }),
    presse: D(
      { hip: [76, 118], t: 215, hands: [[84, 116], [82, 117]], feet: [[112, 86], [110, 88]], f: [150, 150] },
      { feet: [[122, 70], [120, 72]] },
      { bg: LEGPRESS, plate: true }),
    'smith-squat': D(
      { hip: [104, 73], t: 180, a: [-30, 165, -34, 165], feet: STAND_FEET },
      { hip: [86, 102], t: 148 },
      { bg: SMITH, bar: true }),
    'squat-goblet': D(
      { hip: [104, 73], t: 180, hands: [[116, 42], [114, 43]], feet: STAND_FEET },
      { hip: [88, 102], t: 154, hands: [[124, 76], [122, 77]] },
      { hand: 'db2' }),
    'fente-bulgare': D(
      { hip: [96, 76], t: 178, a: [2, 2, -2, -2], feet: [[120, 137], [58, 104]], f: [90, -40] },
      { hip: [92, 100] },
      { bg: [['r', 36, 106, 44, 9, 3], ['l', 44, 115, 44, 140, 4], ['l', 72, 115, 72, 140, 4]], hand: 'db' }),
    'leg-ext': D(
      { hip: [70, 98], t: 184, a: [10, 40, 8, 38], l: [90, 2, 88, 2], f: [92, 92] },
      { l: [90, 62, 88, 62], f: [150, 150] },
      { bg: SEATED, lever: { p: [102, 100], j: 'a0' }, hold: true, dur: 3600 }),
    'leg-curl': D(
      { hip: [70, 98], t: 184, a: [10, 40, 8, 38], l: [90, 78, 88, 78], f: [160, 160] },
      { l: [90, -18, 88, -18], f: [70, 70] },
      { bg: [...SEATED, ['r', 80, 86, 30, 6, 3]], lever: { p: [102, 100], j: 'a0' } }),
    rdl: D(
      { hip: [100, 73], t: 180, a: [4, 4, 0, 0], feet: [[104, 137], [100, 137]] },
      { hip: [76, 80], t: 106, a: [2, 2, -2, -2] },
      { hand: 'db', dur: 3000 }),
    abducteurs: D(
      { hip: [100, 88], t: 180, a: [18, 4, -18, -4], l: [10, 0, -10, 0], tl: [.7, .7], f: [90, -90] },
      { l: [52, 10, -52, -10], tl: [.8, .8] },
      { bg: [['r', 76, 36, 48, 54, 6], ['r', 72, 94, 56, 8, 3], ['l', 100, 102, 100, 140, 5]], kpad: true }),
    'mollets-presse': D(
      { hip: [76, 118], t: 215, hands: [[84, 116], [82, 117]], feet: [[118, 74], [116, 76]], f: [170, 170] },
      { feet: [[121, 71], [119, 73]], f: [125, 125] },
      { bg: LEGPRESS, plate: true, dur: 1800 }),
    'mollets-smith': D(
      { hip: [100, 73], t: 180, a: [-30, 165, -34, 165], l: [2, 0, -2, 0], f: [100, 100] },
      { hip: [100, 65], f: [40, 40] },
      { bg: [...SMITH, ['r', 104, 133, 24, 7, 2]], bar: true, dur: 1800 }),

    'rotation-externe': D(
      { hip: [110, 73], t: 180, a: [6, -80, -6, -4], l: [8, 0, -8, 0], f: [90, -90], wr: [[91, 55], null] },
      { wr: [[133, 58], null] },
      { bg: [['l', 34, 16, 34, 140, 6]], cable: [34, 84], hand: 'grip', dur: 2600 }),
    'face-pull': D(
      { hip: [92, 73], t: 186, hands: [[142, 46], [140, 48]], eb: [1, 1], feet: [[104, 137], [84, 137]] },
      { hands: [[106, 22], [104, 24]] },
      { bg: [['l', 172, 14, 172, 140, 6]], cable: [172, 42], hand: 'grip' }),
    'tirage-vertical': D(
      { hip: [92, 106], t: 182, a: [166, 176, 162, 174], l: [90, 0, 88, 0] },
      { a: [-15, 150, -18, 150] },
      { bg: [['r', 76, 110, 34, 7, 3], ['r', 112, 94, 20, 6, 3], ['l', 150, 4, 150, 140, 5], ['l', 100, 4, 150, 4, 4], ['l', 90, 117, 90, 140, 5]], cable: [104, 6], hand: 'grip' }),
    'chest-press': D(
      { hip: [80, 100], t: 182, a: [-62, 95, -64, 95], l: [80, 0, 78, 0] },
      { a: [88, 90, 86, 88] },
      { bg: [['r', 64, 104, 36, 7, 3], ['l', 64, 104, 58, 44, 8], ['l', 82, 111, 82, 140, 5], ['l', 150, 20, 150, 140, 5], ['l', 120, 40, 150, 40, 4]], hand: 'grip' }),
    'dev-incline': D(
      { hip: [96, 112], t: 240, a: [-10, 148, -12, 146], feet: [[128, 137], [124, 137]] },
      { a: [150, 150, 148, 148] },
      { bg: [['l', 102, 118, 44, 86, 9], ['r', 90, 114, 34, 7, 3], ['l', 60, 100, 60, 140, 4], ['l', 108, 121, 108, 140, 4]], hand: 'db' }),
    'rowing-assis': D(
      { hip: [76, 110], t: 180, a: [92, 92, 90, 90], feet: [[128, 118], [126, 120]] },
      { a: [-40, 85, -42, 85] },
      { bg: [['r', 56, 114, 42, 7, 3], ['l', 128, 104, 134, 136, 5], ['l', 152, 40, 152, 140, 6], ['l', 70, 121, 70, 140, 5]], cable: [152, 64], hand: 'grip' }),
    'rowing-haltere': D(
      { hip: [84, 72], t: 96, a: [0, 0, -16, -16], l: [-6, -2, 2, -92] },
      { a: [-150, 0, -16, -16] },
      { bg: [['r', 40, 108, 78, 8, 3], ['l', 50, 116, 50, 140, 4], ['l', 108, 116, 108, 140, 4]], hand: 'db1' }),
    'reverse-fly': D(
      { hip: [80, 100], t: 180, a: [90, 90, 88, 88], l: [80, 0, 78, 0], as: [1, 1] },
      { as: [.15, .15], a: [92, 92, 90, 90] },
      { bg: [['r', 64, 104, 36, 7, 3], ['r', 92, 48, 7, 40, 3], ['l', 82, 111, 82, 140, 5], ['l', 95, 88, 95, 104, 4]], hand: 'grip' }),
    ytw: D(
      { hip: [80, 110], t: 125, a: [0, 0, -4, -4], feet: [[52, 137], [56, 137]] },
      { a: [128, 128, 124, 124] },
      { bg: [['l', 80, 124, 128, 92, 8], ['l', 92, 117, 92, 140, 4], ['l', 118, 100, 118, 140, 4]], hand: 'db' }),
    'medball-overhead': D(
      { hip: [104, 73], t: 192, a: [200, 232, 198, 230], feet: [[118, 137], [86, 137]] },
      { t: 172, a: [122, 116, 120, 114] },
      { bg: WALL, hand: 'mb', dur: 1800 }),
    'slam-ball': D(
      { hip: [100, 73], t: 184, a: [176, 178, 172, 176], feet: [[110, 137], [94, 137]] },
      { hip: [90, 100], t: 122, a: [40, 30, 38, 28] },
      { hand: 'mb', dur: 1800 }),

    'saut-patineur': D(
      { hip: [128, 86], t: 172, a: [-35, -20, 35, 20], feet: [[134, 137], [104, 124]], f: [90, -90] },
      { hip: [72, 86], t: 188, a: [35, 20, -35, -20], feet: [[100, 124], [66, 137]] },
      { arc: 20, dur: 2000 }),
    'kb-swing': D(
      { hip: [84, 80], t: 108, a: [-24, -24, -26, -26], feet: [[106, 137], [102, 137]] },
      { hip: [100, 73], t: 182, a: [90, 90, 88, 88] },
      { hand: 'kb', dur: 1600 }),
    'medball-rotation': D(
      { hip: [100, 74], t: 188, hands: [[74, 96], [76, 98]], feet: [[124, 137], [78, 137]], f: [90, -90] },
      { t: 172, hands: [[152, 58], [150, 60]] },
      { bg: WALL, hand: 'mb', dur: 1800 }),
    woodchop: D(
      { hip: [100, 74], t: 186, hands: [[66, 34], [68, 36]], feet: [[124, 137], [78, 137]], f: [90, -90] },
      { t: 174, hands: [[140, 100], [138, 102]] },
      { bg: [['l', 28, 10, 28, 140, 6]], cable: [28, 22], hand: 'grip' }),
    pallof: D(
      { hip: [100, 73], t: 180, hands: [[110, 58], [108, 60]], feet: [[110, 137], [92, 137]] },
      { hands: [[146, 56], [144, 58]] },
      { bg: [['l', 44, 14, 44, 140, 6]], cable: [44, 58], hand: 'grip', hold: true, dur: 3200 }),
    planche: D(
      { hip: [96, 119], t: 98, a: [0, 90, 2, 90], feet: [[34, 130], [38, 130]], f: [5, 5] },
      { hip: [96, 116] },
      { hold: true, dur: 3600 }),
    'planche-laterale': D(
      { hip: [96, 124], t: 100, a: [0, 90, 180, 180], feet: [[34, 132], [34, 128]], f: [5, 5] },
      { hip: [96, 113] },
      { hold: true, dur: 3600 }),
    equilibre: D(
      { hip: [100, 71], t: 180, a: [60, 80, -50, -70], l: [2, 0, 82, -4] },
      { t: 185, a: [70, 92, -60, -82] },
      { bg: [['r', 86, 135, 30, 5, 3]], dur: 3000 }),

    'foam-roller': D(
      { hip: [58, 130], t: 204, hands: [[40, 136], [38, 136]], l: [86, 86, 88, 88] },
      { hip: [78, 130], hands: [[60, 136], [58, 136]] },
      { bg: [['c', 124, 133, 7]], dur: 2600 }),
    'mobilite-90-90': D(
      { hip: [100, 130], t: 180, a: [22, 4, -22, -4], l: [120, 40, 165, 60], f: [90, -90] },
      { l: [195, -60, 240, -40] },
      { dur: 3000 }),
    sleeper: D(
      { hip: [84, 130], t: 90, a: [180, 180, 160, 150], l: [-88, -80, -92, -84], f: [180, 180] },
      { a: [180, 112, 160, 118] },
      { hold: true, dur: 3600 }),
    etirements: D(
      { hip: [100, 73], t: 180, hands: [[96, 82], [150, 40]], l: [-4, 176, 2, 0], f: [190, 90] },
      { hands: [[92, 78], [150, 40]], l: [-10, 182, 2, 0] },
      { hold: true, dur: 3600 })
  };


  /* ---------- exercices sur machines ajoutés ---------- */
  DEFS['presse-explosive'] = { ...DEFS.presse, dur: 2200 };
  DEFS['fente-smith'] = D(
    { hip: [96, 76], t: 180, a: [-30, 165, -34, 165], feet: [[124, 137], [66, 135]], f: [90, 55] },
    { hip: [94, 100] },
    { bg: SMITH, bar: true });
  DEFS['rdl-smith'] = D(
    { hip: [100, 73], t: 180, a: [4, 4, 0, 0], feet: [[104, 137], [100, 137]] },
    { hip: [76, 80], t: 106, a: [2, 2, -2, -2] },
    { bg: SMITH, hand: 'bar', dur: 3600 });
  DEFS['hip-thrust'] = D(
    { hip: [92, 124], t: -110, hands: [[92, 114], [90, 115]], feet: [[130, 137], [126, 137]] },
    { hip: [96, 102], t: -92, hands: [[96, 92], [94, 93]] },
    { bg: [...SMITH, ['r', 18, 112, 42, 9, 3], ['l', 28, 121, 28, 140, 4], ['l', 52, 121, 52, 140, 4]], hand: 'hipbar' });
  DEFS.adducteurs = D(
    { hip: [100, 88], t: 180, a: [18, 4, -18, -4], l: [52, 10, -52, -10], tl: [.8, .8], f: [90, -90] },
    { l: [10, 0, -10, 0], tl: [.7, .7] },
    { bg: [['r', 76, 36, 48, 54, 6], ['r', 72, 94, 56, 8, 3], ['l', 100, 102, 100, 140, 5]], kpad: true });
  DEFS['pull-over'] = D(
    { hip: [94, 73], t: 168, a: [156, 156, 152, 152], feet: [[108, 137], [86, 137]] },
    { a: [8, 8, 4, 4] },
    { bg: [['l', 174, 10, 174, 140, 6]], cable: [174, 20], hand: 'grip' });
  DEFS['y-raise'] = D(
    { hip: [96, 73], t: 176, a: [20, 20, 16, 16], feet: [[106, 137], [90, 137]] },
    { a: [150, 150, 146, 146] },
    { bg: [['l', 168, 20, 168, 140, 6]], cable: [168, 128], hand: 'grip' });
  DEFS['crunch-machine'] = D(
    { hip: [80, 100], t: 190, a: [-10, 175, -12, 175], l: [80, 0, 78, 0] },
    { t: 132, a: [30, 170, 28, 170] },
    { bg: [['r', 62, 104, 38, 7, 3], ['l', 82, 111, 82, 140, 5], ['r', 108, 126, 14, 8, 3], ['l', 48, 20, 48, 140, 5]] });
  DEFS['extension-lombaire'] = D(
    { hip: [96, 80], t: 20, hands: [[118, 112], [116, 113]], feet: [[44, 122], [46, 122]], f: [160, 160] },
    { t: 128, hands: [[124, 62], [122, 63]] },
    { bg: [['l', 86, 100, 106, 84, 8], ['r', 32, 124, 24, 6, 3], ['l', 44, 130, 44, 140, 4], ['l', 96, 92, 96, 140, 4]] });
  for (const k of ['tapis', 'fractionne', 'escalier']) DEFS[k].loop = true;


  /* ---------- vues de dessus (la personne regarde vers le bas de l'image) ---------- */
  const T_ = (x, y, t, a) => `<text class="lbl" x="${x}" y="${y}"${a ? ` text-anchor="${a}"` : ''}>${t}</text>`;
  const seg = (a, b, cls) => ln(a, b, 'limb ' + cls);
  const polar = (c, ang, r) => [c[0] + Math.cos(rad(ang)) * r, c[1] + Math.sin(rad(ang)) * r];
  function arcPath(c, r, a0, a1) {
    const n = 18, pts = Array.from({ length: n + 1 }, (_, i) => polar(c, a0 + (a1 - a0) * i / n, r));
    const q = pts[n], p = pts[n - 2], a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const tip = [q[0] + Math.cos(a) * 3, q[1] + Math.sin(a) * 3];
    const l = [q[0] + Math.cos(a + 2.5) * 9, q[1] + Math.sin(a + 2.5) * 9], rr = [q[0] + Math.cos(a - 2.5) * 9, q[1] + Math.sin(a - 2.5) * 9];
    return `<polyline class="trail" points="${pts.slice(0, n - 1).map(x => f1(x[0]) + ',' + f1(x[1])).join(' ')}"/><polygon class="trail-head" points="${[tip, l, rr].map(x => f1(x[0]) + ',' + f1(x[1])).join(' ')}"/>`;
  }
  function lineTrail(a, b) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const tip = [b[0] + Math.cos(ang) * 3, b[1] + Math.sin(ang) * 3];
    const l = [b[0] + Math.cos(ang + 2.5) * 9, b[1] + Math.sin(ang + 2.5) * 9], r = [b[0] + Math.cos(ang - 2.5) * 9, b[1] + Math.sin(ang - 2.5) * 9];
    return `<line class="trail" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/><polygon class="trail-head" points="${[tip, l, r].map(x => f1(x[0]) + ',' + f1(x[1])).join(' ')}"/>`;
  }
  const torsoTop = (cx, cy) => `<rect class="tv-torso" x="${cx - 34}" y="${cy - 11}" width="68" height="22" rx="11"/><circle class="tv-head" cx="${cx}" cy="${cy}" r="13"/><circle class="eye" cx="${cx - 4}" cy="${cy + 8}" r="2.4"/><circle class="eye" cx="${cx + 4}" cy="${cy + 8}" r="2.4"/>`;

  DEFS['rotation-externe'] = { view: 'top', dur: 3800, draw(u, tr) {
    const elbow = [132, 76], ang = 143 - 113 * u, hand = polar(elbow, ang, 38), pulley = [24, 104];
    return `${tr ? arcPath(elbow, 38, 143, 30) : ''}
      <circle class="eq" cx="${pulley[0]}" cy="${pulley[1]}" r="9"/>${tr ? T_(24, 126, 'Poulie', 'middle') : ''}
      ${ln(pulley, hand, 'cable')}
      ${torsoTop(96, 62)}
      ${seg([62, 64], [58, 78], 'far-l')}
      <rect class="pad" x="124" y="68" width="6" height="12" rx="2"/>
      ${seg([128, 64], elbow, 'near-l')}${seg(elbow, hand, 'near-l act')}
      <circle class="pad" cx="${f1(hand[0])}" cy="${f1(hand[1])}" r="5"/>
      ${tr ? T_(100, 28, 'le coude reste collé au corps', 'middle') : ''}`;
  } };

  DEFS.pallof = { view: 'top', dur: 4200, hold: true, draw(u, tr) {
    const pulley = [22, 92], hy = 86 + 40 * u, hand = [100, hy];
    const out = 18 * (1 - u), mid = (68 + 100) / 2;
    const eL = [mid - out * .2 - 2, (60 + hy) / 2], eR = [200 - (mid - out * .2 - 2), (60 + hy) / 2];
    eL[0] -= out; eR[0] += out;
    return `${tr ? lineTrail([100, 92], [100, 128]) : ''}
      <circle class="eq" cx="${pulley[0]}" cy="${pulley[1]}" r="9"/>${tr ? T_(22, 114, 'Poulie', 'middle') : ''}
      ${ln(pulley, hand, 'cable')}
      ${torsoTop(100, 58)}
      ${seg([68, 60], eL, 'far-l act')}${seg(eL, hand, 'far-l act')}
      ${seg([132, 60], eR, 'near-l act')}${seg(eR, hand, 'near-l act')}
      <circle class="pad" cx="100" cy="${f1(hy)}" r="5.5"/>
      ${tr ? T_(100, 28, 'le buste ne tourne pas', 'middle') : ''}`;
  } };

  DEFS['reverse-fly'] = { view: 'top', dur: 3800, draw(u, tr) {
    const L = 60, aL = 71 + 104 * u, aR = 180 - aL;
    const sL = [68, 60], sR = [132, 60], hL = polar(sL, aL, L), hR = polar(sR, aR, L);
    return `${tr ? arcPath(sL, L, 71, 175) + arcPath(sR, L, 109, 5) : ''}
      <rect class="eq" x="74" y="76" width="52" height="9" rx="4"/>${tr ? T_(100, 98, 'coussin', 'middle') : ''}
      ${torsoTop(100, 60)}
      ${seg(sL, hL, 'far-l act')}${seg(sR, hR, 'near-l act')}
      <circle class="pad" cx="${f1(hL[0])}" cy="${f1(hL[1])}" r="5"/><circle class="pad" cx="${f1(hR[0])}" cy="${f1(hR[1])}" r="5"/>`;
  } };

  function legsTop(u, open, tr) {
    const t = open ? u : 1 - u;
    const hipL = [90, 70], hipR = [110, 70];
    const kL = [94 - 30 * t, 124 - 6 * t], kR = [106 + 30 * t, 124 - 6 * t];
    const padOff = open ? 8 : -8;
    const a0 = Math.atan2(124 - 70, 94 - 90) * 180 / Math.PI, a1 = Math.atan2(118 - 70, 64 - 90) * 180 / Math.PI;
    const b0 = 180 - a0, b1 = 180 - a1;
    const L = Math.hypot(4, 54);
    const trails = !tr ? '' : open ? arcPath(hipL, L, a0, a1) + arcPath(hipR, L, b0, b1) : arcPath(hipL, Math.hypot(30, 48), a1, a0) + arcPath(hipR, Math.hypot(30, 48), b1, b0);
    return `${trails}
      <rect class="eq" x="62" y="34" width="76" height="9" rx="4"/>
      <rect class="eq" x="66" y="44" width="68" height="44" rx="10"/>
      ${torsoTop(100, 52)}
      ${seg([68, 54], [64, 80], 'far-l')}${seg([132, 54], [136, 80], 'near-l')}
      ${seg(hipL, kL, 'far-l act')}${seg(hipR, kR, 'near-l act')}
      <circle class="pad" cx="${f1(kL[0] - padOff)}" cy="${f1(kL[1])}" r="6"/><circle class="pad" cx="${f1(kR[0] + padOff)}" cy="${f1(kR[1])}" r="6"/>
      ${tr ? T_(100, 146, open ? 'coussins à l\'extérieur des genoux' : 'coussins à l\'intérieur des genoux', 'middle') : ''}`;
  }
  DEFS.abducteurs = { view: 'top', dur: 3600, draw: (u, tr) => legsTop(u, true, tr) };
  DEFS.adducteurs = { view: 'top', dur: 3600, draw: (u, tr) => legsTop(u, false, tr) };

  for (const k of ['woodchop', 'medball-rotation', 'saut-patineur', 'mobilite-90-90', 'planche-laterale']) if (DEFS[k]) DEFS[k].view = 'front';

  /* Étiquettes du matériel sur les vues de côté */
  const LABELS = {
    presse: [[150, 50, 'plateforme', 'middle']], 'presse-explosive': [[150, 50, 'plateforme', 'middle']], 'mollets-presse': [[150, 50, 'plateforme', 'middle']],
    'face-pull': [[172, 34, 'poulie', 'middle']], 'tirage-vertical': [[150, 150, '', '']], 'pull-over': [[174, 12, 'poulie', 'middle']],
    'y-raise': [[168, 120, 'poulie', 'middle']], woodchop: [[28, 14, 'poulie', 'middle']], 'leg-ext': [[110, 120, 'rouleau', 'start']],
    'leg-curl': [[110, 120, 'rouleau', 'start']], 'hip-thrust': [[38, 108, 'banc', 'middle']], 'extension-lombaire': [[44, 120, 'cale-pieds', 'middle']],
    'rowing-assis': [[152, 56, 'poulie', 'middle']], 'chest-press': [[150, 36, 'poignées', 'end']], 'crunch-machine': [[48, 14, 'machine', 'middle']]
  };
  for (const [k, v] of Object.entries(LABELS)) if (DEFS[k]) DEFS[k].labels = v.filter(x => x[2]);

  const VIEWS = { side: 'Vue de côté', front: 'Vue de face', top: 'Vue de dessus' };
  const HINTS = {
    'rotation-externe': "Vue de dessus : tu regardes vers le bas de l'image. Le coude reste collé au corps, seul l'avant-bras pivote vers l'extérieur, comme une porte qui s'ouvre.",
    pallof: "Vue de dessus. La poulie tire sur le côté : tu pousses les mains droit devant toi sans laisser le buste tourner vers la poulie.",
    'reverse-fly': "Vue de dessus, poitrine contre le coussin. Les bras tendus s'ouvrent sur les côtés jusqu'à l'alignement des épaules.",
    abducteurs: "Vue de dessus, assis. Les genoux s'écartent en poussant les coussins, puis reviennent lentement.",
    adducteurs: "Vue de dessus, assis. Les genoux se rapprochent en serrant les coussins, puis s'écartent lentement.",
    woodchop: "Vue de face. Bras presque tendus, tu tires la poignée du haut vers la hanche opposée en pivotant le buste.",
    'face-pull': "Vue de côté. La corde vient vers le visage, coudes hauts.",
    'tirage-vertical': "Vue de côté, assis. La barre descend vers le haut de la poitrine, coudes vers le bas.",
    'chest-press': "Vue de côté, assis. Les bras poussent les poignées droit devant.",
    'rowing-assis': "Vue de côté, assis. Les coudes reculent le long du corps, le buste reste droit.",
    presse: "Vue de côté, dos sur le siège incliné. Les jambes poussent la plateforme puis reviennent lentement.",
    'presse-explosive': "Vue de côté, dos sur le siège incliné. Descente lente, poussée la plus rapide possible.",
    'leg-ext': "Vue de côté, assis. La jambe se tend puis reste immobile : c'est une tenue.",
    'leg-curl': "Vue de côté, assis. Le talon descend et passe sous le siège.",
    'smith-squat': "Vue de côté. La barre guidée reste sur le haut du dos, tu descends jusqu'à cuisses parallèles.",
    'fente-smith': "Vue de côté. Un pied devant, un pied derrière : tu descends verticalement.",
    'rdl-smith': "Vue de côté. Les hanches reculent, le dos reste plat, la barre glisse le long des jambes.",
    'hip-thrust': "Vue de côté. Le haut du dos reste sur le banc, les hanches montent jusqu'à l'alignement épaules-genoux.",
    'crunch-machine': "Vue de côté, assis. Le buste s'enroule vers les genoux.",
    'extension-lombaire': "Vue de côté. Le bassin est calé sur le coussin, le buste remonte jusqu'à l'alignement avec les jambes.",
    'y-raise': "Vue de côté. Bras tendus, les poignées montent de devant les cuisses jusqu'au-dessus de la tête.",
    'pull-over': "Vue de côté. Bras presque tendus, la barre descend du haut jusqu'aux cuisses.",
    'mollets-presse': "Vue de côté. Jambes tendues, seules les chevilles bougent : les orteils poussent la plateforme.",
    'mollets-smith': "Vue de côté. Tu montes sur la pointe des pieds, talons dans le vide."
  };

  /* ---------- API ---------- */
  function svg(id, label) {
    const f = DEFS[id];
    if (!f) return '';
    return wrap(f, frame(f, endPhase(f), !f.crank && !f.loop), label);
  }

  function mount(el, id, { label, onPhase } = {}) {
    const f = DEFS[id];
    const noop = { stop() {}, set() {}, speed() { return 1; } };
    if (!el || !f) return noop;
    el.innerHTML = wrap(f, frame(f, 0, false), label);
    const g = el.querySelector('.fig-live');
    const base = f.dur || 3400;
    let mode = 'play', slow = false, raf = null, acc = 0, last = null, lastLabel = '';
    const draw = ph => {
      g.innerHTML = frame(f, ph, false);
      const t = phaseLabel(f, ph);
      if (onPhase && t !== lastLabel) { lastLabel = t; onPhase(t); }
    };
    const loop = ts => {
      if (mode === 'play') {
        if (last !== null) acc += (ts - last) / (slow ? 1.8 : 1);
        last = ts;
        draw((acc % base) / base);
      }
      raf = requestAnimationFrame(loop);
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { mode = 'end'; draw(endPhase(f)); }
    else raf = requestAnimationFrame(loop);
    return {
      stop() { cancelAnimationFrame(raf); },
      set(m) {
        mode = m; last = null;
        if (m === 'start') draw(0);
        if (m === 'end') draw(endPhase(f));
        if (m === 'play' && raf === null) raf = requestAnimationFrame(loop);
      },
      speed() { slow = !slow; return slow; }
    };
  }

  /* ---------- carte des muscles ---------- */
  const MAP = {
    front: [
      ['deltoides', 'e', 32, 38, 7, 6], ['deltoides', 'e', 68, 38, 7, 6],
      ['pectoraux', 'r', 36, 37, 13.5, 15, 5], ['pectoraux', 'r', 50.5, 37, 13.5, 15, 5],
      ['biceps', 'e', 27, 57, 4.5, 9], ['biceps', 'e', 73, 57, 4.5, 9],
      ['abdos', 'r', 43.5, 55, 13, 30, 4],
      ['obliques', 'e', 38.5, 69, 3.8, 11], ['obliques', 'e', 61.5, 69, 3.8, 11],
      ['quadriceps', 'e', 41.5, 118, 6.5, 18], ['quadriceps', 'e', 58.5, 118, 6.5, 18],
      ['adducteurs', 'e', 47.6, 106, 2.4, 11], ['adducteurs', 'e', 52.4, 106, 2.4, 11],
      ['mollets', 'e', 41, 159, 4, 12], ['mollets', 'e', 59, 159, 4, 12]
    ],
    back: [
      ['trapezes', 'p', '50,23 63,35 50,53 37,35'],
      ['deltoides-arr', 'e', 32, 38, 7, 6], ['deltoides-arr', 'e', 68, 38, 7, 6],
      ['coiffe', 'e', 42, 44, 5, 4.5], ['coiffe', 'e', 58, 44, 5, 4.5],
      ['dorsaux', 'p', '36,48 48,55 48,72 41,77 35,61'], ['dorsaux', 'p', '64,48 52,55 52,72 59,77 65,61'],
      ['triceps', 'e', 27, 57, 4.5, 9], ['triceps', 'e', 73, 57, 4.5, 9],
      ['lombaires', 'r', 44, 72, 12, 13, 3],
      ['abducteurs', 'e', 36.5, 90, 3.4, 6.5], ['abducteurs', 'e', 63.5, 90, 3.4, 6.5],
      ['fessiers', 'e', 43.5, 96, 6.5, 8], ['fessiers', 'e', 56.5, 96, 6.5, 8],
      ['ischios', 'e', 42, 122, 6.5, 16], ['ischios', 'e', 58, 122, 6.5, 16],
      ['mollets', 'e', 41.5, 156, 5, 13], ['mollets', 'e', 58.5, 156, 5, 13]
    ]
  };
  const SILHOUETTE = `<circle cx="50" cy="12" r="9"/><rect x="46" y="19" width="8" height="9" rx="2"/>
    <path d="M29,31 Q50,25 71,31 L75,41 L67,61 L65,84 L67,101 L33,101 L35,84 L33,61 L25,41 Z"/>
    <rect x="21" y="39" width="11" height="30" rx="5"/><rect x="68" y="39" width="11" height="30" rx="5"/>
    <rect x="19" y="66" width="10" height="27" rx="5"/><rect x="71" y="66" width="10" height="27" rx="5"/>
    <circle cx="23" cy="97" r="4.5"/><circle cx="77" cy="97" r="4.5"/>
    <rect x="34" y="96" width="15" height="44" rx="7"/><rect x="51" y="96" width="15" height="44" rx="7"/>
    <rect x="35" y="137" width="12" height="36" rx="6"/><rect x="53" y="137" width="12" height="36" rx="6"/>
    <ellipse cx="40" cy="176" rx="6" ry="3"/><ellipse cx="60" cy="176" rx="6" ry="3"/>`;
  function muscleShape(m, cls) {
    if (m[1] === 'e') return `<ellipse class="${cls}" cx="${m[2]}" cy="${m[3]}" rx="${m[4]}" ry="${m[5]}"/>`;
    if (m[1] === 'r') return `<rect class="${cls}" x="${m[2]}" y="${m[3]}" width="${m[4]}" height="${m[5]}" rx="${m[6]}"/>`;
    return `<polygon class="${cls}" points="${m[2]}"/>`;
  }
  function muscles(target = {}, label = 'Muscles ciblés', levels = null) {
    const P = new Set(target.p || []), S = new Set(target.s || []);
    const cls = k => levels ? (levels[k] ? 'mm-l' + levels[k] : 'mm-n') : P.has(k) ? 'mm-p' : S.has(k) ? 'mm-s' : 'mm-n';
    const side = (list, dx, name) => `<g transform="translate(${dx},4)"><g class="mm-base">${SILHOUETTE}</g>
      ${list.map(m => muscleShape(m, cls(m[0]))).join('')}
      <text x="50" y="188" text-anchor="middle">${name}</text></g>`;
    return `<svg class="musclemap" viewBox="0 0 210 196" role="img" aria-label="${label}">
      ${side(MAP.front, 0, 'Face')}${side(MAP.back, 108, 'Dos')}</svg>`;
  }

  const view = id => VIEWS[DEFS[id]?.view || 'side'];
  const hint = id => HINTS[id] || '';
  return { svg, mount, muscles, view, hint, ids: Object.keys(DEFS) };
})();
