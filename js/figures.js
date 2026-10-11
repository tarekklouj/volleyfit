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
    const J = { hip, sh, head: add(sh, dir(p.t, 13)) };
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

  function poseAt(f, phase) {
    if (f.crank) {
      const th = phase * 2 * Math.PI, [cx, cy] = f.crank.c, [rx, ry] = f.crank.r;
      const p = JSON.parse(JSON.stringify(f.p0));
      p.feet = [[cx + rx * Math.cos(th), cy + ry * Math.sin(th)], [cx - rx * Math.cos(th), cy - ry * Math.sin(th)]];
      return p;
    }
    const u = f.hold
      ? (phase < .25 ? smooth(phase / .25) : phase < .75 ? 1 : smooth(1 - (phase - .75) / .25))
      : .5 - .5 * Math.cos(2 * Math.PI * phase);
    const p = lerp(f.p0, f.p1, u);
    if (f.arc) {
      const lift = f.arc * Math.sin(Math.PI * u);
      p.hip = [p.hip[0], p.hip[1] - lift];
      if (p.feet) p.feet = p.feet.map(q => [q[0], q[1] - lift]);
    }
    return p;
  }

  /* ---------- dessin ---------- */
  const ln = (a, b, cls, w) => `<line class="${cls}" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"${w ? ` stroke-width="${w}"` : ''}/>`;
  const circ = (c, r, cls) => `<circle class="${cls}" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}"/>`;

  function bgSVG(shapes = []) {
    return shapes.map(s => {
      if (s[0] === 'r') return `<rect class="eq" x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" rx="${s[5] || 0}"/>`;
      if (s[0] === 'l') return `<line class="eq-l" x1="${s[1]}" y1="${s[2]}" x2="${s[3]}" y2="${s[4]}" stroke-width="${s[5] || 4}"/>`;
      if (s[0] === 'c') return `<circle class="eq" cx="${s[1]}" cy="${s[2]}" r="${s[3]}"/>`;
      return '';
    }).join('');
  }

  function body(J, cls) {
    const limbs = i => ln(J.sh, J['e' + i], 'limb', 0) + ln(J['e' + i], J['w' + i], 'limb', 0);
    const legs = i => ln(J.hip, J['k' + i], 'limb', 0) + ln(J['k' + i], J['a' + i], 'limb', 0) + ln(J['a' + i], J['t' + i], 'limb foot', 0);
    return `<g class="${cls}">
      <g class="far">${legs(1)}${limbs(1)}</g>
      <g class="near">${ln(J.hip, J.sh, 'limb trunk', 0)}${circ(J.head, 9, 'head')}${legs(0)}${limbs(0)}</g>
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
      case 'db': s += circ(J.w0, 5, 'prop') + circ(J.w1, 5, 'prop'); break;
      case 'db1': s += circ(J.w0, 5.5, 'prop'); break;
      case 'db2': s += circ(mid, 7, 'prop'); break;
      case 'kb': s += circ([mid[0], mid[1] + 8], 8, 'prop'); break;
      case 'mb': s += circ(mid, 10, 'prop'); break;
      case 'grip': s += circ(J.w0, 4, 'pad'); break;
    }
    if (f.plate) s += ln([J.t0[0] - 8, J.t0[1] - 9], [J.t0[0] + 8, J.t0[1] + 9], 'lever');
    return s;
  }

  function frame(f, phase, ghost) {
    const J = solve(poseAt(f, phase));
    let g = '';
    if (ghost) g += body(solve(poseAt(f, 0)), 'ghost');
    return g + propsBack(f, J) + body(J, '') + propsFront(f, J);
  }

  function wrap(f, inner, label) {
    return `<svg class="fig" viewBox="0 0 200 150" role="img" aria-label="${label || 'Illustration'}">
      <line class="ground" x1="6" y1="140" x2="194" y2="140"/>${bgSVG(f.bg)}<g class="fig-live">${inner}</g></svg>`;
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
      { hip: [100, 92], t: 180, a: [18, 4, -18, -4], l: [14, 2, -14, -2], tl: [.45, .45], f: [90, -90] },
      { l: [58, 8, -58, -8], tl: [.6, .6] },
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

  /* ---------- API ---------- */
  function svg(id, label) {
    const f = DEFS[id];
    if (!f) return '';
    const ghost = !f.crank && !f.hold && id !== 'tapis' && id !== 'fractionne';
    return wrap(f, frame(f, f.crank ? 0 : .5, ghost), label);
  }

  function mount(el, id, label) {
    const f = DEFS[id];
    if (!el || !f) return () => {};
    el.innerHTML = wrap(f, frame(f, .5, false), label);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.innerHTML = svg(id, label); return () => {}; }
    const g = el.querySelector('.fig-live');
    const dur = f.dur || 2400;
    let raf, t0;
    const loop = ts => {
      if (!t0) t0 = ts;
      g.innerHTML = frame(f, ((ts - t0) % dur) / dur, false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }

  return { svg, mount, ids: Object.keys(DEFS) };
})();
