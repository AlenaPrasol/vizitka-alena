/* Визитка Алёны Прасоловой: день помощника проигрывается в окне, переписка набирается, закреплённый показ, входы секций. Без скрипта всё читается. */
(function () {
  'use strict';
  if (window.__jsTimer) clearTimeout(window.__jsTimer);
  /* скрипт мог прийти позже страховки в head: возвращаем режим со скриптом */
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- окно помощника читает часы посетителя ---- */
  var den = document.getElementById('den');
  var chasy = document.getElementById('chasy');
  var chasySt = document.getElementById('chasy-st');
  /* лента дня листается внутри экрана телефона; подводим строку к середине экрана, не двигая страницу */
  function kStroke(li, plavno) {
    if (!den || !li) return;
    var top = li.offsetTop - (den.clientHeight - li.offsetHeight) / 2;
    if (den.scrollTo) den.scrollTo({ top: Math.max(0, top), behavior: plavno && !reduce ? 'smooth' : 'auto' });
    else den.scrollTop = Math.max(0, top);
  }
  var dni = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  var igraet = false;
  function tik() {
    if (!den || igraet) return;
    var now = new Date();
    var h = now.getHours() + now.getMinutes() / 60;
    var wd = now.getDay();
    if (chasy) {
      chasy.textContent = dni[wd];
    }
    if (chasySt) chasySt.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    var items = Array.prototype.slice.call(den.children);
    var current = null;
    items.forEach(function (li) {
      var lh = parseFloat(li.getAttribute('data-h'));
      var lwd = li.getAttribute('data-wd');
      if (lwd !== null) {
        if (Number(lwd) === wd && h >= lh && h < lh + 3) current = li;
        return;
      }
      if (h >= lh && (!current || current.getAttribute('data-wd') === null)) current = li;
    });
    if (!current) current = items[items.length - 2]; /* после полуночи: последнее сделанное вчера вечером */
    var next = null;
    items.forEach(function (li) {
      if (next || li.getAttribute('data-wd') !== null) return;
      if (parseFloat(li.getAttribute('data-h')) > h) next = li;
    });
    if (!next) next = items[0];
    /* сделано сегодня: строки дня, чей час уже прошёл, и последняя сделанная */
    var done = items.filter(function (li) {
      return li === current || (li.getAttribute('data-wd') === null && parseFloat(li.getAttribute('data-h')) <= h);
    });
    var pervyy = !den.dataset.scrolled;
    function itog() {
      items.forEach(function (li) {
        li.classList.remove('is-run');
        li.classList.toggle('is-done', done.indexOf(li) !== -1);
        li.classList.toggle('is-now', li === current);
        li.classList.toggle('is-next', li === next && li !== current);
      });
    }
    if (!pervyy) { itog(); return; }
    if (current) {
      den.dataset.scrolled = '1';
      /* на компьютере сразу раскрыта подробность текущей строки */
      var telefon = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
      if (!telefon) {
        current.classList.add('is-open');
        var btn0 = current.querySelector('button'); if (btn0) btn0.setAttribute('aria-expanded', 'true');
      }
    }
    /* день проигрывается: строка за строкой до текущего часа, потом окно живёт по часам */
    var put = done;
    if (reduce || put.length < 2) { itog(); kStroke(current, false); return; }
    kStroke(put[0], false);
    igraet = true;
    var shag = Math.max(180, Math.min(320, 2400 / put.length));
    put.forEach(function (li, i) {
      setTimeout(function () {
        if (i) { put[i - 1].classList.remove('is-run'); put[i - 1].classList.add('is-done'); }
        li.classList.add('is-run');
        kStroke(li, true);
      }, 500 + i * shag);
    });
    setTimeout(function () { igraet = false; itog(); kStroke(current, true); }, 500 + put.length * shag + 120);
  }
  if (den) {
    Array.prototype.forEach.call(den.querySelectorAll('button'), function (b) { b.setAttribute('aria-expanded', 'false'); });
    tik();
    setInterval(tik, 30000);
    den.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var li = btn.parentNode;
      var open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- заметки на полях подсвечивают своё сообщение ---- */
  document.querySelectorAll('.note[data-msg]').forEach(function (note) {
    var id = note.getAttribute('data-msg');
    var msgs = document.querySelectorAll('.msg[data-i="' + id + '"]');
    function on(v) {
      note.classList.toggle('is-on', v);
      msgs.forEach(function (m) { m.classList.toggle('is-on', v); });
    }
    note.addEventListener('mouseenter', function () { on(true); });
    note.addEventListener('mouseleave', function () { on(false); });
  });

  /* ---- переписка: сообщения появляются по очереди, помощник сначала «печатает» ---- */
  var kuski = document.querySelectorAll('.zachem .slice');
  var cio = null;
  if (kuski.length && !reduce && 'IntersectionObserver' in window) {
    cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || en.target.dataset.igra) return;
        en.target.dataset.igra = '1';
        cio.unobserve(en.target);
        var t = 150;
        Array.prototype.forEach.call(en.target.querySelectorAll('.msg'), function (m) {
          var bot = m.classList.contains('msg--bot');
          if (bot) {
            setTimeout(function () { m.classList.remove('is-wait'); m.classList.add('is-typing'); }, t);
            t += 700;
          } else {
            t += 250;
          }
          setTimeout(function () { m.classList.remove('is-typing', 'is-wait'); m.classList.add('is-show'); }, t);
          t += 350;
        });
      });
    }, { rootMargin: '0px 0px -30% 0px', threshold: 0.2 });
    kuski.forEach(function (k) {
      k.querySelectorAll('.msg').forEach(function (m) { m.classList.add('is-wait'); });
      cio.observe(k);
    });
  }
  /* страховка: переписку, которую уже проскочили (якорь, восстановленная прокрутка, End), показываем сразу */
  function chatSrazu() {
    Array.prototype.forEach.call(kuski, function (k) {
      if (k.dataset.igra || k.getBoundingClientRect().top > window.innerHeight * 0.7) return;
      k.dataset.igra = '1';
      if (cio) cio.unobserve(k);
      k.querySelectorAll('.msg').forEach(function (m) { m.classList.remove('is-wait', 'is-typing'); m.classList.add('is-show'); });
    });
  }

  /* ---- кнопка в шапке появляется, когда первый экран со своей кнопкой ушёл ---- */
  var top = document.querySelector('.top');
  var verh = document.getElementById('verh');
  if (top && verh && 'IntersectionObserver' in window) {
    top.classList.add('na-pervom');
    new IntersectionObserver(function (entries) {
      top.classList.toggle('na-pervom', entries[0].isIntersecting);
    }, { rootMargin: '-40% 0px 0px 0px', threshold: 0 }).observe(verh);
  }

  /* ---- как идёт дело: шаг у центра экрана меняет состояние сцены ---- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var states = document.querySelectorAll('#stage .state');
  function setState(n) {
    steps.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-state') === String(n)); });
    states.forEach(function (st) { st.classList.toggle('is-active', st.classList.contains('state-' + n)); });
  }
  if (steps.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setState(en.target.getAttribute('data-state'));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
    setState(1);
  }

  /* ---- книга работ: снимок сайта у наведённой строки ---- */
  var gallery = document.getElementById('gallery');
  var rows = document.querySelectorAll('.ledger__rows li');
  if (gallery && rows.length) {
    var frames = gallery.querySelectorAll('span[data-img]');
    rows.forEach(function (li) {
      var a = li.querySelector('a');
      function show() {
        var src = a.getAttribute('data-img');
        rows.forEach(function (r) { r.classList.toggle('is-current', r === li); });
        frames.forEach(function (f) { f.classList.toggle('is-current', f.getAttribute('data-img') === src); });
      }
      a.addEventListener('mouseenter', show);
      a.addEventListener('focus', show);
    });
  }

  /* ---- поле «С чем помочь?»: открываем Telegram с приветствием ---- */
  var forma = document.getElementById('forma');
  if (forma) {
    forma.addEventListener('submit', function (e) {
      var inp = document.getElementById('tekst');
      var full = document.getElementById('tekst-polnyy');
      var t = (inp.value || '').trim();
      if (!t) return;
      /* пробелы как %20, а не «+»: открываем ссылкой в том же жесте нажатия */
      e.preventDefault();
      if (full) full.value = 'Здравствуйте, Алёна! ' + t;
      var a = document.createElement('a');
      a.href = 'https://t.me/alenaprasol?text=' + encodeURIComponent('Здравствуйте, Алёна! ' + t);
      a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ---- входы секций ---- */
  var hero = document.querySelector('.hero');
  var rise = document.querySelectorAll('[data-rise]');
  rise.forEach(function (el) {
    var parent = el.parentNode;
    var sib = Array.prototype.filter.call(parent.children, function (c) { return c.hasAttribute('data-rise'); });
    el.style.setProperty('--i', sib.indexOf(el));
  });
  if (reduce || !('IntersectionObserver' in window)) {
    if (hero) hero.classList.add('in');
    rise.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  requestAnimationFrame(function () { if (hero) hero.classList.add('in'); });
  var rio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  rise.forEach(function (el) {
    rio.observe(el);
    el.addEventListener('transitionend', function () { el.classList.add('is-done'); }, { once: true });
  });
  /* страховка: всё, что уже выше низа экрана, через 2,5 с показываем в любом случае */
  function dopokaz() {
    var low = window.scrollY + window.innerHeight;
    rise.forEach(function (el) {
      if (!el.classList.contains('in') && el.getBoundingClientRect().top + window.scrollY < low) el.classList.add('in');
    });
  }
  setTimeout(dopokaz, 2500);
  setTimeout(chatSrazu, 1200);
  window.addEventListener('scroll', function () { clearTimeout(window.__dopokaz); window.__dopokaz = setTimeout(function () { dopokaz(); chatSrazu(); }, 700); }, { passive: true });
})();
