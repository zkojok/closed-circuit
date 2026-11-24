// Mobile menu
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.menu-btn');
  if (btn) {
    document.querySelector('.nav-links').classList.toggle('open');
  }
});

// Analytics: send a GA4 event for contact, booking and store clicks
function track(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href]');
  if (!a) return;
  var href = a.getAttribute('href');
  var name = null;
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) name = 'whatsapp_click';
  else if (/^mailto:/.test(href)) name = 'email_click';
  else if (/^tel:/.test(href)) name = 'phone_click';
  else if (/calendly\.com/.test(href)) name = 'booking_click';
  else if (/alztechpro\.com/.test(href)) name = 'store_click';
  else if (/ene\.ac/.test(href)) name = 'masterclass_click';
  if (!name) return;
  track(name, {
    link_url: href.split('?')[0],
    link_text: (a.textContent || '').trim().slice(0, 60),
    page: location.pathname
  });
});

// Footer year
var y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

var WA = '96170368646';
var ENE = 'https://ene.ac/l/3qc5sgd7/masterclass';
var EN = document.documentElement.lang === 'en';

var T = EN ? {
  send: 'Send request', sendLearn: 'Send & continue registration', sending: 'Sending...',
  ok: 'Request received ✓ We will contact you within 24 hours.',
  redirect: 'Done ✓ Taking you to the registration page... If it doesn\'t open, ',
  clickHere: 'click here', fail: 'Could not send right now. ', viaWa: 'Send your request on WhatsApp',
  oneClick: ' in one click.', hi: 'Hi, I\'m ', service: 'Service: ', phone: 'Phone: '
} : {
  send: 'أرسل الطلب', sendLearn: 'أرسل وكمّل التسجيل', sending: 'جارٍ الإرسال...',
  ok: 'تم استلام طلبك ✓ سنتواصل معك خلال 24 ساعة.',
  redirect: 'تم ✓ عم ننقلك لصفحة التسجيل... إذا ما انفتحت، ',
  clickHere: 'كبّس هون', fail: 'تعذّر الإرسال الآن. ', viaWa: 'أرسل طلبك عبر واتساب',
  oneClick: ' بضغطة واحدة.', hi: 'مرحباً، أنا ', service: 'الخدمة: ', phone: 'الهاتف: '
};

function isLearn(form) {
  var sel = form.querySelector('select[name="service"]');
  if (!sel) return false;
  var opt = sel.options[sel.selectedIndex];
  return !!(opt && opt.getAttribute('data-learn'));
}

document.querySelectorAll('form.lead-form').forEach(function (form) {
  var sel = form.querySelector('select[name="service"]');
  var hint = form.querySelector('.form-hint');
  var btn = form.querySelector('button[type="submit"]');

  function updateHint() {
    var learn = isLearn(form);
    if (hint) hint.style.display = learn ? 'block' : 'none';
    btn.textContent = learn ? T.sendLearn : T.send;
  }
  if (sel) { sel.addEventListener('change', updateHint); updateHint(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var data = new FormData(form);
    var learn = isLearn(form);
    btn.disabled = true;
    btn.textContent = T.sending;

    var msg = T.hi + (data.get('name') || '') +
      '\n' + T.service + (data.get('service') || '') +
      '\n' + T.phone + (data.get('phone') || '') +
      '\n' + (data.get('message') || '');
    var waLink = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);

    function goToEne() {
      status.className = 'form-status ok';
      status.innerHTML = T.redirect + '<a href="' + ENE + '" target="_blank" rel="noopener">' + T.clickHere + '</a>.';
      setTimeout(function () { window.location.href = ENE; }, 1500);
    }

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('bad');
      track('generate_lead', { service: data.get('service') || '', page: location.pathname });
      form.reset();
      if (learn) { goToEne(); return; }
      status.className = 'form-status ok';
      status.textContent = T.ok;
    }).catch(function () {
      if (learn) { goToEne(); return; }
      status.className = 'form-status err';
      status.innerHTML = T.fail + '<a href="' + waLink + '" target="_blank" rel="noopener">' + T.viaWa + '</a>' + T.oneClick;
    }).finally(function () {
      btn.disabled = false;
      updateHint();
    });
  });
});
