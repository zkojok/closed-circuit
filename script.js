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

var WA = '96170368646';
var ENE = 'https://ene.ac/l/3qc5sgd7/masterclass';
var LEARN = 'تعلّم مهارة High-Ticket Closing';

function isLearn(form) {
  var sel = form.querySelector('select[name="service"]');
  return sel && sel.value === LEARN;
}

document.querySelectorAll('form.lead-form').forEach(function (form) {
  var sel = form.querySelector('select[name="service"]');
  var hint = form.querySelector('.form-hint');
  var btn = form.querySelector('button[type="submit"]');

  function updateHint() {
    var learn = isLearn(form);
    if (hint) hint.style.display = learn ? 'block' : 'none';
    btn.textContent = learn ? 'أرسل وكمّل التسجيل' : 'أرسل الطلب';
  }
  if (sel) { sel.addEventListener('change', updateHint); updateHint(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var data = new FormData(form);
    var learn = isLearn(form);
    btn.disabled = true;
    btn.textContent = 'جارٍ الإرسال...';

    var msg = 'مرحباً، أنا ' + (data.get('name') || '') +
      '\nالخدمة: ' + (data.get('service') || '') +
      '\nالهاتف: ' + (data.get('phone') || '') +
      '\n' + (data.get('message') || '');
    var waLink = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);

    function goToEne() {
      status.className = 'form-status ok';
      status.innerHTML = 'تم ✓ عم ننقلك لصفحة التسجيل... إذا ما انفتحت، <a href="' + ENE + '" target="_blank" rel="noopener">كبّس هون</a>.';
      setTimeout(function () { window.location.href = ENE; }, 1500);
    }

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('bad');
      form.reset();
      if (learn) { goToEne(); return; }
      status.className = 'form-status ok';
      status.textContent = 'تم استلام طلبك ✓ سنتواصل معك خلال 24 ساعة.';
    }).catch(function () {
      if (learn) { goToEne(); return; }
      status.className = 'form-status err';
      status.innerHTML = 'تعذّر الإرسال الآن. <a href="' + waLink + '" target="_blank" rel="noopener">أرسل طلبك عبر واتساب</a> بضغطة واحدة.';
    }).finally(function () {
      btn.disabled = false;
      updateHint();
    });
  });
});
