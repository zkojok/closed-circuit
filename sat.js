// Satellite carrier & link budget calculator (broadcast page): DVB-S / DVB-S2 / DVB-S2X.
// Bitrate from ETSI EN 300 421 / EN 302 307-1/-2 frame structure; Es/N0 thresholds are ideal AWGN (QEF) values.
(function () {
  var root = document.getElementById('sat-calc');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var WA = '96170368646';
  var t = function (ar, en) { return EN ? en : ar; };
  var f = function (x, d) { return Number(x).toLocaleString('en', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var log10 = function (x) { return Math.log(x) / Math.LN10; };
  var db2 = function (x) { return Math.pow(10, x / 10); };

  // ---------- MODCOD tables ----------
  var BPS = { QPSK: 2, '8PSK': 3, '16APSK': 4, '32APSK': 5, '64APSK': 6 };
  var BCH = { '2/3': 160, '5/6': 160, '8/9': 128, '9/10': 128 }; // legacy DVB-S2 BCH parity (others 192)
  // [modulation, rate, required Es/N0 dB] — DVB-S2 (EN 302 307-1 table 13)
  var S2 = [
    ['QPSK', '1/4', -2.35], ['QPSK', '1/3', -1.24], ['QPSK', '2/5', -0.30], ['QPSK', '1/2', 1.00], ['QPSK', '3/5', 2.23], ['QPSK', '2/3', 3.10],
    ['QPSK', '3/4', 4.03], ['QPSK', '4/5', 4.68], ['QPSK', '5/6', 5.18], ['QPSK', '8/9', 6.20], ['QPSK', '9/10', 6.42],
    ['8PSK', '3/5', 5.50], ['8PSK', '2/3', 6.62], ['8PSK', '3/4', 7.91], ['8PSK', '5/6', 9.35], ['8PSK', '8/9', 10.69], ['8PSK', '9/10', 10.98],
    ['16APSK', '2/3', 8.97], ['16APSK', '3/4', 10.21], ['16APSK', '4/5', 11.03], ['16APSK', '5/6', 11.61], ['16APSK', '8/9', 12.89], ['16APSK', '9/10', 13.13],
    ['32APSK', '3/4', 12.73], ['32APSK', '4/5', 13.64], ['32APSK', '5/6', 14.28], ['32APSK', '8/9', 15.69], ['32APSK', '9/10', 16.05]
  ];
  // DVB-S2X additional normal-frame MODCODs (EN 302 307-2, approx. thresholds)
  var S2X = S2.concat([
    ['QPSK', '13/45', -2.03], ['QPSK', '9/20', 0.22], ['QPSK', '11/20', 1.45],
    ['8PSK', '23/36', 6.12], ['8PSK', '25/36', 7.02], ['8PSK', '13/18', 7.49],
    ['16APSK', '26/45', 7.51], ['16APSK', '3/5', 7.80], ['16APSK', '28/45', 8.10], ['16APSK', '23/36', 8.38], ['16APSK', '25/36', 9.27], ['16APSK', '13/18', 9.71], ['16APSK', '7/9', 10.65], ['16APSK', '77/90', 11.99],
    ['32APSK', '32/45', 11.10], ['32APSK', '11/15', 11.75], ['32APSK', '7/9', 12.73],
    ['64APSK', '11/15', 14.81], ['64APSK', '7/9', 15.47], ['64APSK', '4/5', 15.87], ['64APSK', '5/6', 16.55]
  ]);
  // DVB-S: QPSK only, QEF Eb/N0 after RS (EN 300 421)
  var S1 = [['QPSK', '1/2', 4.5], ['QPSK', '2/3', 5.0], ['QPSK', '3/4', 5.5], ['QPSK', '5/6', 6.0], ['QPSK', '7/8', 6.4]];
  var STD = {
    s: { n: 'DVB-S', list: S1, ro: [0.35] },
    s2: { n: 'DVB-S2', list: S2, ro: [0.35, 0.25, 0.20] },
    s2x: { n: 'DVB-S2X', list: S2X, ro: [0.35, 0.25, 0.20, 0.15, 0.10, 0.05] }
  };
  var rv = function (r) { var p = r.split('/'); return p[0] / p[1]; };
  var S1_ES = function (rate, ebn0) { return ebn0 + 10 * log10(2 * rv(rate) * 188 / 204); };

  function eff(std, mod, rate, pilots) { // useful bits per symbol
    var m = BPS[mod], r = rv(rate);
    if (std === 's') return m * r * 188 / 204;
    var legacy = S2.some(function (x) { return x[0] === mod && x[1] === rate; });
    var kbch = Math.round(64800 * r) - (legacy ? (BCH[rate] || 192) : 192);
    var slots = 64800 / m / 90;
    var syms = 90 + 64800 / m + (pilots ? 36 * Math.floor((slots - 1) / 16) : 0);
    return (kbch - 80) / syms;
  }
  function reqEs(std, mod, rate) {
    var row = STD[std].list.filter(function (x) { return x[0] === mod && x[1] === rate; })[0];
    if (!row) return null;
    return std === 's' ? S1_ES(rate, row[2]) : row[2];
  }

  // ---------- geometry ----------
  var SATS = [
    ['7W', 'Nilesat / Eutelsat 7°W', -7], ['13E', 'Eutelsat Hot Bird 13°E', 13], ['26E', 'Arabsat / Badr 26°E', 26],
    ['10E', 'Eutelsat 10°E', 10], ['42E', 'Türksat 42°E', 42], ['52E', 'Yahsat 52.5°E', 52.5], ['c', t('مخصّص', 'Custom'), 0]
  ];
  function geo(lat, lon, slon) {
    var Re = 6378.137, R = 42164, d2r = Math.PI / 180;
    var phi = lat * d2r, dl = (slon - lon) * d2r;
    var cg = Math.cos(phi) * Math.cos(dl);
    var d = Math.sqrt(Re * Re + R * R - 2 * Re * R * cg);
    var el = Math.atan((cg - Re / R) / Math.sqrt(1 - cg * cg)) / d2r;
    var az = 180 - Math.atan2(Math.tan(dl), Math.sin(phi)) / d2r;
    if (lat < 0) az = (360 - Math.atan2(Math.tan(dl), -Math.sin(phi)) / d2r) % 360;
    return { d: d, el: el, az: az };
  }

  // ---------- UI ----------
  var st = {
    std: 's2', mod: '8PSK', rate: '3/4', ro: 0.20, pil: true, sr: 27.5, br: null, last: 'sr', guard: 5,
    sat: '7W', slon: -7, lat: 33.89, lon: 35.50, fdl: 11.7, eirp: 50, tpbw: 36, obo: 1,
    dish: 0.9, nf: 0.5, pol: 'H', decl: 5, off: 0, rain: 0, cnup: 20, cim: 20, ci: 25, impl: 0.5, mg: 1
  };
  function opt(v, cur, txt) { return '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + (txt == null ? v : txt) + '</option>'; }
  function num(k, label, step, unit) {
    return '<label><span>' + label + (unit ? ' <small>' + unit + '</small>' : '') + '</span><input type="number" data-k="' + k + '" step="' + (step || 'any') + '" value="' + st[k] + '"></label>';
  }

  root.innerHTML =
    '<div class="sc-cols">' +
    '<div class="sc-box"><h3>' + t('1. الكاريير', '1. Carrier') + '</h3><div class="sc-in">' +
    '<label><span>' + t('المعيار', 'Standard') + '</span><select data-k="std"></select></label>' +
    '<label><span>Modulation</span><select data-k="mod"></select></label>' +
    '<label><span>FEC</span><select data-k="rate"></select></label>' +
    '<label><span>Roll-off α</span><select data-k="ro"></select></label>' +
    '<label class="sc-pil"><span>Pilots</span><select data-k="pil">' + opt('1', 1, 'On') + opt('0', 1, 'Off') + '</select></label>' +
    num('sr', 'Symbol rate', 0.001, 'Msps') + num('br', t('Bit rate (اكتبو وبيحسب الـ SR)', 'Bit rate (type it to get SR)'), 0.001, 'Mbps') +
    num('guard', 'Guard band', 1, '%') +
    '</div></div>' +
    '<div class="sc-box"><h3>' + t('2. الرابط (Link budget)', '2. Link budget') + '</h3><div class="sc-in">' +
    '<label><span>' + t('القمر', 'Satellite') + '</span><select data-k="sat">' + SATS.map(function (s) { return opt(s[0], st.sat, s[1]); }).join('') + '</select></label>' +
    num('slon', t('موقع القمر', 'Orbital position'), 0.1, '°E') + num('lat', t('خط عرض المحطة', 'Site latitude'), 0.01, '°') + num('lon', t('خط طول المحطة', 'Site longitude'), 0.01, '°E') +
    '<label><span>Polarization</span><select data-k="pol">' + [['H', 'Horizontal (H)'], ['V', 'Vertical (V)'], ['L', 'Circular L'], ['R', 'Circular R']].map(function (x) { return opt(x[0], st.pol, x[1]); }).join('') + '</select></label>' +
    num('decl', t('الانحراف المغناطيسي', 'Magnetic declination'), 0.1, '°E') + num('off', t('زاوية الـ offset للصحن', 'Dish offset angle'), 0.5, '°') +
    num('fdl', 'Downlink', 0.01, 'GHz') + num('eirp', t('EIRP القمر بالمنطقة', 'Satellite EIRP at site'), 0.5, 'dBW') +
    num('tpbw', t('عرض الـ Transponder', 'Transponder BW'), 1, 'MHz') + num('obo', 'Output back-off', 0.5, 'dB') +
    num('dish', t('قطر الصحن', 'Dish diameter'), 0.05, 'm') + num('nf', 'LNB noise figure', 0.1, 'dB') +
    num('rain', t('تخميد المطر', 'Rain fade'), 0.5, 'dB') + num('cnup', 'Uplink C/N', 0.5, 'dB') +
    num('cim', 'C/IM', 0.5, 'dB') + num('ci', t('C/I (أقمار مجاورة)', 'C/I (adjacent sats)'), 0.5, 'dB') +
    num('impl', t('هامش التنفيذ', 'Implementation margin'), 0.1, 'dB') + num('mg', t('الهامش المطلوب', 'Required link margin'), 0.5, 'dB') +
    '</div></div></div>' +
    '<div class="sc-out">' +
    '<div class="sc-stats" id="sc-stats"></div>' +
    '<div class="sc-point" id="sc-point"></div>' +
    '<div class="sc-vis"><div class="sc-spec"><svg id="sc-spec" viewBox="0 0 520 230" role="img" aria-label="Spectrum"></svg></div>' +
    '<div class="sc-const"><svg id="sc-const" viewBox="-110 -110 220 220" role="img" aria-label="Constellation"></svg><small id="sc-const-l"></small></div></div>' +
    '<div class="sc-budget" id="sc-budget"></div>' +
    '<div class="sc-best" id="sc-best"></div>' +
    '<p class="calc-note">' + t('القيم تقديرية: عتبات Es/N0 مثالية (AWGN، QEF)، والـ bit rate صافي الـ TS بعد الـ BBHeader، بلا ISSY/NPD. اعتمد قيمة EIRP من خريطة الـ footprint تبع القمر.', 'Estimates: Es/N0 thresholds are ideal AWGN (QEF) values; bit rate is the net TS rate after BBHeader, without ISSY/NPD. Take the EIRP from the satellite footprint map.') + '</p>' +
    '<a class="btn btn-primary" id="sc-wa" target="_blank" rel="noopener">' + t('بدّي مساعدة بالـ link budget تبعي', 'Help me with my link budget') + '</a>' +
    '</div>';

  var $ = function (s) { return root.querySelector(s); };
  function fill() {
    var S = STD[st.std];
    var mods = []; S.list.forEach(function (x) { if (mods.indexOf(x[0]) < 0) mods.push(x[0]); });
    if (mods.indexOf(st.mod) < 0) st.mod = mods[0];
    var rates = S.list.filter(function (x) { return x[0] === st.mod; }).map(function (x) { return x[1]; }).sort(function (a, b) { return rv(a) - rv(b); });
    if (rates.indexOf(st.rate) < 0) st.rate = rates[Math.floor(rates.length / 2)];
    if (S.ro.indexOf(+st.ro) < 0) st.ro = S.ro[S.ro.length - 1];
    $('[data-k=std]').innerHTML = Object.keys(STD).map(function (k) { return opt(k, st.std, STD[k].n); }).join('');
    $('[data-k=mod]').innerHTML = mods.map(function (m) { return opt(m, st.mod); }).join('');
    $('[data-k=rate]').innerHTML = rates.map(function (r) { return opt(r, st.rate); }).join('');
    $('[data-k=ro]').innerHTML = S.ro.map(function (r) { return opt(r, st.ro, r.toFixed(2)); }).join('');
    $('[data-k=pil]').value = st.pil ? '1' : '0';
    $('.sc-pil').style.display = st.std === 's' ? 'none' : '';
  }

  var used = false;
  root.addEventListener('input', function (e) {
    var k = e.target.dataset.k; if (!k) return;
    var v = e.target.value;
    if (k === 'std' || k === 'mod' || k === 'rate' || k === 'sat' || k === 'pol') st[k] = v;
    else if (k === 'pil') st.pil = v === '1';
    else st[k] = v === '' ? 0 : +v;
    if (k === 'sr') st.last = 'sr';
    if (k === 'br') st.last = 'br';
    if (k === 'sat') { var s = SATS.filter(function (x) { return x[0] === v; })[0]; if (s && s[0] !== 'c') st.slon = s[2]; }
    if (k === 'slon') st.sat = 'c';
    if (k === 'std' || k === 'mod' || k === 'sat' || k === 'slon') fill();
    calc(k);
    if (!used) { used = true; if (typeof track === 'function') track('satcalc_used', { field: k }); }
  });

  function budget(sr, alloc, esReq) {
    var g = geo(st.lat, st.lon, st.slon);
    var lam = 0.299792458 / st.fdl;
    var G = 10 * log10(0.65 * Math.pow(Math.PI * st.dish / lam, 2));
    var tLnb = 290 * (db2(st.nf) - 1);
    var tSky = 30 + 275 * (1 - Math.pow(10, -st.rain / 10));
    var tSys = tSky + tLnb;
    var gt = G - 10 * log10(tSys);
    var fspl = 92.45 + 20 * log10(g.d) + 20 * log10(st.fdl);
    var share = Math.min(0, 10 * log10(alloc / Math.max(st.tpbw, 0.001)));
    var eirpC = st.eirp - st.obo + share;
    var losses = 0.3 + 0.3 + st.rain; // atmosphere + pointing + rain
    var cn0 = eirpC - fspl - losses + gt + 228.6;
    var cnDown = cn0 - 10 * log10(sr * 1e6);
    var parts = [cnDown, st.cnup, st.cim, st.ci];
    var tot = -10 * log10(parts.reduce(function (s, x) { return s + Math.pow(10, -x / 10); }, 0));
    return { g: g, G: G, tSys: tSys, gt: gt, fspl: fspl, eirpC: eirpC, share: share, cn0: cn0, cnDown: cnDown, tot: tot, margin: tot - esReq - st.impl };
  }

  function calc(from) {
    var e = eff(st.std, st.mod, st.rate, st.pil);
    if (st.last === 'br' && from === 'br') st.sr = st.br / e; else st.br = st.sr * e;
    var sr = Math.max(st.sr, 0.001);
    if (from !== 'sr') $('[data-k=sr]').value = +sr.toFixed(4);
    if (from !== 'br') $('[data-k=br]').value = +st.br.toFixed(4);
    $('[data-k=slon]').value = st.slon;
    $('[data-k=sat]').value = st.sat;
    var occ = sr * (1 + +st.ro), alloc = occ * (1 + st.guard / 100);
    var req = reqEs(st.std, st.mod, st.rate);
    var B = budget(sr, alloc, req);
    var ok = B.margin >= st.mg;
    var stat = function (lab, val, cls) { return '<div class="calc-stat' + (cls ? ' ' + cls : '') + '"><span>' + lab + '</span><b>' + val + '</b></div>'; };
    $('#sc-stats').innerHTML =
      stat('Bit rate', f(st.br, 3) + ' Mbps', 'hl') + stat('Symbol rate', f(sr, 3) + ' Msps') +
      stat(t('عرض الحزمة المشغول', 'Occupied BW'), f(occ, 3) + ' MHz') + stat(t('الحزمة المحجوزة (مع guard)', 'Allocated BW (with guard)'), f(alloc, 3) + ' MHz') +
      stat(t('الكفاءة الطيفية', 'Spectral efficiency'), f(st.br / alloc, 3) + ' bit/s/Hz') + stat(t('بت لكل رمز', 'Bits per symbol'), f(e, 4)) +
      stat(t('Es/N0 المطلوب', 'Required Es/N0'), f(req, 2) + ' dB') + stat(t('Es/N0 المتوفّر', 'Available Es/N0'), f(B.tot, 2) + ' dB') +
      stat(t('هامش الرابط', 'Link margin'), (B.margin >= 0 ? '+' : '') + f(B.margin, 2) + ' dB', ok ? 'ok' : B.margin >= 0 ? 'warn' : 'bad');
    var row = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; };
    $('#sc-budget').innerHTML = '<details' + (window.innerWidth > 900 ? ' open' : '') + '><summary>' + t('تفاصيل الـ link budget', 'Link budget details') + '</summary><table>' +
      row(t('المسافة للقمر', 'Slant range'), f(B.g.d, 0) + ' km') +
      row(t('زاوية الارتفاع / الاتجاه', 'Elevation / azimuth'), f(B.g.el, 1) + '° / ' + f(B.g.az, 1) + '°' + (B.g.el < 5 ? ' ⚠' : '')) +
      row('Free-space loss', f(B.fspl, 2) + ' dB') +
      row(t('EIRP الكاريير', 'Carrier EIRP'), f(B.eirpC, 2) + ' dBW <small>(' + f(st.eirp, 1) + ' − OBO ' + f(st.obo, 1) + (B.share < 0 ? ' − ' + f(-B.share, 2) + ' BW share' : '') + ')</small>') +
      row(t('كسب الصحن', 'Antenna gain'), f(B.G, 2) + ' dBi') +
      row(t('حرارة النظام / G/T', 'System temp / G/T'), f(B.tSys, 0) + ' K / ' + f(B.gt, 2) + ' dB/K') +
      row('C/N0 downlink', f(B.cn0, 2) + ' dBHz') +
      row('Es/N0 downlink', f(B.cnDown, 2) + ' dB') +
      row(t('Es/N0 الكلّي (مع uplink و C/IM و C/I)', 'Total Es/N0 (with uplink, C/IM, C/I)'), '<b>' + f(B.tot, 2) + ' dB</b>') +
      '</table></details>';
    // best modcod for same symbol rate
    var best = null;
    STD[st.std].list.forEach(function (x) {
      var r = reqEs(st.std, x[0], x[1]);
      var mg = B.tot - r - st.impl;
      var br = sr * eff(st.std, x[0], x[1], st.pil);
      if (mg >= st.mg && (!best || br > best.br)) best = { mod: x[0], rate: x[1], br: br, mg: mg };
    });
    $('#sc-best').innerHTML = best ?
      '<span>' + t('أفضل MODCOD لهالرابط على نفس الـ SR:', 'Best MODCOD for this link at the same SR:') + ' <b>' + best.mod + ' ' + best.rate + '</b> → <b>' + f(best.br, 2) + ' Mbps</b> (' + t('هامش', 'margin') + ' +' + f(best.mg, 2) + ' dB)</span>' +
      ((best.mod !== st.mod || best.rate !== st.rate) ? '<button type="button" class="btn btn-ghost btn-sm" data-best="' + best.mod + '|' + best.rate + '">' + t('طبّق', 'Apply') + '</button>' : '<b class="ok">✓</b>') :
      '<span class="bad">' + t('ولا MODCOD بيمرق بهالهامش. كبّر الصحن، خفّف الـ SR، أو زيد الـ EIRP.', 'No MODCOD closes the link with this margin. Use a bigger dish, a lower SR, or more EIRP.') + '</span>';
    pointing(B.g);
    spectrum(sr, occ, alloc, B.tot);
    constellation();
    var msg = t('مرحبا، حسبت link budget على موقعكن:', 'Hi, I used your link budget calculator:') + '\n' + STD[st.std].n + ' ' + st.mod + ' ' + st.rate + ', α ' + st.ro + ', SR ' + f(sr, 3) + ' Msps → ' + f(st.br, 2) + ' Mbps\n' +
      'Pointing: El ' + f(B.g.el, 1) + '°, Az ' + f(B.g.az, 1) + '° true, skew ' + f(skewOf(), 1) + '°\n' +
      'Sat ' + st.slon + '°E, EIRP ' + st.eirp + ' dBW, dish ' + st.dish + ' m → margin ' + f(B.margin, 2) + ' dB';
    $('#sc-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-best]'); if (!b) return;
    var p = b.dataset.best.split('|'); st.mod = p[0]; st.rate = p[1]; st.last = 'sr'; fill(); calc('mod');
  });

  // LNB skew (polarization tilt): sat east of site (north hemisphere) → counter-clockwise seen from behind the dish
  function skewOf() {
    var d2r = Math.PI / 180;
    return Math.atan(Math.sin((st.slon - st.lon) * d2r) / Math.tan(st.lat * d2r)) / d2r;
  }
  function pointing(g) {
    var box = root.querySelector('#sc-point');
    if (g.el <= 0) { box.innerHTML = '<div class="sc-pcard bad"><b>' + t('القمر تحت الأفق من هالموقع.', 'The satellite is below the horizon from this site.') + '</b></div>'; return; }
    var sk = skewOf(), circ = st.pol === 'L' || st.pol === 'R';
    var mag = ((g.az - st.decl) % 360 + 360) % 360, mount = g.el - st.off;
    var ccw = sk > 0, a = Math.abs(sk);
    var dirTxt = ccw ? t('عكس عقارب الساعة', 'counter-clockwise') : t('مع عقارب الساعة', 'clockwise');
    var card = function (title, big, sub, svg) { return '<div class="sc-pcard"><span>' + title + '</span><b>' + big + '</b><small>' + sub + '</small>' + svg + '</div>'; };
    // compass
    var R = 52, rad = function (deg) { return (deg - 90) * Math.PI / 180; };
    var px = function (deg, r) { return (r * Math.cos(rad(deg))).toFixed(1); }, py = function (deg, r) { return (r * Math.sin(rad(deg))).toFixed(1); };
    var comp = '<svg viewBox="-70 -70 140 140" class="sc-psvg"><circle r="' + R + '" class="sc-cgrid"/>' +
      ['N', 'E', 'S', 'W'].map(function (n, i) { return '<text x="' + px(i * 90, 63) + '" y="' + (+py(i * 90, 63) + 4) + '" class="sc-t c' + (n === 'N' ? ' n' : '') + '">' + n + '</text>'; }).join('') +
      '<line x1="0" y1="0" x2="' + px(st.decl, R) + '" y2="' + py(st.decl, R) + '" class="sc-mag"/>' +
      '<line x1="0" y1="0" x2="' + px(g.az, R - 4) + '" y2="' + py(g.az, R - 4) + '" class="sc-arrow"/><circle cx="' + px(g.az, R - 4) + '" cy="' + py(g.az, R - 4) + '" r="4" class="sc-pt"/></svg>';
    // elevation
    var e = Math.max(0, Math.min(90, g.el)) * Math.PI / 180;
    var elev = '<svg viewBox="-10 -75 140 90" class="sc-psvg"><line x1="0" y1="0" x2="125" y2="0" class="sc-axis"/>' +
      '<path d="M40,0 A40,40 0 0 0 ' + (40 * Math.cos(e)).toFixed(1) + ',' + (-40 * Math.sin(e)).toFixed(1) + '" class="sc-dim" fill="none"/>' +
      '<line x1="0" y1="0" x2="' + (110 * Math.cos(e)).toFixed(1) + '" y2="' + (-110 * Math.sin(e)).toFixed(1) + '" class="sc-arrow"/>' +
      '<text x="' + (52 * Math.cos(e / 2)).toFixed(1) + '" y="' + (-52 * Math.sin(e / 2) + 4).toFixed(1) + '" class="sc-t">' + f(g.el, 1) + '°</text>' +
      '<text x="120" y="12" class="sc-t e" style="fill:var(--muted)">' + t('الأفق', 'horizon') + '</text></svg>';
    // LNB seen from behind the dish (SVG rotate: positive = clockwise)
    var rot = circ ? 0 : (ccw ? -a : a), bar = st.pol === 'V' ? 'x1="0" y1="-34" x2="0" y2="34"' : 'x1="-34" y1="0" x2="34" y2="0"';
    var ex = (30 * Math.sin(rot * Math.PI / 180)).toFixed(1), ey = (-30 * Math.cos(rot * Math.PI / 180)).toFixed(1);
    var lnb = '<svg viewBox="-60 -50 120 100" class="sc-psvg"><circle r="40" class="sc-cgrid"/>' +
      '<line x1="0" y1="-46" x2="0" y2="46" class="sc-nf" style="stroke:var(--muted)"/>' +
      (circ ? '<circle r="22" class="sc-arrow" fill="none"/>' :
        '<g transform="rotate(' + rot.toFixed(1) + ')"><line ' + bar + ' class="sc-arrow"/><rect x="-10" y="-10" width="20" height="20" rx="3" class="sc-lnb"/></g>' +
        (a >= 0.5 ? '<path d="M0,-30 A30,30 0 0 ' + (ccw ? 0 : 1) + ' ' + ex + ',' + ey + '" class="sc-dim" fill="none"/>' : '')) + '</svg>';
    box.innerHTML =
      card('Azimuth', f(g.az, 1) + '° <small>' + t('حقيقي', 'true') + '</small>', t('على البوصلة: ', 'On a compass: ') + f(mag, 1) + '° (' + t('انحراف مغناطيسي ', 'declination ') + f(st.decl, 1) + '°)', comp) +
      card('Elevation', f(g.el, 1) + '°', st.off ? t('زاوية تركيب الصحن الـ offset: ', 'Offset-dish mount setting: ') + f(mount, 1) + '°' : t('للصحن الـ offset: اطرح زاوية الـ offset', 'Offset dish: subtract its offset angle'), elev) +
      card('LNB skew / polarization', circ ? t('بلا skew', 'No skew') : (sk > 0 ? '+' : '') + f(sk, 1) + '°',
        circ ? t('الاستقطاب دائري (' + st.pol + '): ما بيحتاج تدوير.', 'Circular polarization (' + st.pol + '): no rotation needed.') :
          (a < 0.5 ? t('ما بيحتاج تدوير.', 'No rotation needed.') :
          t('لفّ الـ LNB ' + f(a, 1) + '° ' + dirTxt + '، وإنت واقف ورا الصحن وعم تتطلّع صوب القمر.', 'Rotate the LNB ' + f(a, 1) + '° ' + dirTxt + ', looking from behind the dish toward the satellite.')), lnb);
  }
  function spectrum(sr, occ, alloc, cn) {
    var W = 520, H = 230, x0 = 30, x1 = 500, yb = 190, top = 30;
    var span = alloc * 1.35, sx = function (fr) { return x0 + (fr / span + 0.5) * (x1 - x0); };
    var lvl = Math.max(3, Math.min(cn, 30)), sy = function (dbv) { return yb - (dbv / 32) * (yb - top); };
    var a = +st.ro, f1 = sr * (1 - a) / 2, f2 = sr * (1 + a) / 2, pts = [];
    for (var i = 0; i <= 160; i++) {
      var fr = -span / 2 + span * i / 160, af = Math.abs(fr), h;
      if (af <= f1) h = 1; else if (af >= f2) h = 0; else h = 0.5 * (1 + Math.cos(Math.PI / (a * sr) * (af - f1)));
      var p = h * h * db2(lvl) + 1, dv = 10 * log10(p);
      pts.push(sx(fr).toFixed(1) + ',' + sy(dv).toFixed(1));
    }
    var s = '<rect x="' + sx(-alloc / 2) + '" y="' + top + '" width="' + (sx(alloc / 2) - sx(-alloc / 2)) + '" height="' + (yb - top) + '" class="sc-alloc"/>' +
      '<rect x="' + sx(-occ / 2) + '" y="' + top + '" width="' + (sx(occ / 2) - sx(-occ / 2)) + '" height="' + (yb - top) + '" class="sc-occ"/>' +
      '<line x1="' + x0 + '" y1="' + yb + '" x2="' + x1 + '" y2="' + yb + '" class="sc-axis"/>' +
      '<line x1="' + x0 + '" y1="' + sy(0) + '" x2="' + x1 + '" y2="' + sy(0) + '" class="sc-nf"/>' +
      '<polygon points="' + sx(-span / 2) + ',' + sy(0) + ' ' + pts.join(' ') + ' ' + sx(span / 2) + ',' + sy(0) + '" class="sc-fill"/>' +
      '<polyline points="' + pts.join(' ') + '" class="sc-line"/>' +
      '<text x="' + sx(0) + '" y="' + (sy(lvl) - 8) + '" class="sc-t c">C/N ' + f(cn, 1) + ' dB</text>' +
      '<text x="' + (x1 - 2) + '" y="' + (sy(0) - 5) + '" class="sc-t e">noise floor</text>' +
      dim(sx(-sr / 2), sx(sr / 2), yb + 12, 'SR ' + f(sr, 2)) +
      dim(sx(-occ / 2), sx(occ / 2), yb + 26, t('مشغول ', 'Occupied ') + f(occ, 2) + ' MHz') +
      dim(sx(-alloc / 2), sx(alloc / 2), 16, t('محجوز ', 'Allocated ') + f(alloc, 2) + ' MHz');
    root.querySelector('#sc-spec').innerHTML = s;
  }
  function dim(a, b, y, txt) {
    return '<line x1="' + a + '" y1="' + y + '" x2="' + b + '" y2="' + y + '" class="sc-dim"/><line x1="' + a + '" y1="' + (y - 4) + '" x2="' + a + '" y2="' + (y + 4) + '" class="sc-dim"/><line x1="' + b + '" y1="' + (y - 4) + '" x2="' + b + '" y2="' + (y + 4) + '" class="sc-dim"/>' +
      '<text x="' + ((a + b) / 2) + '" y="' + (y - 4) + '" class="sc-t c">' + txt + '</text>';
  }
  function constellation() {
    var rings = { QPSK: [[4, 1, 45]], '8PSK': [[8, 1, 22.5]], '16APSK': [[4, .37, 45], [12, 1, 15]], '32APSK': [[4, .23, 45], [12, .6, 15], [16, 1, 0]], '64APSK': [[4, .17, 45], [12, .4, 15], [20, .7, 9], [28, 1, 0]] }[st.mod];
    var s = '<circle r="100" class="sc-cgrid"/><line x1="-105" x2="105" class="sc-cgrid"/><line y1="-105" y2="105" class="sc-cgrid"/>';
    rings.forEach(function (rg) {
      for (var i = 0; i < rg[0]; i++) { var a = (rg[2] + i * 360 / rg[0]) * Math.PI / 180; s += '<circle cx="' + (95 * rg[1] * Math.cos(a)).toFixed(1) + '" cy="' + (-95 * rg[1] * Math.sin(a)).toFixed(1) + '" r="' + (st.mod === '64APSK' ? 3 : 4.5) + '" class="sc-pt"/>'; }
    });
    root.querySelector('#sc-const').innerHTML = s;
    root.querySelector('#sc-const-l').textContent = st.mod + ' · ' + BPS[st.mod] + ' bits/symbol';
  }

  fill(); calc('init');
})();
