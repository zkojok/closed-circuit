// Live smart house demo (Home Assistant page): Lebanon-style power scenarios played out on a floor plan.
(function () {
  var root = document.getElementById('smart-house');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var WA = '96170368646';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var L = EN ? {
    rooms: { liv: 'Living room', kit: 'Kitchen', b1: 'Bedroom', b2: 'Kids room', bath: 'Bath', ut: 'Power room', roof: 'Solar roof' },
    grid: 'Grid', inv: 'Inverter', bat: 'Battery',
    src: 'Power source', soc: 'Battery', pv: 'Solar', load: 'Home load',
    s: { grid: 'Grid', bat: 'Battery', pv: 'Solar' },
    did: 'What Home Assistant did', pick: 'Pick a scenario to watch the house react.',
    code: 'Show the automation (YAML)', hide: 'Hide the code',
    wa: 'I want this in my home', msg: 'Hi, I tried the smart house demo on closedcircuiteng.com. I want these in my home: ',
    now: 'now', replay: 'Play again',
    ctaT: 'Want this in your home?', ctaP: 'Send me the scenarios you tried and I will tell you what your home needs, on WhatsApp.', ctaB: 'Send on WhatsApp'
  } : {
    rooms: { liv: 'الصالون', kit: 'المطبخ', b1: 'غرفة النوم', b2: 'غرفة الولاد', bath: 'الحمّام', ut: 'غرفة الطاقة', roof: 'السطح الشمسي' },
    grid: 'الدولة', inv: 'إنفرتر', bat: 'بطارية',
    src: 'مصدر الكهربا', soc: 'البطارية', pv: 'الشمس', load: 'استهلاك البيت',
    s: { grid: 'الدولة', bat: 'البطارية', pv: 'الشمس' },
    did: 'شو عمل Home Assistant', pick: 'اختار سيناريو وشوف البيت كيف بيتصرّف لحالو.',
    code: 'شوف الـ automation (YAML)', hide: 'خبّي الكود',
    wa: 'بدّي هيك ببيتي', msg: 'مرحبا، جرّبت البيت الذكي على closedcircuiteng.com. بدّي هالسيناريوهات ببيتي: ',
    now: 'هلّق', replay: 'عيد',
    ctaT: 'بدّك هيك ببيتك؟', ctaP: 'ابعتلي السيناريوهات اللي جرّبتها، وبقلّك شو بيلزم بيتك، على واتساب.', ctaB: 'ابعت على واتساب'
  };

  // Devices: id -> [x, y, type, watts]
  var DEV = {
    l_liv: [170, 150, 'light', 10], l_kit: [450, 150, 'light', 10], l_b1: [95, 345, 'light', 10],
    l_b2: [300, 320, 'light', 10], l_bath: [445, 320, 'light', 10],
    ac_liv: [270, 100, 'ac', 900], ac_b1: [165, 280, 'ac', 900],
    heater: [445, 380, 'heater', 2000], washer: [540, 215, 'washer', 500], fridge: [360, 215, 'fridge', 60],
    router: [250, 225, 'router', 15], cam1: [300, 232, 'cam', 8], cam2: [603, 232, 'cam', 8],
    lock: [20, 200, 'lock', 0], valve: [405, 212, 'valve', 0], leak: [470, 212, 'leak', 0]
  };

  var BASE = {
    time: '18:00', grid: true, soc: 78, pv: 0, lockOn: false, valveOpen: true, leak: false,
    on: { l_liv: 1, l_kit: 1, fridge: 1, router: 1, ac_liv: 1 }
  };

  // Scenarios: name, start state, steps [log, change, notification?], YAML
  var SC = [
    {
      id: 'outage', icon: '⚡',
      name: EN ? 'Grid cut' : 'قطعت الدولة',
      start: { time: '19:40', grid: true, pv: 0, soc: 78, on: { l_liv: 1, l_kit: 1, l_b1: 1, fridge: 1, router: 1, ac_liv: 1, heater: 1, washer: 1 } },
      steps: [
        [EN ? 'Grid went off. The inverter switched to battery in under 10 ms.' : 'قطعت الدولة. الإنفرتر حوّل عالبطارية بأقل من 10 ms.', { grid: false }],
        [EN ? 'Turned off the water heater and washing machine (heavy loads).' : 'طفّى السخّان والغسالة (أحمال تقيلة).', { off: ['heater', 'washer'] }],
        [EN ? 'Fridge, router and lights stay on.' : 'البراد والراوتر واللمبات ضلّو شغّالين.', {}],
        [EN ? 'Sent you a notification.' : 'بعتلك إشعار عالتلفون.', {}, EN ? ['⚡ Grid off', 'On battery 78%. Lasts until about 03:00.'] : ['⚡ قطعت الدولة', 'عالبطارية 78%. بتكفّي لحدّ 3 الصبح تقريباً.']]
      ],
      yaml: 'alias: "Grid off: protect the battery"\ntriggers:\n  - trigger: state\n    entity_id: binary_sensor.grid_power\n    to: "off"\nactions:\n  - action: switch.turn_off\n    target:\n      entity_id:\n        - switch.water_heater\n        - switch.washing_machine\n  - action: notify.mobile_app_phone\n    data:\n      title: "⚡ Grid off"\n      message: >-\n        On battery {{ states(\'sensor.battery_soc\') }}%.\n        Lasts until about {{ states(\'sensor.battery_runtime_end\') }}.'
    },
    {
      id: 'surplus', icon: '☀️',
      name: EN ? 'Noon solar surplus' : 'فائض شمس الضهر',
      start: { time: '12:30', grid: false, pv: 4200, soc: 97, on: { fridge: 1, router: 1 } },
      steps: [
        [EN ? 'Battery is full and 4 kW of sun has nowhere to go.' : 'البطارية مليانة و4 kW شمس عم يروحو عالفاضي.', {}],
        [EN ? 'Started the water heater on free solar.' : 'شغّل السخّان عالشمس ببلاش.', { on: ['heater'] }],
        [EN ? 'Started the washing machine.' : 'شغّل الغسالة.', { on: ['washer'] }],
        [EN ? 'Pre-cooled the living room before you get home.' : 'برّد الصالون قبل ما توصل عالبيت.', { on: ['ac_liv'] }, EN ? ['☀️ Free solar', 'Heater and washer started. Battery stays at 97%.'] : ['☀️ شمس ببلاش', 'شغّلت السخّان والغسالة. البطارية باقية 97%.']]
      ],
      yaml: 'alias: "Solar surplus: use it, don\'t waste it"\ntriggers:\n  - trigger: numeric_state\n    entity_id: sensor.solar_power\n    above: 2500\n    for: "00:05:00"\nconditions:\n  - condition: numeric_state\n    entity_id: sensor.battery_soc\n    above: 95\nactions:\n  - action: switch.turn_on\n    target:\n      entity_id:\n        - switch.water_heater\n        - switch.washing_machine\n  - action: climate.set_temperature\n    target:\n      entity_id: climate.living_room_ac\n    data:\n      hvac_mode: cool\n      temperature: 23'
    },
    {
      id: 'away', icon: '🚪',
      name: EN ? 'You left home' : 'طلعت من البيت',
      start: { time: '08:15', grid: true, pv: 900, soc: 70, lockOn: false, on: { l_liv: 1, l_kit: 1, l_b1: 1, l_bath: 1, ac_liv: 1, ac_b1: 1, fridge: 1, router: 1 } },
      steps: [
        [EN ? 'Your phone left the home zone.' : 'تلفونك طلع من محيط البيت.', {}],
        [EN ? 'Turned off every light.' : 'طفّى كل اللمبات.', { off: ['l_liv', 'l_kit', 'l_b1', 'l_bath', 'l_b2'] }],
        [EN ? 'Turned off both ACs you forgot on.' : 'طفّى المكيّفين اللي نسيتهن.', { off: ['ac_liv', 'ac_b1'] }],
        [EN ? 'Locked the door and turned the cameras on.' : 'سكّر الباب وشغّل الكاميرات.', { lockOn: true, on: ['cam1', 'cam2'] }, EN ? ['🚪 You left', 'Lights and AC off, door locked, cameras on.'] : ['🚪 طلعت من البيت', 'طفّيت الضو والمكيّفات، سكّرت الباب وشغّلت الكاميرات.']]
      ],
      yaml: 'alias: "Everyone left: shut the house"\ntriggers:\n  - trigger: state\n    entity_id: zone.home\n    to: "0"\nactions:\n  - action: light.turn_off\n    target:\n      entity_id: all\n  - action: climate.turn_off\n    target:\n      entity_id: all\n  - action: lock.lock\n    target:\n      entity_id: lock.front_door\n  - action: switch.turn_on\n    target:\n      entity_id:\n        - switch.camera_front\n        - switch.camera_back\n  - action: notify.mobile_app_phone\n    data:\n      message: "🚪 House secured"'
    },
    {
      id: 'night', icon: '🌙',
      name: EN ? 'Bedtime' : 'وقت النوم',
      start: { time: '23:30', grid: false, pv: 0, soc: 64, lockOn: false, on: { l_liv: 1, l_kit: 1, l_b1: 1, l_b2: 1, l_bath: 1, ac_liv: 1, fridge: 1, router: 1 } },
      steps: [
        [EN ? 'It\'s 23:30 and the TV went off.' : 'صارت 11:30 وانطفى التلفزيون.', {}],
        [EN ? 'Turned off the living room, kitchen and bath lights.' : 'طفّى ضو الصالون والمطبخ والحمّام.', { off: ['l_liv', 'l_kit', 'l_bath', 'l_b2'] }],
        [EN ? 'Moved the AC to the bedroom on night mode.' : 'نقل التكييف لغرفة النوم على وضع الليل.', { off: ['ac_liv'], on: ['ac_b1'] }],
        [EN ? 'Locked the front door.' : 'سكّر الباب.', { lockOn: true, dim: ['l_b1'] }, EN ? ['🌙 Good night', 'Doors locked. Battery 64%, enough until sunrise.'] : ['🌙 تصبح على خير', 'الباب مسكّر. البطارية 64%، بتكفّي لحدّ ما تطلع الشمس.']]
      ],
      yaml: 'alias: "Bedtime"\ntriggers:\n  - trigger: time\n    at: "23:30:00"\nactions:\n  - action: light.turn_off\n    target:\n      area_id: [living_room, kitchen, bathroom, kids_room]\n  - action: light.turn_on\n    target:\n      entity_id: light.bedroom\n    data:\n      brightness_pct: 15\n  - action: climate.set_preset_mode\n    target:\n      entity_id: climate.bedroom_ac\n    data:\n      preset_mode: sleep\n  - action: lock.lock\n    target:\n      entity_id: lock.front_door'
    },
    {
      id: 'leak', icon: '💧',
      name: EN ? 'Water leak' : 'تسريب مي',
      start: { time: '14:05', grid: true, pv: 2600, soc: 90, valveOpen: true, leak: false, on: { fridge: 1, router: 1, washer: 1 } },
      steps: [
        [EN ? 'The leak sensor under the kitchen sink got wet.' : 'حسّاس المي تحت مجلى المطبخ تبلّل.', { leak: true }],
        [EN ? 'Closed the main water valve within 2 seconds.' : 'سكّر محبس المي الرئيسي خلال ثانيتين.', { valveOpen: false }],
        [EN ? 'Stopped the washing machine.' : 'وقّف الغسالة.', { off: ['washer'] }],
        [EN ? 'Sent an urgent alert to the whole family.' : 'بعت تنبيه عاجل لكل العيلة.', {}, EN ? ['💧 Water leak!', 'Kitchen sink. Main valve closed.'] : ['💧 تسريب مي!', 'تحت مجلى المطبخ. سكّرت المحبس الرئيسي.']]
      ],
      yaml: 'alias: "Leak: close the main valve"\ntriggers:\n  - trigger: state\n    entity_id: binary_sensor.kitchen_leak\n    to: "on"\nactions:\n  - action: valve.close_valve\n    target:\n      entity_id: valve.water_main\n  - action: switch.turn_off\n    target:\n      entity_id: switch.washing_machine\n  - action: notify.family\n    data:\n      title: "💧 Water leak!"\n      message: "Kitchen sink. Main valve closed."\n      data:\n        push:\n          interruption-level: critical'
    }
  ];

  // ---------- markup ----------
  root.innerHTML =
    '<div class="sh-btns" role="group">' + SC.map(function (s) {
      return '<button type="button" data-sc="' + s.id + '"><span>' + s.icon + '</span>' + s.name + '</button>';
    }).join('') + '</div>' +
    '<div class="sh-main">' +
    '<div class="sh-house"><svg id="sh-svg" viewBox="0 0 640 420" role="img" aria-label="' + (EN ? 'Smart house floor plan' : 'مخطط البيت الذكي') + '"></svg>' +
    '<div class="sh-stats">' + ['src', 'soc', 'pv', 'load'].map(function (k) {
      return '<div><small>' + L[k] + '</small><b id="sh-' + k + '"></b></div>';
    }).join('') + '</div></div>' +
    '<div class="sh-side"><div class="sh-phone"><div class="sh-bar"><span id="sh-time"></span><span>Home Assistant</span></div><div id="sh-notes"></div></div>' +
    '<div class="sh-log"><h4>' + L.did + '</h4><ol id="sh-log"><li class="muted">' + L.pick + '</li></ol></div>' +
    '<div class="sh-cta" id="sh-cta" hidden><b>' + L.ctaT + '</b><p>' + L.ctaP + '</p><a class="btn btn-primary btn-sm" id="sh-cta-wa" target="_blank" rel="noopener">' + L.ctaB + '</a></div></div>' +
    '</div>' +
    '<div class="sh-foot"><button type="button" class="btn btn-ghost btn-sm" id="sh-code-btn" disabled>' + L.code + '</button>' +
    '<a class="btn btn-primary" id="sh-wa" target="_blank" rel="noopener">' + L.wa + '</a></div>' +
    '<pre class="sh-code" id="sh-code" hidden><code></code></pre>';

  function $(id) { return document.getElementById(id); }
  function el(tag, a, txt) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; }

  // ---------- static floor plan ----------
  var svg = $('sh-svg');
  var rooms = [['roof', 20, 10, 600, 50], ['liv', 20, 75, 300, 175], ['kit', 320, 75, 300, 175], ['b1', 20, 250, 190, 160], ['b2', 210, 250, 180, 160], ['bath', 390, 250, 110, 160], ['ut', 500, 250, 120, 160]];
  rooms.forEach(function (r) {
    svg.appendChild(el('rect', { x: r[1], y: r[2], width: r[3], height: r[4], 'class': 'sh-room' + (r[0] === 'roof' ? ' roof' : '') }));
    svg.appendChild(el('text', { x: r[1] + 10, y: r[2] + 20, 'class': 'sh-rl' }, L.rooms[r[0]]));
  });
  for (var i = 0; i < 7; i++) svg.appendChild(el('rect', { x: 170 + i * 62, y: 20, width: 56, height: 30, rx: 3, 'class': 'sh-panel' }));

  // energy flows
  var FLOW = {
    pv: 'M560,50 L560,282', grid: 'M617,300 L594,300', bat: 'M560,318 L560,350', home: 'M528,300 H510 V250 H40'
  };
  Object.keys(FLOW).forEach(function (k) { svg.appendChild(el('path', { d: FLOW[k], id: 'sh-f-' + k, 'class': 'sh-flow' })); });
  svg.appendChild(el('rect', { x: 528, y: 282, width: 64, height: 36, rx: 6, 'class': 'sh-inv' }));
  svg.appendChild(el('text', { x: 560, y: 305, 'class': 'sh-dl' }, L.inv));
  svg.appendChild(el('rect', { x: 532, y: 352, width: 56, height: 46, rx: 6, 'class': 'sh-batbox' }));
  svg.appendChild(el('rect', { x: 536, y: 356, width: 48, height: 38, rx: 3, id: 'sh-batfill', 'class': 'sh-batfill' }));
  svg.appendChild(el('text', { x: 560, y: 380, id: 'sh-battxt', 'class': 'sh-dl strong' }, ''));
  // grid pole marker
  svg.appendChild(el('circle', { cx: 626, cy: 300, r: 8, id: 'sh-gridpt', 'class': 'sh-gridpt' }));
  svg.appendChild(el('text', { x: 610, y: 330, 'class': 'sh-dl small' }, L.grid));

  // devices
  var ICON = {
    light: function (g) { g.appendChild(el('circle', { r: 26, 'class': 'glow' })); g.appendChild(el('circle', { r: 8, 'class': 'core' })); },
    ac: function (g) { g.appendChild(el('rect', { x: -22, y: -8, width: 44, height: 16, rx: 4, 'class': 'core' })); g.appendChild(el('path', { d: 'M-14,14 q4,6 0,12 M0,14 q4,6 0,12 M14,14 q4,6 0,12', 'class': 'wind' })); },
    heater: function (g) { g.appendChild(el('rect', { x: -12, y: -18, width: 24, height: 36, rx: 10, 'class': 'core' })); g.appendChild(el('path', { d: 'M-6,-26 q4,-6 0,-12 M6,-26 q4,-6 0,-12', 'class': 'wind' })); },
    washer: function (g) { g.appendChild(el('rect', { x: -16, y: -16, width: 32, height: 32, rx: 5, 'class': 'core' })); g.appendChild(el('circle', { r: 9, 'class': 'drum' })); },
    fridge: function (g) { g.appendChild(el('rect', { x: -12, y: -20, width: 24, height: 40, rx: 4, 'class': 'core' })); },
    router: function (g) { g.appendChild(el('rect', { x: -14, y: -6, width: 28, height: 12, rx: 3, 'class': 'core' })); g.appendChild(el('path', { d: 'M-8,-10 L-8,-20 M8,-10 L8,-20', 'class': 'wind' })); },
    cam: function (g) { g.appendChild(el('rect', { x: -10, y: -6, width: 20, height: 12, rx: 3, 'class': 'core' })); g.appendChild(el('circle', { cx: 13, r: 3, 'class': 'rec' })); },
    lock: function (g) { g.appendChild(el('rect', { x: -9, y: -4, width: 18, height: 16, rx: 3, 'class': 'core' })); g.appendChild(el('path', { d: 'M-6,-4 v-6 a6,6 0 0 1 12,0 v6', 'class': 'shackle' })); },
    valve: function (g) { g.appendChild(el('circle', { r: 10, 'class': 'core' })); g.appendChild(el('path', { d: 'M-7,0 L7,0', 'class': 'handle' })); },
    leak: function (g) { g.appendChild(el('path', { d: 'M0,-14 C7,-4 10,2 10,6 A10,10 0 0 1 -10,6 C-10,2 -7,-4 0,-14 z', 'class': 'core' })); }
  };
  Object.keys(DEV).forEach(function (id) {
    var d = DEV[id];
    var g = el('g', { id: 'sh-d-' + id, 'class': 'sh-dev ' + d[2], transform: 'translate(' + d[0] + ',' + d[1] + ')' });
    ICON[d[2]](g);
    svg.appendChild(g);
  });

  // ---------- state ----------
  var st, timers = [], current = null, tried = [];
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function setState(s) {
    st = clone(BASE);
    Object.keys(s).forEach(function (k) { st[k] = clone(s[k]); });
    st.dim = {};
  }

  function render() {
    var load = 0;
    Object.keys(DEV).forEach(function (id) {
      var on = !!st.on[id];
      var g = $('sh-d-' + id);
      g.classList.toggle('on', on);
      g.classList.toggle('dim', !!st.dim[id]);
      if (on) load += DEV[id][3] * (st.dim[id] ? 0.3 : 1);
    });
    $('sh-d-lock').classList.toggle('on', !!st.lockOn);
    $('sh-d-valve').classList.toggle('on', !!st.valveOpen);
    $('sh-d-valve').classList.toggle('closed', !st.valveOpen);
    $('sh-d-leak').classList.toggle('on', !!st.leak);

    var charging = st.grid || st.pv > load;
    var src = st.grid ? 'grid' : st.pv >= load ? 'pv' : 'bat';
    $('sh-f-pv').setAttribute('class', 'sh-flow' + (st.pv > 0 ? ' on pv' : ''));
    $('sh-f-grid').setAttribute('class', 'sh-flow' + (st.grid ? ' on grid' : ''));
    $('sh-f-bat').setAttribute('class', 'sh-flow on bat' + (charging ? '' : ' rev'));
    $('sh-f-home').setAttribute('class', 'sh-flow on home');
    $('sh-gridpt').setAttribute('class', 'sh-gridpt' + (st.grid ? ' on' : ''));
    var h = Math.max(2, 38 * st.soc / 100);
    var fill = $('sh-batfill');
    fill.setAttribute('y', 356 + 38 - h); fill.setAttribute('height', h);
    fill.setAttribute('class', 'sh-batfill' + (st.soc < 30 ? ' low' : ''));
    $('sh-battxt').textContent = st.soc + '%';

    $('sh-src').textContent = L.s[src];
    $('sh-soc').textContent = st.soc + '%';
    $('sh-pv').textContent = (st.pv / 1000).toFixed(1) + ' kW';
    $('sh-load').textContent = (load / 1000).toFixed(load < 1000 ? 2 : 1) + ' kW';
    $('sh-time').textContent = st.time;
  }

  function apply(ch) {
    Object.keys(ch).forEach(function (k) {
      if (k === 'on') ch.on.forEach(function (id) { st.on[id] = 1; delete st.dim[id]; });
      else if (k === 'off') ch.off.forEach(function (id) { delete st.on[id]; });
      else if (k === 'dim') ch.dim.forEach(function (id) { st.on[id] = 1; st.dim[id] = 1; });
      else st[k] = ch[k];
    });
  }

  function note(n) {
    var box = $('sh-notes');
    var d = document.createElement('div');
    d.className = 'sh-note';
    d.innerHTML = '<div><b></b><small>' + L.now + '</small></div><p></p>';
    d.querySelector('b').textContent = n[0];
    d.querySelector('p').textContent = n[1];
    box.insertBefore(d, box.firstChild);
    while (box.children.length > 3) box.removeChild(box.lastChild);
  }

  function run(id) {
    var sc = SC.filter(function (s) { return s.id === id; })[0];
    if (!sc) return;
    timers.forEach(clearTimeout); timers = [];
    current = sc;
    if (tried.indexOf(sc.name) < 0) tried.push(sc.name);
    root.querySelectorAll('[data-sc]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-sc') === id); });
    setState(sc.start);
    render();
    var log = $('sh-log');
    log.innerHTML = '';
    $('sh-notes').innerHTML = '';
    var gap = reduce ? 0 : 1100;
    sc.steps.forEach(function (step, i) {
      timers.push(setTimeout(function () {
        apply(step[1]);
        render();
        var li = document.createElement('li');
        li.textContent = step[0];
        log.appendChild(li);
        if (step[2]) note(step[2]);
        if (i === sc.steps.length - 1) $('sh-cta').hidden = false;
      }, gap * (i + 1) - (reduce ? 0 : 500)));
    });
    var codeBtn = $('sh-code-btn');
    codeBtn.disabled = false;
    $('sh-code').querySelector('code').textContent = sc.yaml;
    $('sh-wa').href = $('sh-cta-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(L.msg + tried.join(EN ? ', ' : '، '));
    if (typeof gtag === 'function') gtag('event', 'smarthome_demo', { scenario: id, page: location.pathname });
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sc]');
    if (b) { run(b.getAttribute('data-sc')); return; }
    if (e.target.closest('#sh-code-btn')) {
      var pre = $('sh-code');
      pre.hidden = !pre.hidden;
      $('sh-code-btn').textContent = pre.hidden ? L.code : L.hide;
    }
  });

  setState(BASE);
  render();
  $('sh-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(L.msg);
})();
