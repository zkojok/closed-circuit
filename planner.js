// Studio Planner (broadcast page): live signal-flow diagram + SDI vs SMPTE ST 2110 sizing.
// Rough planning numbers, not a system design.
(function () {
  var root = document.getElementById('studio-planner');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var WA = '96170368646';
  var NS = 'http://www.w3.org/2000/svg';

  // ST 2110-20, 4:2:2 10-bit, active video + ~5% RTP/IP overhead (Gbps). SDI link per format.
  var FMT = {
    '1080i50': { gbps: 1.1, sdi: 'HD-SDI 1.5G', label: '1080i50' },
    '1080p50': { gbps: 2.2, sdi: '3G-SDI', label: '1080p50' },
    '2160p50': { gbps: 8.7, sdi: '12G-SDI', label: '2160p50 (4K)' }
  };

  // NDI bandwidth per stream (Gbps): High Bandwidth, HX2 (long-GOP H.264/HEVC), HX3 (low-latency H.264/HEVC)
  var NDI = {
    hb: { name: 'NDI HB', r: { '1080i50': 0.1, '1080p50': 0.15, '2160p50': 0.3 } },
    hx2: { name: 'NDI HX2', r: { '1080i50': 0.012, '1080p50': 0.02, '2160p50': 0.045 } },
    hx3: { name: 'NDI HX3', r: { '1080i50': 0.05, '1080p50': 0.08, '2160p50': 0.15 } }
  };

  var T = EN ? {
    cams: 'Cameras', srv: 'Servers / replay', gfx: 'Graphics (CG)', ext: 'External feeds',
    fmt: 'Video format', tr: 'Infrastructure', sdi: 'SDI', ip: 'ST 2110', ndi: 'NDI',
    ndiNet: 'NDI network', ndiSync: 'No genlock needed: NDI receivers sync the frames. Optional NDI Discovery Server.',
    ndiType: 'NDI type',
    ndiNote: {
      hb: 'NDI High Bandwidth: about one frame of latency, visually lossless, needs 1G per HD source (10G for 4K). Best for the studio floor and vision mixing; ST 2110 is still the choice for large uncompressed facilities.',
      hx2: 'NDI HX2: very light (about 20 Mbps for HD), so it runs over Wi-Fi, PTZ cameras and long links. Latency is several frames, so it suits PTZ, remote guests and streaming more than fast live cutting.',
      hx3: 'NDI HX3: low latency (under 100 ms) at a fraction of HB bandwidth. A good middle ground for PTZ and camera feeds you cut live on a 1G network.'
    },
    ndiCore: ['NDI network', 'Standard managed Ethernet switches (1G/10G). NDI sends compressed video, so one cable carries many sources. Use IGMP snooping and QoS, and keep NDI on its own VLAN.'],
    ndiSyncN: ['Sync', 'NDI does not need genlock: each receiver frame-syncs what it gets. You still want one reference for cameras on air together.'],
    router: 'Video router', fabric: 'IP fabric', mixer: 'Vision mixer', mv: 'Multiviewer',
    link: 'Links', bw: 'Network load', ports: 'Switch ports', sync: 'Sync',
    inputs: 'inputs', me: 'M/E', screens: 'screens', windows: 'windows',
    perNet: 'per network (red + blue)', coax: 'coax runs',
    ptp: 'PTP grandmaster ×2 (SMPTE ST 2059)', bb: 'Tri-level sync / black burst generator',
    tap: 'Tap any block to see what it does.',
    note: 'Planning estimate with 25% spare capacity. A real design also counts audio, intercom, tally, monitoring and the building itself.',
    wa: 'Send me this studio plan on WhatsApp',
    msg: 'Hi, I used the Studio Planner on closedcircuiteng.com.\n',
    scroll: 'Swipe to see the full signal flow →',
    n: {
      cam: ['Cameras', 'Studio cameras. Each one feeds its own CCU.'],
      ccu: ['CCUs', 'Camera control units. The shading engineer sets iris, colour and black level here, so all cameras match.'],
      srv: ['Servers / replay', 'Play in packages and ads, record ISOs and give instant replay.'],
      gfx: ['Graphics', 'Lower thirds, tickers and full-screen graphics. Each channel usually needs two signals: fill and key.'],
      ext: ['External feeds', 'Remote reporters, OB vans, SNG and agency feeds coming into the studio.'],
      core: ['Router / IP core', 'The heart of the system. Any source can go to any destination. With ST 2110 this is a pair of redundant network switches (red and blue).'],
      sync: ['Sync', 'Keeps every device on the same timing. SDI uses tri-level sync; ST 2110 uses PTP from two grandmaster clocks.'],
      mix: ['Vision mixer', 'The director cuts between sources here. M/E rows let you build layers and effects at the same time.'],
      mv: ['Multiviewer', 'The monitor wall in the gallery: every source on screen, with tally and audio meters.'],
      rec: ['Recorders', 'Record the programme and the clean feed for archive and social media.'],
      tx: ['Playout → TX', 'The final programme goes to transmission: satellite uplink, encoder, streaming or the station master control.']
    }
  } : {
    cams: 'الكاميرات', srv: 'سيرفرات / إعادة', gfx: 'غرافيكس (CG)', ext: 'خطوط خارجية',
    fmt: 'صيغة الصورة', tr: 'البنية التحتية', sdi: 'SDI', ip: 'ST 2110', ndi: 'NDI',
    ndiNet: 'شبكة NDI', ndiSync: 'ما في داعي لـ genlock: أجهزة الاستقبال بتزامن الصورة لحالها. ممكن تزيد NDI Discovery Server.',
    ndiType: 'نوع الـ NDI',
    ndiNote: {
      hb: 'NDI High Bandwidth: تأخير حوالي فريم واحد والجودة ما بتنفرق بالعين، وبدّو 1G لكل مصدر HD (و10G للـ 4K). الأفضل لأرض الاستوديو والميكسر؛ بس للمحطات الكبيرة بلا ضغط بيبقى ST 2110 هو الخيار.',
      hx2: 'NDI HX2: خفيف كتير (حوالي 20 Mbps للـ HD)، فبيمشي على Wi-Fi وكاميرات PTZ ووصلات طويلة. التأخير كم فريم، فبيناسب الـ PTZ والضيوف عن بُعد والستريمينغ أكتر من القطع المباشر السريع.',
      hx3: 'NDI HX3: تأخير قليل (أقل من 100 ms) بجزء صغير من bandwidth الـ HB. حلّ وسط منيح للـ PTZ والكاميرات اللي بتقطع عليها مباشرة على شبكة 1G.'
    },
    ndiCore: ['شبكة NDI', 'سويتشات إيثرنت managed عادية (1G/10G). الـ NDI بيبعت صورة مضغوطة، فكابل واحد بيحمل مصادر كتير. فعّل IGMP snooping وQoS، وحطّ الـ NDI على VLAN لحالو.'],
    ndiSyncN: ['المزامنة', 'الـ NDI ما بدّو genlock: كل جهاز استقبال بيزامن الصورة اللي بتوصلو. بس منيح يكون في مرجع واحد للكاميرات اللي عالهوا سوا.'],
    router: 'راوتر الفيديو', fabric: 'شبكة IP', mixer: 'الـ Vision Mixer', mv: 'Multiviewer',
    link: 'الوصلات', bw: 'حِمل الشبكة', ports: 'بورتات الـ Switch', sync: 'المزامنة',
    inputs: 'مدخل', me: 'M/E', screens: 'شاشة', windows: 'نافذة',
    perNet: 'لكل شبكة (حمرا + زرقا)', coax: 'كابل coax',
    ptp: 'PTP grandmaster ×2 (SMPTE ST 2059)', bb: 'مولّد Tri-level sync / Black burst',
    tap: 'كبّس على أي جهاز لتعرف شو بيعمل.',
    note: 'تقدير للتخطيط مع 25% سعة احتياط. التصميم الحقيقي بيحسب كمان الصوت، الإنتركم، التالي، المراقبة والمبنى نفسو.',
    wa: 'ابعتلي خطة الاستوديو عالواتساب',
    msg: 'مرحبا، استعملت Studio Planner على closedcircuiteng.com.\n',
    scroll: '← اسحب لتشوف كل مسار الإشارة',
    n: {
      cam: ['الكاميرات', 'كاميرات الاستوديو، وكل وحدة إلها CCU.'],
      ccu: ['CCUs', 'وحدات التحكم بالكاميرات. مهندس الـ shading بيضبط منها الإيريس والألوان والأسود لحتى كل الكاميرات تطلع متل بعض.'],
      srv: ['سيرفرات / إعادة', 'بتشغّل التقارير والإعلانات، بتسجّل كل كاميرا لحالها، وبتعطي إعادة فورية.'],
      gfx: ['غرافيكس', 'أسماء الضيوف، الشريط الإخباري والغرافيكس الكاملة. كل قناة غرافيكس بتحتاج إشارتين: fill وkey.'],
      ext: ['خطوط خارجية', 'المراسلين، عربات الـ OB، الـ SNG وخطوط الوكالات اللي داخلة عالاستوديو.'],
      core: ['الراوتر / شبكة IP', 'قلب النظام. أي مصدر بيروح لأي وجهة. بالـ ST 2110 بيصير زوج سويتشات احتياط لبعض (حمرا وزرقا).'],
      sync: ['المزامنة', 'بتخلّي كل الأجهزة على نفس التوقيت. بالـ SDI منستعمل tri-level sync، وبالـ ST 2110 منستعمل PTP من ساعتين grandmaster.'],
      mix: ['الـ Vision Mixer', 'هون المخرج بيقطع بين المصادر. صفوف الـ M/E بتسمحلك تبني طبقات ومؤثرات بنفس الوقت.'],
      mv: ['Multiviewer', 'حيط الشاشات بغرفة التحكم: كل المصادر قدّامك مع التالي ومؤشرات الصوت.'],
      rec: ['التسجيل', 'تسجيل البرنامج والـ clean feed للأرشيف والسوشيال ميديا.'],
      tx: ['Playout ← البث', 'البرنامج النهائي بيطلع عالبث: satellite uplink، encoder، ستريمينغ أو الـ master control بالمحطة.']
    }
  };

  function num(id, label, v, max) {
    return '<label><span>' + label + '</span><input type="number" id="' + id + '" min="0" max="' + max + '" value="' + v + '"></label>';
  }
  root.innerHTML =
    '<div class="sp-in">' +
    num('sp-cam', T.cams, 5, 40) + num('sp-srv', T.srv, 2, 16) + num('sp-gfx', T.gfx, 2, 8) + num('sp-ext', T.ext, 2, 24) +
    '<label><span>' + T.fmt + '</span><select id="sp-fmt"><option value="1080i50">1080i50</option><option value="1080p50" selected>1080p50</option><option value="2160p50">2160p50 (4K)</option></select></label>' +
    '<div class="sp-seg" role="radiogroup" aria-label="' + T.tr + '"><span>' + T.tr + '</span><div>' +
    '<button type="button" data-tr="sdi" class="on">' + T.sdi + '</button><button type="button" data-tr="ip">' + T.ip + '</button><button type="button" data-tr="ndi">' + T.ndi + '</button></div></div>' +
    '<div class="sp-seg" id="sp-nt" role="radiogroup" aria-label="' + T.ndiType + '"><span>' + T.ndiType + '</span><div>' +
    '<button type="button" data-nt="hb" class="on">HB</button><button type="button" data-nt="hx2">HX2</button><button type="button" data-nt="hx3">HX3</button></div></div>' +
    '</div>' +
    '<div class="sp-flow"><div class="sp-scroll"><svg id="sp-svg" viewBox="0 0 980 400" role="img"></svg></div>' +
    '<p class="sp-hint">' + T.scroll + '</p>' +
    '<div class="sp-info" id="sp-info" aria-live="polite">' + T.tap + '</div></div>' +
    '<div class="sp-res">' +
    stat('r-router', T.router) + stat('r-mix', T.mixer) + stat('r-mv', T.mv) + stat('r-link', T.link) + stat('r-net', T.bw) + stat('r-sync', T.sync) +
    '<p class="calc-warn" id="sp-ndi"></p><p class="calc-note">' + T.note + '</p>' +
    '<a class="btn btn-primary" id="sp-wa" target="_blank" rel="noopener">' + T.wa + '</a></div>';

  function stat(id, label) { return '<div class="calc-stat"><small id="' + id + '-l">' + label + '</small><b id="' + id + '"></b><em id="' + id + '-n"></em></div>'; }
  function $(id) { return document.getElementById(id); }
  function n(id, max) { var v = parseInt($(id).value, 10); return isNaN(v) || v < 0 ? 0 : Math.min(v, max); }
  function up(list, x) { for (var i = 0; i < list.length; i++) if (list[i] >= x) return list[i]; return list[list.length - 1]; }

  var nt = 'hb', tr = 'sdi', sel = null, used = false;

  // Diagram layout (fixed LTR signal flow, left to right)
  var W = 150, H = 50;
  var POS = {
    cam: [20, 30], srv: [20, 130], gfx: [20, 230], ext: [20, 330],
    ccu: [215, 30],
    core: [420, 165], sync: [420, 320],
    mix: [625, 70],
    mv: [810, 165], rec: [810, 255], tx: [810, 345]
  };
  var EDGES = [['cam', 'ccu'], ['ccu', 'core'], ['srv', 'core'], ['gfx', 'core'], ['ext', 'core'],
    ['core', 'mix'], ['mix', 'core', 'ret'], ['core', 'mv'], ['core', 'rec'], ['core', 'tx'], ['sync', 'core', 'sync']];

  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function anchor(id, side) {
    var p = POS[id];
    if (side === 'r') return [p[0] + W, p[1] + H / 2];
    if (side === 'l') return [p[0], p[1] + H / 2];
    if (side === 't') return [p[0] + W / 2, p[1]];
    return [p[0] + W / 2, p[1] + H];
  }

  function draw(d) {
    var svg = $('sp-svg');
    svg.textContent = '';
    svg.setAttribute('aria-label', T.n.core[0] + ': ' + d.coreLabel);
    var g = el('g', { 'class': 'sp-edges' });
    EDGES.forEach(function (e) {
      var a, b, path;
      if (e[2] === 'ret') {            // mixer outputs back into the router
        a = anchor('mix', 'b'); b = anchor('core', 'r');
        path = 'M' + a[0] + ',' + a[1] + ' C' + a[0] + ',' + (b[1] + 5) + ' ' + (b[0] + 40) + ',' + b[1] + ' ' + b[0] + ',' + b[1];
      } else if (e[2] === 'sync') {
        a = anchor('sync', 't'); b = anchor('core', 'b');
        path = 'M' + a[0] + ',' + a[1] + ' L' + b[0] + ',' + b[1];
      } else {
        a = anchor(e[0], 'r'); b = anchor(e[1], 'l');
        var mx = (a[0] + b[0]) / 2;
        path = 'M' + a[0] + ',' + a[1] + ' C' + mx + ',' + a[1] + ' ' + mx + ',' + b[1] + ' ' + b[0] + ',' + b[1];
      }
      var on = sel && (e[0] === sel || e[1] === sel);
      g.appendChild(el('path', { d: path, 'class': 'sp-edge' + (e[2] ? ' sp-' + e[2] : '') + (on ? ' on' : '') + (tr !== 'sdi' && !e[2] ? ' ' + tr : ''), 'marker-end': 'url(#sp-arrow)' }));
    });
    var defs = el('defs', {});
    var m = el('marker', { id: 'sp-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'sp-arrowhead' }));
    defs.appendChild(m);
    svg.appendChild(defs);
    svg.appendChild(g);

    Object.keys(POS).forEach(function (id) {
      if (id === 'ccu' && !d.cams) return;
      var p = POS[id];
      var node = el('g', { 'class': 'sp-node' + (id === 'core' ? ' core' : '') + (sel === id ? ' sel' : ''), tabindex: '0', role: 'button', 'data-id': id, transform: 'translate(' + p[0] + ',' + p[1] + ')' });
      node.appendChild(el('rect', { width: W, height: H, rx: 10 }));
      node.appendChild(el('text', { x: W / 2, y: 21, 'class': 'sp-t1' }, d.label[id][0]));
      node.appendChild(el('text', { x: W / 2, y: 38, 'class': 'sp-t2' }, d.label[id][1]));
      svg.appendChild(node);
    });
  }

  function calc() {
    var cams = n('sp-cam', 40), srv = n('sp-srv', 16), gfx = n('sp-gfx', 8), ext = n('sp-ext', 24);
    var f = FMT[$('sp-fmt').value] || FMT['1080p50'];

    var me = cams <= 6 ? 1 : cams <= 12 ? 2 : cams <= 24 ? 3 : 4;
    var mixIn = cams + srv + gfx * 2 + ext;                    // graphics = fill + key
    var mixSize = up([8, 12, 16, 24, 32, 40, 48, 64, 80, 96], mixIn * 1.25);
    var mixOut = 3 + 2 * me;                                   // PGM, PVW, clean + aux per M/E
    var sources = mixIn + mixOut + srv + 4;                    // + server playback outs, test/black/spare
    var mvWin = cams + srv + gfx + ext + 2;                    // + PGM, PVW
    var dests = mixSize + mvWin + srv + ext + 4;               // mixer ins, MV ins, records, returns, monitors
    var routerN = up([16, 32, 64, 96, 128, 144, 192, 256, 288, 576, 1152], Math.max(sources, dests) * 1.25);
    var mvScreens = Math.max(1, Math.ceil(mvWin / 16));

    // IP: every sender stream once, every receiver subscription once
    var senders = sources, receivers = dests;
    var bwSend = senders * f.gbps, bwTotal = (senders + receivers) * f.gbps;
    var endpoints = cams + srv + gfx + ext + 1 /*mixer*/ + mvScreens + 2 /*rec*/ + 2 /*TX gw*/;
    var portSpeed = f.gbps > 5 ? '100G' : '25G';
    var mixPorts = Math.ceil((mixSize + mixOut) * f.gbps / 90);   // 100G ports at ~90% load

    var nd = NDI[nt], ndiRate = nd.r[$('sp-fmt').value] || nd.r['1080p50'];
    var ndiSend = senders * ndiRate;
    var ndiPort = ndiRate > 0.2 ? '10GbE' : '1GbE';
    var ndiUplink = up([1, 10, 25, 40, 100], (mixSize + mixOut) * ndiRate * 1.25);   // mixer link, Gbps
    var fx = function (x) { return (Math.round(x * 10) / 10).toLocaleString('en'); };
    var coreLabel = tr === 'ip' ? 'Red / Blue · ' + fx(bwSend) + ' Gbps' : tr === 'ndi' ? nd.name + ' · ' + fx(ndiSend) + ' Gbps' : routerN + '×' + routerN + ' ' + f.sdi.replace(/-SDI.*/, '');
    var label = {
      cam: [T.n.cam[0], '× ' + cams + ' · ' + f.label.split(' ')[0]],
      ccu: [T.n.ccu[0], '× ' + cams],
      srv: [T.n.srv[0], '× ' + srv],
      gfx: [T.n.gfx[0], '× ' + gfx + ' (fill+key)'],
      ext: [T.n.ext[0], '× ' + ext],
      core: [tr === 'ip' ? 'ST 2110 fabric' : tr === 'ndi' ? 'NDI network' : 'SDI router', coreLabel],
      sync: [T.n.sync[0], tr === 'ip' ? 'PTP ×2' : tr === 'ndi' ? 'Frame sync' : 'Tri-level'],
      mix: [T.n.mix[0], mixSize + ' in · ' + me + ' M/E'],
      mv: [T.n.mv[0], mvWin + ' win · ' + mvScreens + ' scr'],
      rec: [T.n.rec[0], 'PGM + clean'],
      tx: [T.n.tx[0], 'TX / SNG / web']
    };
    draw({ cams: cams, label: label, coreLabel: coreLabel });

    var r = {};
    r['r-router'] = tr === 'ip' ? [T.fabric, 'Red + Blue', 'SMPTE ST 2022-7'] : tr === 'ndi' ? [T.ndiNet, ndiPort + ' · uplink ' + ndiUplink + 'G', nd.name + ' · IGMP · QoS · VLAN'] : [T.router, routerN + '×' + routerN, f.sdi];
    r['r-mix'] = [T.mixer, mixSize + ' ' + T.inputs, me + ' ' + T.me];
    r['r-mv'] = [T.mv, mvScreens + ' ' + (EN && mvScreens === 1 ? 'screen' : T.screens), mvWin + ' ' + T.windows];
    r['r-link'] = tr === 'ndi' ? [T.ports, endpoints + ' × ' + ndiPort, 'mixer ' + ndiUplink + 'G'] : tr === 'ip' ? [T.ports, endpoints + ' × ' + portSpeed, T.perNet + ' · mixer ' + mixPorts + ' × 100G'] : [T.link, f.sdi, '~' + (sources + dests) + ' ' + T.coax];
    r['r-net'] = tr === 'ndi' ? [T.bw, fx(ndiSend) + ' Gbps', fx(ndiRate * 1000) + ' Mbps × ' + senders + ' streams · ST 2110: ' + fx(bwSend) + ' Gbps'] : tr === 'ip' ? [T.bw, fx(bwSend) + ' Gbps', fx(f.gbps) + ' Gbps × ' + senders + ' streams · fabric ' + fx(bwTotal) + ' Gbps'] : [T.bw, '—', 'ST 2110: ' + fx(bwSend) + ' Gbps'];
    r['r-sync'] = [T.sync, tr === 'ip' ? 'PTP' : tr === 'ndi' ? 'Frame sync' : 'Tri-level', tr === 'ip' ? T.ptp : tr === 'ndi' ? T.ndiSync : T.bb];
    var info = sel && tr === 'ndi' && sel === 'core' ? T.ndiCore : sel && tr === 'ndi' && sel === 'sync' ? T.ndiSyncN : sel ? T.n[sel] : null;
    $('sp-info').innerHTML = info ? '<b>' + info[0] + '</b> ' + info[1] : T.tap;
    $('sp-ndi').style.display = tr === 'ndi' ? 'block' : 'none';
    $('sp-ndi').textContent = T.ndiNote[nt];
    $('sp-nt').style.display = tr === 'ndi' ? '' : 'none';
    Object.keys(r).forEach(function (k) {
      $(k + '-l').textContent = r[k][0]; $(k).textContent = r[k][1]; $(k + '-n').textContent = r[k][2];
    });

    var text = T.msg +
      T.cams + ': ' + cams + ' | ' + T.srv + ': ' + srv + ' | ' + T.gfx + ': ' + gfx + ' | ' + T.ext + ': ' + ext + '\n' +
      T.fmt + ': ' + f.label + ' | ' + T.tr + ': ' + (tr === 'ip' ? 'ST 2110' : tr === 'ndi' ? nd.name : 'SDI') + '\n' +
      Object.keys(r).map(function (k) { return r[k][0] + ': ' + r[k][1] + ' (' + r[k][2] + ')'; }).join('\n');
    $('sp-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }

  function select(id) {
    sel = sel === id ? null : id;
    calc();
  }
  function track() {
    if (!used && typeof gtag === 'function') { used = true; gtag('event', 'planner_used', { page: location.pathname }); }
  }

  root.addEventListener('input', function () { calc(); track(); });
  root.addEventListener('change', calc);
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nt]');
    if (t) {
      nt = t.getAttribute('data-nt');
      root.querySelectorAll('[data-nt]').forEach(function (x) { x.classList.toggle('on', x === t); x.setAttribute('aria-checked', x === t); });
      calc(); track(); return;
    }
    var b = e.target.closest('[data-tr]');
    if (b) {
      tr = b.getAttribute('data-tr');
      root.querySelectorAll('[data-tr]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      calc(); track(); return;
    }
    var node = e.target.closest('.sp-node');
    if (node) { select(node.getAttribute('data-id')); track(); }
  });
  root.addEventListener('keydown', function (e) {
    var node = e.target.closest && e.target.closest('.sp-node');
    if (node && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(node.getAttribute('data-id')); }
  });
  calc();
})();
