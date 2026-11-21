// Mobile menu
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.menu-btn');
  if (btn) {
    document.querySelector('.nav-links').classList.toggle('open');
  }
});

// Footer year
var y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Lead form -> Formspree, with WhatsApp fallback
var WA = '96170368646';
document.querySelectorAll('form.lead-form').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var data = new FormData(form);
    btn.disabled = true;
    btn.textContent = 'جارٍ الإرسال...';

    var msg = 'مرحباً، أنا ' + (data.get('name') || '') +
      '\nالخدمة: ' + (data.get('service') || '') +
      '\nالهاتف: ' + (data.get('phone') || '') +
      '\n' + (data.get('message') || '');
    var waLink = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('bad');
      status.className = 'form-status ok';
      status.textContent = 'تم استلام طلبك ✓ سنتواصل معك خلال 24 ساعة.';
      form.reset();
    }).catch(function () {
      status.className = 'form-status err';
      status.innerHTML = 'تعذّر الإرسال الآن. <a href="' + waLink + '" target="_blank" rel="noopener">أرسل طلبك عبر واتساب</a> بضغطة واحدة.';
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'أرسل الطلب';
    });
  });
});
