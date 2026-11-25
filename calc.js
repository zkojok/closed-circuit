// Solar sizing calculator (energy page). Rough first estimate, not a design.
(function () {
  var root = document.getElementById('solar-calc');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var WA = '96170368646';

  // name, average W, peak W (surge), default qty, default hours/day
  var A = [
    ['لمبات LED', 'LED lights', 10, 10, 8, 6],
    ['براد', 'Fridge', 60, 300, 1, 24],
    ['تلفزيون', 'TV', 100, 100, 1, 6],
    ['راوتر إنترنت', 'Internet router', 15, 15, 1, 24],
    ['لابتوب / كمبيوتر', 'Laptop / PC', 80, 80, 1, 5],
    ['مروحة', 'Fan', 60, 60, 0, 8],
    ['مضخة مياه', 'Water pump', 750, 1500, 1, 1],
    ['غسالة', 'Washing machine', 500, 1000, 0, 1],
    ['مكيّف 12000 BTU (إنفرتر)', 'AC 12,000 BTU (inverter)', 900, 1300, 0, 6],
    ['كاتل / ميكروويف', 'Kettle / microwave', 1200, 1200, 0, 0.3],
    ['سخّان مياه كهربائي', 'Electric water heater', 2000, 2000, 0, 2]
  ];

  // Roof options for Lebanon (~34°N). Winter yield factor vs. south at 30°, frame tilt, m² of roof per panel.
  var ORI = [
    { ar: 'جنوب (أفضل خيار)', en: 'South (best)', f: 1.00, tilt: 30, m2: 4.2,
      tAr: 'وجّه الألواح عالجنوب تماماً، بميل 30°. إذا همّك الشتي أكتر، 40 لـ 45°.',
      tEn: 'Face true south at 30° tilt. If winter matters most, 40–45°.' },
    { ar: 'جنوب شرق / جنوب غرب', en: 'South-east / south-west', f: 0.92, tilt: 30, m2: 4.2,
      tAr: 'لفّ الإطار قدّ ما فيك صوب الجنوب، بميل 30°. الخسارة حوالي 8% بالشتي.',
      tEn: 'Turn the frames as close to south as you can, 30° tilt. About 8% less in winter.' },
    { ar: 'شرق / غرب (نص ونص)', en: 'East / west split', f: 0.75, tilt: 15, m2: 2.9,
      tAr: 'نص الألواح شرق ونص غرب بميل 10 لـ 15°. بياخدو مساحة أقل بس إنتاج الشتي أضعف بحوالي 25%.',
      tEn: 'Half east, half west at 10–15° tilt. Less roof space, but about 25% less in winter.' },
    { ar: 'مسطّحة عالسطح بلا إطار', en: 'Flat on the roof, no frame', f: 0.70, tilt: 0, m2: 2.9,
      tAr: 'الألواح المسطّحة بتخسر حوالي 30% بالشتي وبيتجمّع عليها غبار. إطار بميل 30° بيستاهل حقّه.',
      tEn: 'Flat panels lose about 30% in winter and collect dust. A 30° frame is worth it.' }
  ];

  var T = EN ? {
    dev: 'Appliance', qty: 'Qty', hrs: 'Hours/day',
    out: 'Hours without grid power per day', outS: 'Grid off', h: 'h',
    ori: 'Where can the panels face?', dist: 'Cable run from panels to inverter (m)',
    daily: 'Daily use', inv: 'Inverter', bat: 'Lithium battery 48V', pv: 'Solar panels',
    kwh: 'kWh', kw: 'kW', panels: 'panels',
    batNote: function (n) { return n + ' × 5 kWh modules'; },
    pvNote: function (k) { return 'about ' + k + ' kWp'; },
    inst: 'Installation & cables', orient: 'Orientation', roof: 'Roof area',
    roofV: function (a, g) { return '≈ ' + a + ' m²' + (g ? ' (leave ' + g + ' m between rows)' : ''); },
    strings: 'Panel wiring', strV: function (s, p) { return s + ' string' + (s > 1 ? 's' : '') + ' × ' + p + ' panels in series'; },
    pvCab: 'PV cable (solar DC)', batCab: 'Battery ↔ inverter cable', acCab: 'Inverter output cable (AC)',
    drop: 'drop', fuse: 'fuse', breaker: 'breaker', perStr: 'per string', short: 'up to 2 m',
    cu: 'Copper', al: 'Aluminium',
    cabNote: 'Cable sizes are an estimate. Check them against your inverter manual, and have a qualified electrician confirm before installing.',
    alNote: 'Aluminium is cheaper and lighter but needs a bigger size. Use bimetal Al-Cu lugs with anti-oxidant paste, torque the bolts to spec and re-check them after a few weeks. Aluminium under 16 mm² is not used.',
    heater: 'An electric water heater is the most expensive load to run on solar. A solar water heater usually costs less than the extra batteries it would need.',
    ac: 'Air conditioning roughly doubles the system. Tell us how many hours you really run it.',
    note: 'A first estimate for a home in Lebanon (designed for winter sun, about 4 hours a day, LiFePO4 batteries). Exact sizing needs your real appliances and bills.',
    wa: 'Send me my result on WhatsApp',
    msg: 'Hi, I used the solar calculator on closedcircuiteng.com.\n'
  } : {
    dev: 'الجهاز', qty: 'العدد', hrs: 'ساعات/يوم',
    out: 'كم ساعة بلا كهرباء الدولة باليوم؟', outS: 'ساعات انقطاع الدولة', h: 'ساعة',
    ori: 'لوين فيك توجّه الألواح؟', dist: 'طول الكابل من الألواح للإنفرتر (متر)',
    daily: 'الاستهلاك اليومي', inv: 'الإنفرتر', bat: 'بطارية ليثيوم 48V', pv: 'الألواح',
    kwh: 'kWh', kw: 'kW', panels: 'لوح',
    batNote: function (n) { return n + ' × بطارية 5 kWh'; },
    pvNote: function (k) { return 'حوالي ' + k + ' kWp'; },
    inst: 'التركيب والكابلات', orient: 'التوجيه', roof: 'مساحة السطح',
    roofV: function (a, g) { return '≈ ' + a + ' m²' + (g ? ' (اترك ' + g + ' m بين الصفوف)' : ''); },
    strings: 'توصيل الألواح', strV: function (s, p) { return s + ' سلسلة × ' + p + ' ألواح على التوالي'; },
    pvCab: 'كابل الألواح (DC شمسي)', batCab: 'كابل البطارية ↔ الإنفرتر', acCab: 'كابل خرج الإنفرتر (AC)',
    drop: 'هبوط', fuse: 'فيوز', breaker: 'قاطع', perStr: 'لكل سلسلة', short: 'لحدّ 2 متر',
    cu: 'نحاس', al: 'ألمنيوم',
    cabNote: 'قياسات الكابلات تقديرية. لازم تتطابق مع دليل الإنفرتر، ويتأكّد منها كهربجي مختص قبل التركيب.',
    alNote: 'الألمنيوم أرخص وأخف بس بدّو قياس أكبر. استعمل لقم بيميتال Al-Cu مع معجون ضد الأكسدة، شدّ البراغي عالعزم المطلوب ورجاع شيّك عليها بعد كم أسبوع. ما منستعمل ألمنيوم أقل من 16 mm².',
    heater: 'السخّان الكهربائي أغلى حِمل على الطاقة الشمسية. سخّان مياه شمسي بيكلّف عادةً أقل من البطاريات الإضافية اللي بيحتاجها.',
    ac: 'المكيّف تقريباً بيضاعف حجم النظام. خبّرنا كم ساعة فعلياً بتشغّله.',
    note: 'تقدير أوّلي لبيت بلبنان (محسوب على شمس الشتي، حوالي 4 ساعات باليوم، بطاريات LiFePO4). الحساب الدقيق بدّو أجهزتك وفواتيرك الحقيقية.',
    wa: 'ابعتلي النتيجة عالواتساب',
    msg: 'مرحبا، استعملت حاسبة الطاقة الشمسية على closedcircuiteng.com.\n'
  };

  var rows = A.map(function (a, i) {
    return '<div class="calc-row"><span>' + (EN ? a[1] : a[0]) + ' <small>' + a[2] + 'W</small></span>' +
      '<input type="number" min="0" max="50" step="1" value="' + a[4] + '" data-i="' + i + '" data-k="q" aria-label="' + T.qty + '">' +
      '<input type="number" min="0" max="24" step="0.5" value="' + a[5] + '" data-i="' + i + '" data-k="h" aria-label="' + T.hrs + '"></div>';
  }).join('');
  var opts = ORI.map(function (o, i) { return '<option value="' + i + '">' + (EN ? o.en : o.ar) + '</option>'; }).join('');
  var spec = function (id, label) { return '<div><dt>' + label + '</dt><dd id="' + id + '"></dd></div>'; };

  root.innerHTML =
    '<div class="calc-grid"><div class="calc-in">' +
    '<div class="calc-row calc-head"><span>' + T.dev + '</span><span>' + T.qty + '</span><span>' + T.hrs + '</span></div>' + rows +
    '<label class="calc-out"><span>' + T.out + ' <b id="c-o-v"></b></span><input type="range" id="c-o" min="0" max="24" step="1" value="20"></label>' +
    '<div class="calc-opts"><label><span>' + T.ori + '</span><select id="c-r">' + opts + '</select></label>' +
    '<label><span>' + T.dist + '</span><input type="number" id="c-l" min="1" max="100" step="1" value="15"></label></div>' +
    '</div><div class="calc-res">' +
    '<div class="calc-stat"><small>' + T.daily + '</small><b id="r-d"></b></div>' +
    '<div class="calc-stat"><small>' + T.inv + '</small><b id="r-i"></b></div>' +
    '<div class="calc-stat"><small>' + T.bat + '</small><b id="r-b"></b><em id="r-bn"></em></div>' +
    '<div class="calc-stat"><small>' + T.pv + '</small><b id="r-p"></b><em id="r-pn"></em></div>' +
    '<div class="calc-spec"><h4>' + T.inst + '</h4><dl>' +
    spec('s-o', T.orient) + spec('s-r', T.roof) + spec('s-s', T.strings) +
    spec('s-pv', T.pvCab) + spec('s-b', T.batCab) + spec('s-ac', T.acCab) +
    '</dl><p>' + T.cabNote + '</p><p>' + T.alNote + '</p></div>' +
    '<p class="calc-warn" id="r-w"></p><p class="calc-note">' + T.note + '</p>' +
    '<a class="btn btn-primary" id="r-wa" target="_blank" rel="noopener">' + T.wa + '</a>' +
    '</div></div>';

  var used = false;
  function $(id) { return document.getElementById(id); }
  function val(i, k) {
    var el = root.querySelector('input[data-i="' + i + '"][data-k="' + k + '"]');
    var v = parseFloat(el.value);
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function up(list, x) { for (var i = 0; i < list.length; i++) if (list[i] >= x) return list[i]; return list[list.length - 1]; }
  // smallest cable [mm², A] whose ampacity covers x
  function cable(table, x) { for (var i = 0; i < table.length; i++) if (table[i][1] >= x) return table[i][0]; return null; }

  // Copper ampacity, single cores in free air (battery DC) and in conduit (AC). Approximate.
  var DC_CAB = [[16, 100], [25, 130], [35, 160], [50, 200], [70, 250], [95, 300], [120, 350], [150, 400]];
  var AC_CAB = [[2.5, 24], [4, 32], [6, 41], [10, 57], [16, 76], [25, 101], [35, 125]];
  var DC_AL = [[25, 100], [35, 125], [50, 155], [70, 195], [95, 235], [120, 270], [150, 310], [185, 355], [240, 415]];
  var AC_AL = [[16, 59], [25, 78], [35, 96], [50, 116]];
  var PV_SIZES = { cu: [[4, 6, 10, 16], 0.0175], al: [[10, 16, 25, 35], 0.0282] };
  var PV = { vmp: 43, imp: 13.4, perString: 9 };   // 580W panel; 9 in series keeps cold Voc under 500V

  function calc() {
    var wh = 0, run = 0, surge = 0, lines = [];
    A.forEach(function (a, i) {
      var q = val(i, 'q'), h = Math.min(val(i, 'h'), 24);
      if (!q) return;
      wh += a[2] * q * h;
      run += a[2] * q;
      surge = Math.max(surge, (a[3] - a[2]) * Math.min(q, 1));
      if (h) lines.push((EN ? a[1] : a[0]) + ' ×' + q + ' (' + h + (EN ? 'h' : 'س') + ')');
    });
    var out = +$('c-o').value;
    $('c-o-v').textContent = out + ' ' + T.h;
    var ori = ORI[+$('c-r').value] || ORI[0];
    var L = Math.max(1, Math.min(100, parseFloat($('c-l').value) || 15));

    var kwh = wh / 1000;
    // share of the day's use that falls in grid-off hours; half of it is at night
    var off = Math.min(1, out / 24 * 1.15);
    var night = kwh * off * 0.5;
    var batKwh = night / 0.8 / 0.95;                 // 80% depth of discharge, 95% efficiency
    var mods = batKwh > 0 ? Math.max(1, Math.ceil(batKwh / 5.12)) : 0;
    var solarDay = kwh * off * 0.5 + night / 0.9;    // daytime use + recharge
    var kwp = solarDay / (4 * 0.8 * ori.f);          // 4 winter sun hours, 80% losses, orientation
    var panels = kwp > 0 ? Math.max(2, Math.ceil(kwp * 1000 / 580)) : 0;
    var invKw = run ? up([3, 5, 6, 8, 10, 12, 15], (run * 0.7 + surge) * 1.25 / 1000) : 0;

    // Strings
    var strings = panels ? Math.ceil(panels / PV.perString) : 0;
    var per = strings ? Math.ceil(panels / strings) : 0;
    // PV cable: smallest size with voltage drop ≤ 1.5% over the round trip
    function pvCable(m) {
      var size = 0, drop = 0;
      PV_SIZES[m][0].some(function (a) {
        size = a; drop = 2 * L * PV.imp * PV_SIZES[m][1] / a / (per * PV.vmp) * 100;
        return drop <= 1.5;
      });
      return size + ' mm² (' + T.drop + ' ' + (Math.round(drop * 10) / 10) + '%)';
    }
    // Battery DC: current at low battery voltage, fuse 1.25×, cable rated above the fuse
    var iBat = invKw * 1000 / (44 * 0.94);
    var bFuse = up([63, 80, 100, 125, 160, 200, 250, 315, 400, 500], iBat * 1.25);
    function batCable(tab) { var c = cable(tab, bFuse); return c ? c + ' mm²' : '2 × ' + cable(tab, bFuse / 2) + ' mm²'; }
    // AC output, single phase 230V
    var iAc = invKw * 1000 / 230;
    var acBrk = up([16, 20, 25, 32, 40, 50, 63, 80, 100], iAc * 1.25);
    var acCab = cable(AC_CAB, acBrk) || 35, acAl = cable(AC_AL, acBrk) || 70;

    var f = function (n) { return (Math.round(n * 10) / 10).toLocaleString('en'); };
    $('r-d').textContent = f(kwh) + ' ' + T.kwh;
    $('r-i').textContent = invKw + ' ' + T.kw;
    $('r-b').textContent = (mods * 5.12).toFixed(1) + ' ' + T.kwh;
    $('r-bn').textContent = mods ? T.batNote(mods) : '';
    $('r-p').textContent = panels + ' ' + T.panels + ' 580W';
    $('r-pn').textContent = T.pvNote(f(panels * 0.58));

    var gap = ori.tilt >= 30 ? 1.8 : 0;
    var vals = {
      's-o': EN ? ori.tEn : ori.tAr,
      's-r': T.roofV(Math.ceil(panels * ori.m2), gap),
      's-s': panels ? T.strV(strings, per) + ' (~' + Math.round(per * PV.vmp) + 'V)' : '-',
      's-pv': panels ? T.cu + ' ' + pvCable('cu') + ' · ' + T.al + ' ' + pvCable('al') + ' · ' + T.fuse + ' 20A ' + T.perStr : '-',
      's-b': invKw ? T.cu + ' ' + batCable(DC_CAB) + ' · ' + T.al + ' ' + batCable(DC_AL) + ' (' + T.short + ') · ' + T.fuse + ' ' + bFuse + 'A DC' : '-',
      's-ac': invKw ? T.cu + ' ' + acCab + ' mm² · ' + T.al + ' ' + acAl + ' mm² · ' + T.breaker + ' ' + acBrk + 'A' : '-'
    };
    Object.keys(vals).forEach(function (k) { $(k).textContent = vals[k]; });

    var w = [];
    if (val(10, 'q') && val(10, 'h')) w.push(T.heater);
    if (val(8, 'q') && val(8, 'h')) w.push(T.ac);
    $('r-w').textContent = w.join(' ');
    $('r-w').style.display = w.length ? 'block' : 'none';

    var text = T.msg + lines.join(EN ? ', ' : '، ') + '\n' + T.outS + ': ' + out + ' ' + T.h + '\n' +
      T.daily + ': ' + f(kwh) + ' kWh | ' + T.inv + ': ' + invKw + ' kW | ' +
      T.bat + ': ' + (mods * 5.12).toFixed(1) + ' kWh | ' + T.pv + ': ' + panels + ' × 580W\n' +
      T.orient + ': ' + (EN ? ori.en : ori.ar) + ' | ' + T.dist + ': ' + L + '\n' +
      T.pvCab + ': ' + vals['s-pv'] + '\n' + T.batCab + ': ' + vals['s-b'] + '\n' + T.acCab + ': ' + vals['s-ac'];
    $('r-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }

  root.addEventListener('input', function () {
    calc();
    if (!used && typeof gtag === 'function') { used = true; gtag('event', 'calculator_used', { page: location.pathname }); }
  });
  root.addEventListener('change', calc);
  calc();
})();
