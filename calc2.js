// Engineering calculators page: generator payback, cable & voltage drop, generator kVA,
// CCTV / video storage, satellite dish size (RX / TX). All estimates, shown with their assumptions.
(function () {
  var root = document.getElementById('eng-calcs');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var WA = '96170368646';
  var t = function (ar, en) { return EN ? en : ar; };
  var f = function (x, d) { return isFinite(x) ? Number(x).toLocaleString('en', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) : '—'; };
  var log10 = function (x) { return Math.log(x) / Math.LN10; };
  var db = function (x) { return 10 * log10(x); };
  var undb = function (x) { return Math.pow(10, x / 10); };
  var tr = function (n, p) { if (typeof gtag === 'function') gtag('event', n, p || {}); };

  // ---------------------------------------------------------------- tools
  var BRK = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800];
  var SEC = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
  // IEC 60364-5-52, copper PVC 70 °C, 30 °C ambient: [2 loaded, 3 loaded]
  var IZ = {
    C: [[19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299, 344, 392, 461], [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403]],
    B: [[17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269, 309, 353, 415], [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239, 275, 314, 370]],
    D: [[22, 29, 37, 46, 60, 77, 100, 119, 142, 177, 212, 241, 273, 308, 353], [18, 24, 30, 38, 50, 64, 82, 98, 116, 143, 169, 192, 217, 243, 280]]
  };
  var GEN = [5.5, 7.5, 10, 15, 20, 30, 40, 50, 60, 80, 100, 125, 150, 200, 250, 300, 400, 500, 650, 800, 1000];
  var DISH = [0.6, 0.75, 0.9, 1.2, 1.5, 1.8, 2.4, 3.0, 3.7, 4.5, 5.6, 6.3, 7.3, 9.0];
  var BANDS = {
    C: { n: 'C-band', dl: 3.95, ul: 6.175, rain: 0.3 },
    Ku: { n: 'Ku-band', dl: 11.7, ul: 14.25, rain: 2 },
    Ka: { n: 'Ka-band', dl: 19.95, ul: 29.75, rain: 6 }
  };
  // CCTV per-camera bitrate, H.264 @ 25 fps (Mbps); H.265 ≈ 55 %
  var CAM = { '2': 4, '4': 6, '5': 7, '8': 12 };
  // Broadcast recording formats (Mbps, video + audio)
  var BCF = { xdcam: ['XDCAM HD422 50', 50], avci: ['AVC-Intra 100', 100], dnx: ['DNxHD 145 / DNxHR SQ', 145], prlt: ['ProRes 422 LT (1080)', 102], pr: ['ProRes 422 (1080)', 147], prhq: ['ProRes 422 HQ (1080)', 220], uhd: ['ProRes 422 HQ (2160p25)', 707], proxy: ['H.264 proxy', 10] };
  var APP = [
    ['ac', t('مكيّف 12000 BTU', 'AC 12,000 BTU'), 1100, 3],
    ['ac2', t('مكيّف 24000 BTU', 'AC 24,000 BTU'), 2200, 3],
    ['fr', t('برّاد / فريزر', 'Fridge / freezer'), 200, 4],
    ['pump', t('مضخة مي 1 حصان', 'Water pump 1 HP'), 750, 3],
    ['wh', t('سخّان مي', 'Water heater'), 2000, 1],
    ['wm', t('غسالة', 'Washing machine'), 500, 2],
    ['oven', t('فرن كهربا / ميكروويف', 'Electric oven / microwave'), 1500, 1],
    ['lights', t('إنارة (لكل 10 لمبات)', 'Lighting (per 10 lamps)'), 150, 1],
    ['tv', t('تلفزيون / كمبيوتر', 'TV / computer'), 150, 1],
    ['lift', t('مصعد 7.5 kW', 'Elevator 7.5 kW'), 7500, 2.5]
  ];

  var TOOLS = [
    {
      id: 'payback', icon: '⛽', name: t('توفير المولّد', 'Generator savings'),
      lead: t('قديش بتوفّر إذا ركّبت طاقة شمسية بدل اشتراك المولّد، وبعد كم شهر بيرجعلك حقّ النظام.', 'How much you save by replacing generator power with solar, and how many months until the system pays for itself.'),
      fields: [
        ['bill', t('فاتورة المولّد بالشهر', 'Monthly generator bill'), 'n', 120, '$', 5],
        ['kwh', t('سعر الكيلو عالمولّد', 'Generator price per kWh'), 'n', 0.45, '$', 0.01],
        ['cover', t('قديش بتغطّي الطاقة الشمسية', 'Share covered by solar'), 'n', 80, '%', 5],
        ['cost', t('كلفة النظام الشمسي', 'Solar system cost'), 'n', 3500, '$', 100],
        ['maint', t('صيانة بالسنة', 'Maintenance per year'), 'n', 60, '$', 10],
        ['infl', t('زيادة سعر المولّد بالسنة', 'Generator price rise per year'), 'n', 5, '%', 1]
      ],
      calc: function (s) {
        var monthly = s.bill * s.cover / 100 - s.maint / 12;
        var cum = -s.cost, m = 0, pts = [], month = 0, payM = null;
        for (var y = 1; y <= 10; y++) {
          var save = (s.bill * Math.pow(1 + s.infl / 100, y - 1) * s.cover / 100) * 12 - s.maint;
          for (var k = 0; k < 12; k++) { month++; cum += save / 12; if (payM === null && cum >= 0) payM = month; }
          pts.push(cum);
        }
        var kwhM = s.bill / Math.max(s.kwh, 0.01) * s.cover / 100;
        var stats = [
          [t('توفير بالشهر', 'Saving per month'), '$' + f(monthly), t('بعد الصيانة', 'after maintenance')],
          [t('بيرجع حقّو بعد', 'Pays back in'), payM ? f(payM) + t(' شهر', ' months') : t('أكتر من 10 سنين', 'over 10 years'), payM ? '≈ ' + f(payM / 12, 1) + t(' سنة', ' years') : ''],
          [t('ربح صافي بـ 10 سنين', 'Net gain over 10 years'), '$' + f(pts[9]), t('بعد ما ترجع كلفة النظام', 'after paying back the system')],
          [t('مازوت ما بينحرق', 'Diesel not burned'), f(kwhM * 0.3 * 12) + t(' ليتر بالسنة', ' L per year'), f(kwhM * 0.3 * 12 * 2.68 / 1000, 1) + t(' طن CO₂ أقل', ' t CO₂ less')]
        ];
        // cumulative bar chart
        var max = Math.max.apply(null, pts.map(Math.abs).concat([s.cost])), W = 300, H = 120, z = H * (max / (max * 2));
        var bars = pts.map(function (v, i) {
          var h = Math.abs(v) / max * (H / 2 - 6), x = 12 + i * 28;
          return '<rect x="' + x + '" y="' + (v >= 0 ? H / 2 - h : H / 2) + '" width="18" height="' + h.toFixed(1) + '" rx="3" fill="' + (v >= 0 ? 'var(--green)' : '#F87171') + '"/><text x="' + (x + 9) + '" y="' + (H + 12) + '" class="cx-ax">' + (i + 1) + '</text>';
        }).join('');
        var svg = '<svg viewBox="0 0 300 140" class="cx-chart" role="img" aria-label="' + t('الربح التراكمي', 'Cumulative gain') + '"><line x1="6" x2="294" y1="' + H / 2 + '" y2="' + H / 2 + '" class="cx-zero"/>' + bars + '</svg>' +
          '<p class="cx-cap">' + t('الربح التراكمي سنة بسنة (أحمر = لسّا ما رجع حقّ النظام)', 'Cumulative gain year by year (red = not paid back yet)') + '</p>';
        return { stats: stats, html: svg, note: t('تقدير: بيفترض إنو الطاقة الشمسية بتغطّي النسبة اللي اخترتها من استهلاكك عالمولّد. البطاريات بتحتاج تبديل بعد 8 لـ 10 سنين.', 'Estimate: assumes solar covers the share you chose of your generator use. Batteries need replacing after 8 to 10 years.'), wa: 'Generator bill $' + s.bill + '/month, system $' + s.cost + ' → payback ' + (payM || '>120') + ' months' };
      }
    },
    {
      id: 'cable', icon: '🔌', name: t('حجم الكابل وهبوط الجهد', 'Cable size & voltage drop'),
      lead: t('مساحة الكابل، ونسبة هبوط الجهد، والقاطع المناسب، حسب التيار والطول وطريقة التمديد.', 'Cable size, voltage drop and breaker rating from the current, length and installation method.'),
      fields: [
        ['sys', t('النظام', 'System'), 's', '1', [['1', t('أحادي 230V', 'Single-phase 230 V')], ['3', t('ثلاثي 400V', 'Three-phase 400 V')], ['dc', 'DC']]],
        ['vdc', t('جهد الـ DC', 'DC voltage'), 'n', 48, 'V', 1, function (s) { return s.sys === 'dc'; }],
        ['by', t('بدّي دخّل', 'I will enter'), 's', 'a', [['a', t('التيار (A)', 'Current (A)')], ['p', t('القدرة (kW)', 'Power (kW)')]]],
        ['amp', t('التيار', 'Current'), 'n', 32, 'A', 1, function (s) { return s.by === 'a'; }],
        ['kw', t('القدرة', 'Power'), 'n', 7, 'kW', 0.1, function (s) { return s.by === 'p'; }],
        ['pf', 'cos φ', 'n', 0.9, '', 0.05, function (s) { return s.sys !== 'dc'; }],
        ['len', t('طول الكابل (ذهاب)', 'Cable length (one way)'), 'n', 40, 'm', 1],
        ['mat', t('المعدن', 'Conductor'), 's', 'cu', [['cu', t('نحاس', 'Copper')], ['al', t('ألمنيوم', 'Aluminium')]]],
        ['meth', t('طريقة التمديد', 'Installation'), 's', 'B', [['B', t('بأنبوب / قسطل', 'In conduit')], ['C', t('عالحيط / بالهوا', 'Clipped / in air')], ['D', t('مدفون بالأرض', 'Buried')]]],
        ['vd', t('أقصى هبوط جهد', 'Max voltage drop'), 's', '3', [['3', t('3% (إنارة)', '3% (lighting)')], ['5', t('5% (باقي الأحمال)', '5% (other loads)')], ['1.5', t('1.5% (كابل رئيسي / DC)', '1.5% (feeder / DC)')]]]
      ],
      calc: function (s) {
        var V = s.sys === '3' ? 400 : s.sys === 'dc' ? s.vdc : 230;
        var pf = s.sys === 'dc' ? 1 : s.pf;
        var I = s.by === 'a' ? s.amp : s.sys === '3' ? s.kw * 1000 / (Math.sqrt(3) * V * pf) : s.kw * 1000 / (V * pf);
        var In = BRK.filter(function (b) { return b >= I; })[0] || 800;
        var rho = s.mat === 'cu' ? 0.0225 : 0.036, x = 0.00008, sin = Math.sqrt(1 - pf * pf);
        var loaded = s.sys === '3' ? 1 : 0, k = s.mat === 'cu' ? 1 : 0.78;
        var vdOf = function (S) {
          var r = rho / S;
          var u = s.sys === 'dc' ? 2 * s.len * I * r : (s.sys === '3' ? Math.sqrt(3) : 2) * s.len * I * (r * pf + x * sin);
          return u / V * 100;
        };
        var pick = null, why = '';
        for (var i = 0; i < SEC.length; i++) {
          var S = SEC[i];
          if (s.mat === 'al' && S < 16) continue;
          var iz = IZ[s.meth][loaded][i] * k;
          if (iz >= In && vdOf(S) <= +s.vd) { pick = { S: S, iz: iz, vd: vdOf(S) }; break; }
        }
        if (!pick) return { stats: [[t('النتيجة', 'Result'), t('أكبر من 240 mm²', 'Above 240 mm²'), t('قسّم عكابلين بالتوازي أو قصّر المسافة', 'Use parallel cables or shorten the run')]], warn: true };
        var thermal = SEC.filter(function (S, i) { return (s.mat === 'cu' || S >= 16) && IZ[s.meth][loaded][i] * k >= In; })[0];
        why = thermal < pick.S ? t('هبوط الجهد هو اللي كبّر الكابل (للتيار لحالو بيكفي ' + thermal + ' mm²)', 'Voltage drop sized this cable (current alone needs ' + thermal + ' mm²)') : t('التيار هو اللي حدّد المقاس', 'Current-carrying capacity sets the size');
        return {
          stats: [
            [t('مساحة الكابل', 'Cable size'), pick.S + ' mm²', (s.mat === 'cu' ? t('نحاس', 'copper') : t('ألمنيوم', 'aluminium')) + (s.sys === '3' ? ' · 4C/5C' : s.sys === 'dc' ? ' · 2 × 1C' : ' · 3C')],
            [t('هبوط الجهد', 'Voltage drop'), f(pick.vd, 2) + ' %', f(pick.vd / 100 * V, 1) + ' V'],
            [t('القاطع', 'Breaker'), In + ' A', s.sys === 'dc' ? t('قاطع / فيوز DC', 'DC breaker / fuse') : (In <= 63 ? 'MCB' : 'MCCB')],
            [t('التيار', 'Current'), f(I, 1) + ' A', 'Iz = ' + f(pick.iz, 0) + ' A']
          ],
          note: why + '. ' + t('حسب IEC 60364-5-52 مبسّط، حرارة 30°C، بلا تجميع كابلات. للتصميم النهائي بدّك حساب كامل.', 'Simplified IEC 60364-5-52, 30 °C ambient, no grouping. Final design needs a full calculation.'),
          wa: 'Cable: ' + f(I, 1) + ' A, ' + s.len + ' m → ' + pick.S + ' mm² ' + s.mat + ', VD ' + f(pick.vd, 2) + '%, breaker ' + In + ' A'
        };
      }
    },
    {
      id: 'genset', icon: '⚙', name: t('حجم المولّد (kVA)', 'Generator size (kVA)'),
      lead: t('حطّ عدد الأجهزة اللي بدّك تشغّلها سوا، والحاسبة بتحسب تيار التشغيل وبتختارلك حجم المولّد.', 'Enter how many of each appliance run together; the calculator adds start-up surge and picks the generator size.'),
      fields: APP.map(function (a, i) { return [a[0], a[1] + ' <small>' + f(a[2]) + ' W</small>', 'n', [1, 0, 1, 1, 0, 1, 0, 2, 2, 0][i], t('عدد', 'qty'), 1]; }).concat([
        ['ph', t('نوع المولّد', 'Generator type'), 's', '3', [['1', t('أحادي', 'Single-phase')], ['3', t('ثلاثي', 'Three-phase')]]]
      ]),
      calc: function (s) {
        var run = 0, surge = 0, big = '';
        APP.forEach(function (a) {
          var q = Math.max(0, Math.round(s[a[0]] || 0)); run += q * a[2];
          if (q && a[3] > 1 && a[2] * (a[3] - 1) > surge) { surge = a[2] * (a[3] - 1); big = a[1]; }
        });
        var need = (run + surge) / 0.8 / 1000 * 1.25;
        var kva = GEN.filter(function (g) { return g >= need; })[0] || GEN[GEN.length - 1];
        var I = s.ph === '3' ? kva * 1000 / (Math.sqrt(3) * 400) : kva * 1000 / 230;
        return {
          stats: [
            [t('حمل التشغيل', 'Running load'), f(run / 1000, 1) + ' kW', f(run / 0.8 / 1000, 1) + ' kVA @ PF 0.8'],
            [t('ضربة التشغيل', 'Start-up surge'), '+' + f(surge / 1000, 1) + ' kW', big || '—'],
            [t('المولّد المناسب', 'Recommended generator'), f(kva, kva % 1 ? 1 : 0) + ' kVA', t('مع 25% احتياط', 'with 25% reserve')],
            [t('تيار المولّد', 'Generator current'), f(I, 0) + ' A', s.ph === '3' ? t('بكل فاز', 'per phase') : '230 V']
          ],
          note: t('المولّد بيشتغل أحسن على 60 لـ 80% من قدرته. إذا بتشغّل المكيّفات سوا، فوّتها واحد ورا التاني (soft start) لتخفّف ضربة التشغيل.', 'Generators run best at 60–80% load. Start air conditioners one after another (or use soft starters) to reduce the surge.'),
          wa: 'Generator sizing: running ' + f(run / 1000, 1) + ' kW, surge ' + f(surge / 1000, 1) + ' kW → ' + kva + ' kVA'
        };
      }
    },
    {
      id: 'storage', icon: '💾', name: t('تخزين الكاميرات والفيديو', 'CCTV & video storage'),
      lead: t('قديش هارد بدّك لتسجّل كاميرات المراقبة أو قنوات البث، وقديش عرض الشبكة.', 'How much disk space you need to record CCTV cameras or broadcast channels, and the network bandwidth.'),
      fields: [
        ['mode', t('النوع', 'Type'), 's', 'cctv', [['cctv', t('كاميرات مراقبة CCTV', 'CCTV cameras')], ['bc', t('تسجيل بث / Ingest', 'Broadcast recording / ingest')]]],
        ['n', t('عدد الكاميرات / القنوات', 'Cameras / channels'), 'n', 8, '', 1],
        ['res', t('دقة الكاميرا', 'Camera resolution'), 's', '4', [['2', '2 MP (1080p)'], ['4', '4 MP'], ['5', '5 MP'], ['8', '8 MP (4K)']], function (s) { return s.mode === 'cctv'; }],
        ['codec', 'Codec', 's', '265', [['264', 'H.264'], ['265', 'H.265']], function (s) { return s.mode === 'cctv'; }],
        ['fps', 'FPS', 'n', 15, 'fps', 1, function (s) { return s.mode === 'cctv'; }],
        ['motion', t('تسجيل عند الحركة', 'Motion recording'), 'n', 100, '%', 10, function (s) { return s.mode === 'cctv'; }],
        ['fmt', t('صيغة التسجيل', 'Recording format'), 's', 'xdcam', Object.keys(BCF).map(function (k) { return [k, BCF[k][0]]; }), function (s) { return s.mode === 'bc'; }],
        ['hrs', t('ساعات تسجيل باليوم', 'Recording hours per day'), 'n', 24, 'h', 1],
        ['days', t('مدة الحفظ', 'Retention'), 'n', 30, t('يوم', 'days'), 1],
        ['raid', 'RAID', 's', '5', [['0', t('بلا RAID', 'None')], ['1', 'RAID 1'], ['5', 'RAID 5'], ['6', 'RAID 6']]]
      ],
      calc: function (s) {
        var per = s.mode === 'cctv' ? CAM[s.res] * (s.codec === '265' ? 0.55 : 1) * (0.4 + 0.6 * Math.min(1, Math.max(1, s.fps) / 25)) : BCF[s.fmt][1];
        var duty = s.mode === 'cctv' ? s.motion / 100 : 1;
        var mbps = per * s.n;
        var tb = mbps / 8 * 3600 * s.hrs * duty * s.days / 1e6;
        var raw = tb / 0.85;
        var disks = function (size) {
          var data = Math.ceil(raw / size);
          var extra = s.raid === '1' ? data : s.raid === '5' ? 1 : s.raid === '6' ? 2 : 0;
          if (s.raid === '1') return data * 2;
          return Math.max(data + extra, s.raid === '5' ? 3 : s.raid === '6' ? 4 : 1);
        };
        var opts = [4, 8, 12, 16, 20].map(function (z) { return disks(z) + ' × ' + z + ' TB'; }).join(' · ');
        return {
          stats: [
            [t('Bitrate لكل كاميرا/قناة', 'Bitrate per camera/channel'), f(per, 1) + ' Mbps', s.mode === 'cctv' ? (s.codec === '265' ? 'H.265' : 'H.264') + ' @ ' + s.fps + ' fps' : BCF[s.fmt][0]],
            [t('عرض الشبكة الكلّي', 'Total network bandwidth'), f(mbps, 0) + ' Mbps', mbps > 700 ? t('بدّك شبكة 10G', 'needs 10G network') : mbps > 80 ? t('شبكة 1G بتكفّي', '1G network is enough') : t('شبكة 100M بتكفّي', '100M network is enough')],
            [t('التخزين الصافي', 'Net storage'), f(tb, tb < 10 ? 1 : 0) + ' TB', f(tb * 1000 / s.days, 0) + ' GB/' + t('يوم', 'day')],
            [t('الهاردات المقترحة', 'Suggested disks'), f(raw, raw < 10 ? 1 : 0) + ' TB', (s.raid === '0' ? '' : 'RAID ' + s.raid + ' · ') + t('مع 15% فراغ', 'with 15% free')]
          ],
          html: '<p class="cx-cap"><b>' + t('خيارات الهاردات: ', 'Disk options: ') + '</b><span dir="ltr">' + opts + '</span></p>',
          note: s.mode === 'cctv' ? t('أرقام تقريبية لمشهد عادي. المشاهد اللي فيها حركة كتير أو بالليل بتاخد bitrate أعلى. استعمل هاردات Surveillance (متل WD Purple).', 'Typical-scene estimate. Busy or night scenes use a higher bitrate. Use surveillance-rated disks (e.g. WD Purple).') : t('الأرقام للفيديو والصوت حسب الصيغة. ضيف مساحة للـ proxies والأرشيف.', 'Figures cover video and audio at the chosen format. Add space for proxies and archive.'),
          wa: s.n + (s.mode === 'cctv' ? ' cameras ' : ' channels ') + s.hrs + 'h/day, ' + s.days + ' days → ' + f(tb, 1) + ' TB net, ' + f(mbps, 0) + ' Mbps'
        };
      }
    },
    {
      id: 'dish', icon: '📡', name: t('حجم صحن الاستقبال أو الإرسال', 'Dish size (receive / transmit)'),
      lead: t('للاستقبال: أصغر صحن بيعطيك الإشارة مع هامش للشتي. للإرسال: الـ EIRP المطلوب وقديش واط BUC بدّك لكل حجم صحن.', 'Receive: the smallest dish that gives you the signal with rain margin. Transmit: the uplink EIRP needed and the BUC power for each dish size.'),
      fields: [
        ['dir', t('الاتجاه', 'Direction'), 's', 'rx', [['rx', t('استقبال (Downlink)', 'Receive (downlink)')], ['tx', t('إرسال (Uplink)', 'Transmit (uplink)')]]],
        ['band', t('الحزمة', 'Band'), 's', 'Ku', [['C', 'C-band'], ['Ku', 'Ku-band'], ['Ka', 'Ka-band']]],
        ['lat', t('خط عرض المحطة', 'Site latitude'), 'n', 33.89, '°N', 0.01],
        ['lon', t('خط طول المحطة', 'Site longitude'), 'n', 35.5, '°E', 0.01],
        ['slon', t('موقع القمر', 'Satellite position'), 'n', 26, '°E', 0.1],
        ['sr', 'Symbol rate', 'n', 27.5, 'Msps', 0.5],
        ['cn', t('C/N المطلوب', 'Required C/N'), 'n', 8, 'dB', 0.1],
        ['eirp', t('EIRP القمر عندك', 'Satellite EIRP at your site'), 'n', 50, 'dBW', 0.5, function (s) { return s.dir === 'rx'; }],
        ['nf', t('حرارة ضجيج الـ LNB', 'LNB noise temperature'), 'n', 50, 'K', 5, function (s) { return s.dir === 'rx'; }],
        ['gt', t('G/T القمر', 'Satellite G/T'), 'n', 2, 'dB/K', 0.5, function (s) { return s.dir === 'tx'; }],
        ['upm', t('هامش الـ uplink فوق C/N', 'Uplink margin over C/N'), 'n', 10, 'dB', 1, function (s) { return s.dir === 'tx'; }],
        ['rain', t('هامش الشتي', 'Rain margin'), 'n', 0, 'dB', 0.5]
      ],
      calc: function (s) {
        var B = BANDS[s.band], d2r = Math.PI / 180, Re = 6378.137, Rs = 42164;
        var dl = (s.lon - s.slon) * d2r, la = s.lat * d2r, cg = Math.cos(la) * Math.cos(dl);
        var dist = Math.sqrt(Re * Re + Rs * Rs - 2 * Re * Rs * cg);
        var el = Math.atan((cg - Re / Rs) / Math.sqrt(1 - cg * cg)) / d2r;
        if (el <= 0) return { stats: [[t('النتيجة', 'Result'), t('القمر تحت الأفق', 'Below horizon'), '']], warn: true };
        var rain = s.rain || B.rain, bw = db(s.sr * 1e6);
        var gain = function (D, fG) { return db(0.65 * Math.pow(Math.PI * D * fG / 0.299792458, 2)); };
        var beam = function (D, fG) { return 70 * 0.299792458 / fG / D; };
        if (s.dir === 'rx') {
          var fsl = 92.45 + 20 * log10(dist) + 20 * log10(B.dl);
          var tsys = 25 + 290 * (1 - undb(-rain)) + s.nf + 10; // sky + rain noise + LNB + feed/ground
          var gtReq = s.cn + 1 - s.eirp + fsl + rain - 228.6 + bw + 0.5;
          var gReq = gtReq + db(tsys);
          var Dreq = 0.299792458 / (Math.PI * B.dl) * Math.sqrt(undb(gReq) / 0.65);
          var Dpick = DISH.filter(function (d) { return d >= Dreq; })[0];
          var Dm = Dpick || Dreq;
          var cnGot = s.eirp - fsl - rain - 0.5 + gain(Dm, B.dl) - db(tsys) + 228.6 - bw;
          return {
            stats: [
              [t('أصغر صحن', 'Minimum dish'), (Dpick ? f(Dpick, 2) : '> 9') + ' m', t('المطلوب حسابياً ', 'calculated ') + f(Dreq, 2) + ' m'],
              ['G/T ' + t('المطلوب', 'required'), f(gtReq, 1) + ' dB/K', 'Tsys ≈ ' + f(tsys, 0) + ' K'],
              ['C/N ' + t('مع هالصحن', 'with this dish'), f(cnGot, 1) + ' dB', t('بالشتي (', 'in rain (') + f(rain, 1) + ' dB)'],
              [t('الزوايا', 'Pointing'), 'El ' + f(el, 1) + '°', t('عرض الشعاع ', 'beamwidth ') + f(beam(Dm, B.dl), 2) + '°']
            ],
            note: t('اسأل مشغّل القمر عن قيمة EIRP بمنطقتك (خريطة الـ footprint). الهامش 1 dB فوق الـ C/N المطلوب مع هامش الشتي. بالـ C-band الصحن الصغير بيلتقط تداخل من الأقمار المجاورة، فما تنزل تحت 1.8 لـ 2.4 m.', 'Get the EIRP for your area from the satellite footprint map. Includes 1 dB above required C/N plus the rain margin. In C-band, small dishes pick up adjacent-satellite interference: stay at 1.8–2.4 m or larger.'),
            wa: 'RX dish ' + s.band + ', sat ' + s.slon + '°E, EIRP ' + s.eirp + ' dBW, SR ' + s.sr + ' → ' + (Dpick || '>9') + ' m'
          };
        }
        var fsu = 92.45 + 20 * log10(dist) + 20 * log10(B.ul);
        var cnUp = s.cn + s.upm;
        var eirp = cnUp + fsu + rain + 0.5 - s.gt - 228.6 + bw;
        var rows = DISH.filter(function (d) { return d >= (s.band === 'C' ? 1.8 : s.band === 'Ku' ? 1.2 : 0.75) && d <= 9; }).slice(0, 6).map(function (D) {
          var G = gain(D, B.ul), pw = undb(eirp - G + 1);
          return '<tr><td>' + f(D, 2) + ' m</td><td>' + f(G, 1) + ' dBi</td><td>' + f(pw, pw < 10 ? 1 : 0) + ' W</td><td>' + f(Math.max(pw * 2, 1), 0) + ' W</td><td>' + f(beam(D, B.ul), 2) + '°</td></tr>';
        }).join('');
        return {
          stats: [
            ['EIRP ' + t('المطلوب', 'required'), f(eirp, 1) + ' dBW', 'C/N up ' + f(cnUp, 1) + ' dB'],
            [t('مسافة القمر', 'Slant range'), f(dist, 0) + ' km', 'El ' + f(el, 1) + '°'],
            [t('خسارة المسار', 'Path loss'), f(fsu, 1) + ' dB', f(B.ul, 2) + ' GHz'],
            [t('هامش الشتي', 'Rain margin'), f(rain, 1) + ' dB', B.n]
          ],
          html: '<div class="cx-table"><table><tr><th>' + t('الصحن', 'Dish') + '</th><th>' + t('الكسب', 'Gain') + '</th><th>' + t('قدرة عالصحن', 'Power at feed') + '</th><th>BUC ' + t('(3 dB backoff)', '(3 dB backoff)') + '</th><th>' + t('عرض الشعاع', 'Beamwidth') + '</th></tr>' + rows + '</table></div>',
          note: t('قيمة EIRP النهائية بيعطيك ياها مشغّل القمر (حسب الـ transponder والـ SFD وحدود الـ off-axis). الجدول بيحسب 1 dB خسارة بين الـ BUC والصحن.', 'The final EIRP comes from the satellite operator (transponder, SFD and off-axis limits). The table allows 1 dB loss between BUC and feed.'),
          wa: 'TX uplink ' + s.band + ', sat ' + s.slon + '°E, SR ' + s.sr + ' → EIRP ' + f(eirp, 1) + ' dBW'
        };
      }
    }
  ];

  // ---------------------------------------------------------------- render
  var state = {}, cur = (location.hash || '').slice(1);
  if (!TOOLS.some(function (x) { return x.id === cur; })) cur = TOOLS[0].id;
  TOOLS.forEach(function (tl) { var s = state[tl.id] = {}; tl.fields.forEach(function (fd) { s[fd[0]] = fd[3]; }); });
  var used = {};

  root.innerHTML = '<div class="cx-tabs" role="tablist">' + TOOLS.map(function (tl) {
    return '<button type="button" role="tab" data-t="' + tl.id + '"><span>' + tl.icon + '</span>' + tl.name + '</button>';
  }).join('') + '</div><div class="cx-body"></div>';
  var body = root.querySelector('.cx-body');

  function field(fd, s) {
    var show = !fd[fd[2] === 's' ? 5 : 6] || fd[fd[2] === 's' ? 5 : 6](s);
    var lab = '<span>' + fd[1] + '</span>';
    if (fd[2] === 's') return '<label' + (show ? '' : ' hidden') + '>' + lab + '<select data-k="' + fd[0] + '">' + fd[4].map(function (o) { return '<option value="' + o[0] + '"' + (String(s[fd[0]]) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
    return '<label' + (show ? '' : ' hidden') + '>' + lab + '<div class="cx-unit"><input type="number" inputmode="decimal" step="' + fd[5] + '" data-k="' + fd[0] + '" value="' + s[fd[0]] + '"><i>' + (fd[4] || '') + '</i></div></label>';
  }
  function draw() {
    var tl = TOOLS.filter(function (x) { return x.id === cur; })[0], s = state[cur];
    root.querySelectorAll('.cx-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-t') === cur); });
    body.innerHTML = '<p class="cx-lead">' + tl.lead + '</p><div class="sc-cols"><div class="sc-box"><h3>' + t('المعطيات', 'Inputs') + '</h3><div class="sc-in">' +
      tl.fields.map(function (fd) { return field(fd, s); }).join('') + '</div></div><div class="sc-out" id="cx-out"></div></div>';
    out();
  }
  function out() {
    var tl = TOOLS.filter(function (x) { return x.id === cur; })[0], s = state[cur], r = tl.calc(s);
    var box = document.getElementById('cx-out');
    var msg = t('مرحبا، استعملت حاسبة "', 'Hi, I used the "') + tl.name + t('" على closedcircuiteng.com:\n', '" calculator on closedcircuiteng.com:\n') + (r.wa || '');
    box.innerHTML = '<div class="sc-stats">' + r.stats.map(function (x) { return '<div class="calc-stat"><span>' + x[0] + '</span><b>' + x[1] + '</b><em>' + (x[2] || '') + '</em></div>'; }).join('') + '</div>' +
      (r.html || '') + (r.note ? '<p class="calc-note">' + r.note + '</p>' : '') +
      '<a class="btn btn-primary" id="cx-wa" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '">' + t('ابعتلي النتيجة عالواتساب', 'Send me this on WhatsApp') + '</a>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.cx-tabs button'); if (!b) return;
    cur = b.getAttribute('data-t'); history.replaceState(null, '', '#' + cur); draw();
  });
  root.addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-k'); if (!k) return;
    var v = e.target.tagName === 'SELECT' ? e.target.value : parseFloat(e.target.value);
    if (e.target.tagName !== 'SELECT' && !isFinite(v)) return;
    state[cur][k] = v;
    if (!used[cur]) { used[cur] = true; tr('engcalc_used', { tool: cur }); }
    if (e.target.tagName === 'SELECT') draw(); else out();
  });
  window.addEventListener('hashchange', function () {
    var h = location.hash.slice(1);
    if (TOOLS.some(function (x) { return x.id === h; }) && h !== cur) { cur = h; draw(); }
  });
  draw();
})();
