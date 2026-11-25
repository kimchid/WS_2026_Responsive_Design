/* PRADA CALM TRIANGLE – Zielgruppe 1 · Interaktionen (Vanilla JS) */
(() => {
  'use strict';
  const SIMULATE_ERROR = false; // true = Fehlerfall "Aktuell nicht verfügbar." testen
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desk = matchMedia('(min-width:800px)');
  const live = $('#live'), toastEl = $('#toast');
  const say = t => { live.textContent = ''; setTimeout(() => (live.textContent = t), 50); };
  let tt; const toast = t => { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), 2500); };

  /* Bilder: hellgraue Fläche, Einblenden nach dem Laden */
  $$('img').forEach(i => {
    const ok = () => i.classList.add('ld'), bad = () => i.classList.add('err');
    if (i.complete) (i.naturalWidth ? ok() : bad()); else { i.onload = ok; i.onerror = bad; }
  });

  /* Layer: Menü, Suche, Warenkorb, Vergrößerung, Sprachwahl */
  const ov = $('#ov'), FOC = 'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])';
  let cur = null, last = null;
  function open(id) {
    if (cur) close(true);
    cur = document.getElementById(id); last = document.activeElement;
    cur.classList.add('on');
    if (id !== 'search' && id !== 'zoom') ov.classList.add('on');
    if (id !== 'search') document.body.classList.add('lock');
    setTimeout(() => { const f = $(id === 'search' ? 'input' : FOC, cur); f && f.focus(); }, 60);
  }
  function close(silent) {
    if (!cur) return;
    cur.classList.remove('on'); ov.classList.remove('on'); document.body.classList.remove('lock');
    cur = null;
    if (!silent && last && last.focus) last.focus();
  }
  ov.addEventListener('click', () => close());
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab' && cur && cur.id !== 'search') {
      const f = $$(FOC, cur).filter(x => x.offsetParent !== null || x === document.activeElement);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  desk.addEventListener('change', () => close(true)); // Drehen/Größe ändern: Layer sauber schließen

  /* Sanftes Scrollen (800 ms) */
  function go(id, cb) {
    const t = document.getElementById(id); if (!t) return;
    const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 64;
    const y0 = scrollY, y1 = t.getBoundingClientRect().top + y0 - hh, d = reduce ? 1 : 800, s = performance.now();
    (function step(n) {
      const p = Math.min(1, (n - s) / d), e = 1 - Math.pow(1 - p, 3);
      scrollTo(0, y0 + (y1 - y0) * e);
      p < 1 ? requestAnimationFrame(step) : cb && cb();
    })(s);
  }

  /* Klick-Delegation: Öffnen, Schließen, Sprung, externe Seiten */
  document.addEventListener('click', e => {
    const t = e.target;
    const o = t.closest('[data-open]'); if (o) { open(o.dataset.open); return; }
    if (t.closest('[data-close]')) { close(); return; }
    const g = t.closest('[data-go]');
    if (g) {
      e.preventDefault();
      const id = (g.getAttribute('href') || '').slice(1), pulse = g.hasAttribute('data-pulse');
      const inMenu = cur && cur.id === 'menu'; if (inMenu) close(true);
      go(id, pulse ? () => { const b = $('#add'); b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 1300); } : null);
      return;
    }
    const x = t.closest('[data-ext]');
    if (x) { e.preventDefault(); toast('Prototyp: Weiter zu ' + x.dataset.ext + ' (externe Seite)'); return; }
    const l = t.closest('[data-lang]'); if (l) { toast('Auswahl: ' + l.textContent); close(); return; }
    const c = t.closest('[data-cc]'); if (c) { $('#cookie').classList.remove('on'); try { localStorage.setItem('cc', '1'); } catch (_) {} }
    const s = t.closest('[data-sug]'); if (s) { $('#q').value = s.textContent; toast('Suchergebnisse (externe Seite)'); close(); }
  });
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { toast('Suchergebnisse (externe Seite)'); close(); } });

  /* Header-Linie, Parallax (nur Desktop) */
  const hd = $('#hd'), px = $('.pxw');
  function onScroll() {
    hd.classList.toggle('sc', scrollY > 40);
    px.style.transform = desk.matches && !reduce ? `translateY(${Math.min(scrollY * 0.08, 64)}px)` : '';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Einblenden beim Scrollen (einmal) */
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => {
    c.style.setProperty('--d', i * +g.dataset.stagger + 'ms');
    c.setAttribute(g.hasAttribute('data-plain') ? 'data-obs' : 'data-reveal', '');
  }));
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15 });
  $$('[data-reveal],[data-obs],.rvimg').forEach(el => io.observe(el));

  /* Produktgalerie */
  const gal = $('#gal'), imgs = $$('img', gal), roll = $$('.roll b'); let gi = 0;
  const show = i => { gi = (i + imgs.length) % imgs.length; imgs.forEach((m, k) => m.classList.toggle('act', k === gi)); roll.forEach(b => (b.style.transform = `translateY(${-gi * 100}%)`)); };
  $('#next').addEventListener('click', () => show(gi + 1));
  gal.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(gi + 1); if (e.key === 'ArrowLeft') show(gi - 1); });
  let sx = 0;
  gal.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  gal.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(gi + (dx < 0 ? 1 : -1)); });
  $('.gal-open').addEventListener('click', () => { const z = $('#zimg'); z.src = imgs[gi].src; z.alt = imgs[gi].alt; open('zoom'); });

  /* Warenkorb */
  const PRICE = 220, addBtn = $('#add'), cnt = $('#cnt'), body = $('#cartBody'); let qty = 0, askRm = false, busy = false;
  const bump = () => { cnt.classList.remove('bump'); void cnt.offsetWidth; cnt.classList.add('bump'); };
  function render() {
    cnt.hidden = qty === 0; cnt.textContent = qty;
    body.innerHTML = qty
      ? `<div class="ci"><img src="images/produkt-z1-01.jpg" alt="Calm Triangle Raumduft, schwarz"><div><p class="nm">Raumduft aus Keramik · CALM TRIANGLE</p><p>€ ${PRICE}</p><div class="qt"><button class="ib" data-q="-1" aria-label="Menge verringern">–</button><span aria-live="polite">${qty}</span><button class="ib" data-q="1" aria-label="Menge erhöhen">+</button></div>${qty === 1 && askRm ? '<a href="#" class="tl" data-rm>ENTFERNEN</a>' : ''}</div></div><p class="sum"><span>Summe</span><span>€ ${qty * PRICE}</span></p><a class="btn" href="#" data-ext="Kasse"><span>ZUR KASSE</span></a>`
      : '<p>Ihr Warenkorb ist leer.</p>';
  }
  body.addEventListener('click', e => {
    if (e.target.closest('[data-rm]')) { e.preventDefault(); qty = 0; askRm = false; render(); bump(); say('Artikel entfernt'); return; }
    const q = e.target.closest('[data-q]'); if (!q) return;
    const d = +q.dataset.q;
    if (d < 0 && qty === 1) askRm = true; else { qty = Math.max(1, Math.min(10, qty + d)); askRm = false; }
    render(); bump();
    const again = $(`[data-q="${q.dataset.q}"]`, body); again && again.focus();
  });
  addBtn.addEventListener('click', () => {
    if (busy) return; busy = true;
    const t = $('span', addBtn); t.innerHTML = '<i class="dots"><b></b><b></b><b></b></i>';
    setTimeout(() => {
      if (SIMULATE_ERROR) { t.textContent = 'IN DEN WARENKORB'; $('#err').hidden = false; busy = false; return; }
      t.textContent = 'HINZUGEFÜGT ✓'; say('Hinzugefügt');
      qty = Math.min(10, qty + 1); askRm = false; render(); bump(); open('cart');
      setTimeout(() => { t.textContent = 'IN DEN WARENKORB'; busy = false; }, 2000);
    }, 400);
  });
  render();

  /* Newsletter */
  $('#nl').addEventListener('submit', e => {
    e.preventDefault();
    const f = $('#nl .field'), m = $('#nlm'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#em').value.trim());
    f.classList.remove('shake'); void f.offsetWidth;
    if (!ok) { f.classList.add('shake'); m.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'; return; }
    $('#nlsend use').setAttribute('href', '#i-check');
    m.textContent = 'Danke, wir haben Ihnen eine Bestätigung gesendet.';
  });

  /* Cookie-Hinweis: nach 1 s, bis entschieden */
  let decided = false; try { decided = !!localStorage.getItem('cc'); } catch (_) {}
  if (!decided) setTimeout(() => $('#cookie').classList.add('on'), 1000);
})();
