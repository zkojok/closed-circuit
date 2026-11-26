// Electrical design request form. The client fills it; the result is emailed (Formspree)
// with a design code that the Closed Circuit SLD tool turns into a full single-line diagram.
(function () {
  var root = document.getElementById('elec-req');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var WA = '96170368646';
  var ACTION = 'https://formspree.io/f/myeejbol';
  var t = function (ar, en) { return EN ? en : ar; };

  function opts(list, def) {
    return list.map(function (o) {
      return '<option value="' + o[0] + '"' + (String(o[0]) === String(def) ? ' selected' : '') + '>' + t(o[1], o[2]) + '</option>';
    }).join('');
  }
  function sel(name, label, list, def) {
    return '<div class="field"><label for="rq-' + name + '">' + label + '</label><select id="rq-' + name + '" name="' + name + '">' + opts(list, def) + '</select></div>';
  }
  function num(name, label, def, min, max, step) {
    return '<div class="field"><label for="rq-' + name + '">' + label + '</label><input id="rq-' + name + '" name="' + name + '" type="number" inputmode="decimal" value="' + def + '" min="' + (min || 0) + '"' + (max ? ' max="' + max + '"' : '') + (step ? ' step="' + step + '"' : '') + '></div>';
  }
  function txt(name, label, req, type) {
    return '<div class="field"><label for="rq-' + name + '">' + label + '</label><input id="rq-' + name + '" name="' + name + '" type="' + (type || 'text') + '"' + (req ? ' required' : '') + '></div>';
  }
  function chk(name, val, label, on) {
    return '<label class="rq-chk"><input type="checkbox" name="' + name + '" value="' + val + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';
  }
  var AMPS = [[0, 'ما بعرف', "I don't know"], [5, '5 A', '5 A'], [10, '10 A', '10 A'], [15, '15 A', '15 A'], [20, '20 A', '20 A'], [25, '25 A', '25 A'], [30, '30 A', '30 A'], [40, '40 A', '40 A'], [63, '63 A', '63 A']];

  root.innerHTML =
    '<form class="req-form" novalidate>' +
    '<fieldset><legend>' + t('1. معلوماتك', '1. Your details') + '</legend><div class="rq-grid">' +
    txt('n', t('الاسم', 'Name'), true) + txt('p', t('رقم الهاتف (واتساب)', 'Phone (WhatsApp)'), true, 'tel') + txt('a', t('المنطقة', 'Area / town'), false) +
    sel('t', t('نوع المبنى', 'Building type'), [['apt', 'شقة', 'Apartment'], ['house', 'بيت', 'House'], ['villa', 'فيلا', 'Villa']], 'apt') +
    num('f', t('عدد الطوابق', 'Number of floors'), 1, 1, 4) +
    num('d', t('المسافة من العدّاد للوحة (متر تقريباً)', 'Meter to main panel (m, approx.)'), 10, 1, 300) +
    '</div></fieldset>' +

    '<fieldset><legend>' + t('2. مصادر الكهربا', '2. Power sources') + '</legend><div class="rq-grid">' +
    sel('gp', t('كهربا الدولة', 'Grid supply'), [[0, 'ما بعرف', "I don't know"], [1, 'فاز واحد', 'Single-phase'], [3, 'تلات فاز', 'Three-phase']], 0) +
    sel('ga', t('قدّيش أمبير عدّاد الدولة', 'Grid breaker (amps)'), AMPS, 0) +
    sel('gt', t('الموتير', 'Generator'), [['none', 'ما في', 'None'], ['sub', 'اشتراك', 'Subscription'], ['own', 'موتير خاص', 'Own generator']], 'sub') +
    sel('gs', t('أمبير الاشتراك', 'Subscription amps'), AMPS.slice(1), 10) +
    num('gk', t('قوّة الموتير الخاص (kVA)', 'Own generator size (kVA)'), 0, 0, 500) +
    sel('st', t('طاقة شمسية', 'Solar'), [['none', 'لا', 'No'], ['have', 'عندي نظام', 'I already have one'], ['want', 'بدّي ركّب', 'I want one']], 'want') +
    num('ik', t('قوّة الإنفرتر (kW) إذا بتعرفها', 'Inverter size (kW), if known'), 0, 0, 50, 0.5) +
    num('bk', t('البطارية (kWh) إذا بتعرفها', 'Battery (kWh), if known'), 0, 0, 100, 0.1) +
    '</div></fieldset>' +

    '<fieldset><legend>' + t('3. الغرف', '3. Rooms') + '</legend><div class="rq-grid">' +
    num('bd', t('غرف نوم', 'Bedrooms'), 3, 0, 15) + num('ba', t('حمّامات', 'Bathrooms'), 2, 0, 10) +
    num('lv', t('صالونات / غرف جلوس', 'Living / sitting rooms'), 1, 0, 6) + num('kt', t('مطابخ', 'Kitchens'), 1, 0, 3) +
    sel('rf', t('سطح أو ترّاس', 'Roof or terrace'), [[0, 'لا', 'No'], [1, 'نعم', 'Yes']], 0) +
    sel('gr', t('حديقة / إنارة خارجية', 'Garden / outdoor lights'), [[0, 'لا', 'No'], [1, 'نعم', 'Yes']], 0) +
    '</div></fieldset>' +

    '<fieldset><legend>' + t('4. الأجهزة الكبيرة', '4. Large appliances') + '</legend><div class="rq-grid">' +
    num('a1', t('مكيّفات صغار (9 – 12 ألف BTU)', 'Small ACs (9–12k BTU)'), 2, 0, 20) +
    num('a2', t('مكيّفات كبار (18 – 24 ألف BTU)', 'Large ACs (18–24k BTU)'), 1, 0, 20) +
    num('wh', t('سخّانات مي كهربا', 'Electric water heaters'), 1, 0, 6) +
    sel('pu', t('مضخّة مي', 'Water pump'), [[0, 'ما في', 'None'], [0.5, '0.5 حصان', '0.5 hp'], [1, '1 حصان', '1 hp'], [1.5, '1.5 حصان', '1.5 hp'], [2, '2 حصان', '2 hp']], 1) +
    '</div><div class="rq-checks">' +
    chk('ap', 'ov', t('فرن كهربا', 'Electric oven'), true) + chk('ap', 'wm', t('غسالة تياب', 'Washing machine'), true) +
    chk('ap', 'dr', t('نشّافة', 'Dryer'), false) + chk('ap', 'dw', t('جلّاية', 'Dishwasher'), false) + chk('ap', 'ev', t('شاحن سيارة كهربا', 'EV charger'), false) +
    '</div></fieldset>' +

    '<fieldset><legend>' + t('5. شو لازم يضلّ شغّال وقت تنقطع الكهربا؟', '5. What must keep running during outages?') + '</legend><div class="rq-checks">' +
    chk('es', 'light', t('الضو', 'Lighting'), true) + chk('es', 'fridge', t('البرّاد', 'Fridge'), true) + chk('es', 'net', t('الإنترنت والكاميرات', 'Internet & cameras'), true) +
    chk('es', 'sock', t('البريزات (تلفزيون، شحن، لابتوب)', 'Sockets (TV, chargers, laptop)'), true) + chk('es', 'pump', t('مضخّة المي', 'Water pump'), false) + chk('es', 'ac', t('مكيّف واحد', 'One AC'), false) +
    '</div></fieldset>' +

    '<div class="field"><label for="rq-m">' + t('ملاحظات (اختياري)', 'Notes (optional)') + '</label><textarea id="rq-m" name="m" placeholder="' + t('مثلاً: بدّي لوحة لكل طابق، أو عندي مصعد…', 'e.g. a panel per floor, an elevator…') + '"></textarea></div>' +
    '<button type="submit" class="btn btn-primary">' + t('ابعت الطلب', 'Send request') + '</button>' +
    '<div class="form-status" role="status"></div>' +
    '</form>';

  var form = root.querySelector('form');
  var status = form.querySelector('.form-status');

  function collect() {
    var fd = new FormData(form), q = {};
    ['n', 'p', 'a', 't', 'gt', 'st', 'm'].forEach(function (k) { q[k] = (fd.get(k) || '').toString().trim(); });
    ['f', 'd', 'gp', 'ga', 'gs', 'gk', 'ik', 'bk', 'bd', 'ba', 'lv', 'kt', 'rf', 'gr', 'a1', 'a2', 'wh', 'pu'].forEach(function (k) { q[k] = +fd.get(k) || 0; });
    q.ap = fd.getAll('ap'); q.es = fd.getAll('es');
    q.v = 1; q.lang = EN ? 'en' : 'ar'; q.date = new Date().toISOString().slice(0, 10);
    return q;
  }
  function encode(q) { return 'CC1-' + btoa(unescape(encodeURIComponent(JSON.stringify(q)))); }
  function summary(q) {
    var L = [];
    L.push('Building: ' + q.t + ', ' + q.f + ' floor(s), meter→panel ' + q.d + ' m');
    L.push('Grid: ' + (q.gp ? q.gp + '-phase' : 'phase ?') + ', ' + (q.ga ? q.ga + ' A' : 'amps ?'));
    L.push('Generator: ' + q.gt + (q.gt === 'sub' ? ' ' + q.gs + ' A' : q.gt === 'own' ? ' ' + q.gk + ' kVA' : ''));
    L.push('Solar: ' + q.st + (q.ik ? ', inverter ' + q.ik + ' kW' : '') + (q.bk ? ', battery ' + q.bk + ' kWh' : ''));
    L.push('Rooms: ' + q.bd + ' bed, ' + q.ba + ' bath, ' + q.lv + ' living, ' + q.kt + ' kitchen' + (q.rf ? ', roof' : '') + (q.gr ? ', garden' : ''));
    L.push('ACs: ' + q.a1 + ' small, ' + q.a2 + ' large · heaters ' + q.wh + ' · pump ' + q.pu + ' hp · ' + q.ap.join(', '));
    L.push('Backup: ' + q.es.join(', '));
    if (q.m) L.push('Notes: ' + q.m);
    return L.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = collect();
    if (!q.n || !q.p) {
      status.className = 'form-status err';
      status.textContent = t('عبّي الاسم ورقم الهاتف لو سمحت.', 'Please fill in your name and phone.');
      return;
    }
    var code = encode(q), sum = summary(q);
    var waMsg = t('مرحبا، بعتت طلب مخطط كهربا من الموقع.', 'Hi, I sent an electrical design request from the website.') + '\n' + q.n + '\n\n' + code;
    var waLink = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waMsg);
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    var fd = new FormData();
    fd.append('name', q.n); fd.append('phone', q.p); fd.append('area', q.a);
    fd.append('service', 'Electrical design request (SLD)');
    fd.append('message', sum); fd.append('design_code', code);
    fd.append('_subject', 'Electrical design request — ' + q.n);
    fetch(ACTION, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      if (typeof track === 'function') track('generate_lead', { service: 'electrical_request', page: location.pathname });
      status.className = 'form-status ok';
      status.innerHTML = t('وصلنا طلبك. منحضّر المخطط ومنرجع نحكيك عالواتساب. ', 'Request received. We will prepare the diagram and contact you on WhatsApp. ') +
        '<a href="' + waLink + '" target="_blank" rel="noopener">' + t('ابعتلنا عالواتساب كمان', 'Also send it on WhatsApp') + '</a>';
      form.querySelectorAll('fieldset,.field').forEach(function (el) { el.style.display = 'none'; });
      btn.style.display = 'none';
    }).catch(function () {
      btn.disabled = false;
      status.className = 'form-status err';
      status.innerHTML = t('ما زبط الإرسال. ', 'Sending failed. ') + '<a href="' + waLink + '" target="_blank" rel="noopener">' + t('ابعت الطلب عالواتساب', 'Send the request on WhatsApp') + '</a>';
    });
  });
})();
