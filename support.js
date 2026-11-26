// Support page: downloads list and "send us files" box, both read from content/support.json
// (edited through Pages CMS, see .pages.yml).
(function () {
  var list = document.getElementById('dl-list'), up = document.getElementById('up-box');
  if (!list) return;
  var EN = document.documentElement.lang === 'en';
  var t = function (ar, en) { return EN ? en : ar; };
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tr = function (n, p) { if (typeof gtag === 'function') gtag('event', n, p || {}); };
  fetch((EN ? '../' : '') + 'content/support.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    var items = (d.downloads || []).map(function (x) {
      var href = (EN ? x.file_en || x.file_ar : x.file_ar || x.file_en) || x.url;
      if (!href) return '';
      var ext = (href.split('?')[0].split('.').pop() || 'link').toUpperCase().slice(0, 4);
      if (/^https?:/.test(href) && !/\.(pdf|zip|docx?|xlsx?|dwg|exe|apk|bin)$/i.test(href)) ext = 'LINK';
      var title = EN ? x.title_en || x.title_ar : x.title_ar || x.title_en;
      return '<a class="dl-item" href="' + esc(href) + '" target="_blank" rel="noopener" data-dl="' + esc(title) + '"><span class="dl-ico">' + esc(ext) + '</span><span><b>' + esc(title) + '</b><small>' + esc(EN ? x.desc_en || x.desc_ar : x.desc_ar || x.desc_en) + '</small></span></a>';
    }).join('');
    list.innerHTML = items || '<p class="calc-note">' + t('ما في ملفات حالياً.', 'No files yet.') + '</p>';
    if (d.mega_url && up) {
      var a = up.querySelector('a'); a.href = d.mega_url; up.hidden = false;
    }
  }).catch(function () { list.innerHTML = ''; });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.dl-item'); if (a) tr('file_download_click', { file: a.getAttribute('data-dl') });
    if (e.target.closest('#up-box a')) tr('client_upload_click', {});
  });
})();
