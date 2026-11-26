// "Send me the full report" + "Save as PDF" under each free tool.
// Reads the tool's current summary from its WhatsApp link, so every tool keeps a single source of truth.
(function () {
  var EN = document.documentElement.lang === 'en';
  var t = function (ar, en) { return EN ? en : ar; };
  var TOOLS = [
    { link: 'r-wa', self: true, root: 'solar-calc', name: t('حاسبة الطاقة الشمسية', 'Solar calculator') },
    { link: 'sp-wa', root: 'studio-planner', name: 'Studio Planner' },
    { link: 'sc-wa', root: 'sat-calc', name: t('حاسبة الأقمار / Link budget', 'Satellite link budget') }
  ];
  var tr = function (n, p) { if (typeof gtag === 'function') gtag('event', n, p || {}); };

  function summary(a) {
    try { return new URL(a.href).searchParams.get('text') || ''; } catch (e) { return ''; }
  }

  TOOLS.forEach(function (tool) {
    var a = document.getElementById(tool.link), root = document.getElementById(tool.root);
    if (!a || !root) return;
    var box = document.createElement('div');
    box.className = 'rp-box';
    box.innerHTML =
      '<div class="rp-head"><b>' + t('بدّك التقرير كامل؟', 'Want the full report?') + '</b>' +
      '<span>' + t('مهندس بيراجع أرقامك وبيبعتلك تقرير PDF خلال 24 ساعة، ببلاش.', 'An engineer reviews your numbers and sends you a PDF report within 24 hours, free.') + '</span></div>' +
      '<form class="rp-form">' +
      '<input name="name" required placeholder="' + t('الاسم', 'Name') + '" aria-label="' + t('الاسم', 'Name') + '">' +
      '<input name="contact" required dir="ltr" placeholder="' + t('إيميل أو واتساب', 'Email or WhatsApp') + '" aria-label="' + t('إيميل أو واتساب', 'Email or WhatsApp') + '">' +
      '<button class="btn btn-primary btn-sm" type="submit">' + t('ابعتلي التقرير', 'Send me the report') + '</button>' +
      '<button class="btn btn-ghost btn-sm rp-print" type="button">' + t('احفظ PDF هلّق', 'Save PDF now') + '</button>' +
      '</form><div class="rp-status" role="status"></div>';
    (tool.self ? a : a.parentNode).insertAdjacentElement('afterend', box);

    box.querySelector('.rp-print').addEventListener('click', function () {
      root.classList.add('pr-target'); document.body.classList.add('pr-on');
      tr('tool_pdf', { tool: tool.root });
      window.print();
    });

    var form = box.querySelector('form'), st = box.querySelector('.rp-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]'); btn.disabled = true;
      var fd = new FormData(form), c = String(fd.get('contact') || '');
      if (c.indexOf('@') > 0) fd.append('email', c); else fd.append('phone', c);
      fd.append('service', t('طلب تقرير: ', 'Report request: ') + tool.name);
      fd.append('message', summary(a));
      fd.append('page', location.pathname);
      fetch('https://formspree.io/f/myeejbol', { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw 0;
          tr('generate_lead', { service: 'report_' + tool.root, page: location.pathname });
          form.reset(); st.className = 'rp-status ok';
          st.textContent = t('وصل طلبك ✓ رح يوصلك التقرير خلال 24 ساعة.', 'Got it ✓ Your report will arrive within 24 hours.');
        })
        .catch(function () {
          st.className = 'rp-status err';
          st.innerHTML = t('ما زبط الإرسال. ', 'Could not send. ') + '<a href="' + a.href + '" target="_blank" rel="noopener">' + t('ابعت النتيجة عالواتساب', 'Send the result on WhatsApp') + '</a>';
        })
        .finally(function () { btn.disabled = false; });
    });
  });

  window.addEventListener('afterprint', function () {
    document.body.classList.remove('pr-on');
    document.querySelectorAll('.pr-target').forEach(function (n) { n.classList.remove('pr-target'); });
  });
})();
