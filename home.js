/* RasoiOne homepage: Google Drive download links from config.js, the visitor's device, feature tabs. */
(function () {
  var cfg = window.RASOI || {};
  var dl = cfg.downloads || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /** A Drive share link (or bare file ID) → a direct download link. Other links are used as they are. */
  function driveUrl(v) {
    v = String(v || '').trim();
    if (!v) return '';
    var m = v.match(/\/d\/([\w-]{20,})/) || v.match(/[?&]id=([\w-]{20,})/);
    if (m) return 'https://drive.google.com/uc?export=download&id=' + m[1];
    if (/^[\w-]{20,}$/.test(v)) return 'https://drive.google.com/uc?export=download&id=' + v;
    return /^https?:\/\//.test(v) ? v : '';
  }

  // Version, sizes, download buttons
  $$('[data-v]').forEach(function (el) { var k = el.getAttribute('data-v'); if (dl[k]) el.textContent = dl[k]; });
  $$('[data-size]').forEach(function (el) { var o = dl[el.getAttribute('data-size')]; if (o && o.size) el.textContent = o.size; });
  var links = {};
  $$('[data-dl]').forEach(function (a) {
    var os = a.getAttribute('data-dl');
    var url = driveUrl(dl[os] && dl[os].drive);
    links[os] = url;
    if (url) { a.href = url; a.rel = 'noopener'; }
    else { a.textContent = 'Coming soon'; a.classList.add('is-off'); a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
  });
  if (dl.playStore) $$('[data-play]').forEach(function (a) { a.href = dl.playStore; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; });

  // Which device is this? Point the hero button at the right download.
  var ua = navigator.userAgent || '';
  var os = /android/i.test(ua) ? 'android' : /iphone|ipad|ipod/i.test(ua) ? 'ios'
    : /mac os x|macintosh/i.test(ua) ? 'mac' : /windows/i.test(ua) ? 'windows' : '';
  var names = { android: 'Download for Android', windows: 'Download for Windows', mac: 'Download for Mac' };
  var hero = $('#heroDownload');
  if (names[os]) {
    hero.textContent = names[os];
    if (links[os]) { hero.href = links[os]; hero.rel = 'noopener'; }
    var t = $('.ticket[data-os="' + os + '"]');
    if (t) { t.classList.add('is-rec'); $('.rec', t).hidden = false; t.parentNode.insertBefore(t, t.parentNode.firstChild); }
    if (os !== 'android') { var other = $('.hero .btn-line'); if (other) other.textContent = os === 'mac' ? 'Android & Windows' : 'Android & Mac'; }
  } else if (os === 'ios') {
    hero.textContent = 'See downloads';
  }

  // On a computer, show a QR for the Android download so the owner can scan it with the shop phone.
  function drawQr() {
    if (os === 'android' || !links.android || typeof window.qrcode !== 'function') return;
    try {
      var q = window.qrcode(0, 'M');
      q.addData(links.android); q.make();
      $('#qrAndroid').innerHTML = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
      $('.ticket[data-os="android"] .qr-box').hidden = false;
    } catch (e) { /* QR is a nice-to-have */ }
  }
  if (document.readyState === 'complete') drawQr(); else window.addEventListener('load', drawQr);

  // WhatsApp links
  var wa = String(cfg.supportWhatsApp || '').replace(/\D/g, '');
  $$('[data-wa]').forEach(function (a) {
    if (wa.length < 11) { a.href = 'mailto:support@rasoione.shop'; return; }
    a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi RasoiOne, I have a question');
    a.target = '_blank'; a.rel = 'noopener';
  });

  // Feature tabs (click, or arrow keys)
  var tabs = $$('.tour-tabs [role="tab"]');
  var img = $('#tourImg');
  function pick(btn, focus) {
    tabs.forEach(function (b) { var on = b === btn; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    if (focus) btn.focus();
    var src = '/img/phone-' + btn.getAttribute('data-img') + '.webp';
    if (img.getAttribute('src') === src) return;
    img.classList.add('swap');
    var next = new Image();
    next.onload = function () { img.src = src; img.alt = btn.getAttribute('data-alt'); img.classList.remove('swap'); };
    next.src = src;
  }
  tabs.forEach(function (b, i) {
    b.tabIndex = i ? -1 : 0;
    b.addEventListener('click', function () { pick(b); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  // Preload the other screens once the page is idle
  window.addEventListener('load', function () { setTimeout(function () { tabs.forEach(function (b) { new Image().src = '/img/phone-' + b.getAttribute('data-img') + '.webp'; }); }, 1500); });

  // Hairline under the top bar once the page scrolls
  var top = $('.top');
  var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
