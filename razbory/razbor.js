/* Общий скрипт разборов, без библиотек. Никуда ничего не отправляет; в памяти вкладки (sessionStorage)
   держит только одно: у какой кнопки подарка открыта подсказка, чтобы она осталась после возврата из PDF.
   1. Липкая строка с названием статьи (строится из <h1 data-korotko="Короткое название">).
   2. Подсказка у кнопки подарка: <a data-dar> внутри .dar или .darm открывает .dar__posle сразу при нажатии;
      текст подсказки один на все статьи (POSLE): для PDF «открывается в этой же вкладке», для остальных «скачивается».
   3. Кнопка «Скопировать»: <button data-kop="#id-текста">.
   4. «Отправить себе»: <button class="dar__sebe" hidden>, показывается, если есть navigator.share или буфер обмена.
   5. Увеличение картинки по нажатию: <a class="uvel" href="полная картинка"> открывается в окне поверх страницы.
   Метку бота из utm_content дописывает встроенный скрипт статьи, здесь этого нет. */
(function () {
  "use strict";
  var ZNAK = '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M8 50 L20 14 L32 50 M13 38 H27" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 50 V14 H56 V50" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="32" r="3.4" fill="#B4452C"/></svg>';

  function skopirovat(tekst) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(tekst);
    return new Promise(function (da, net) {
      var t = document.createElement("textarea");
      t.value = tekst; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? da() : net(); } catch (e) { net(e); }
      t.remove();
    });
  }

  // подпись на кнопке меняется на пару секунд и возвращается
  function migni(kn, tekst) {
    if (!kn.dataset.bylo) kn.dataset.bylo = kn.textContent;
    kn.textContent = tekst; kn.classList.add("ok");
    clearTimeout(kn._t);
    kn._t = setTimeout(function () { kn.textContent = kn.dataset.bylo; kn.classList.remove("ok"); }, 2500);
  }

  function lipkaya() {
    var h1 = document.querySelector("main h1[data-korotko]");
    if (!h1 || !("IntersectionObserver" in window)) return;
    var d = document.createElement("div");
    d.className = "lipkaya";
    var n = document.createElement("a");
    n.className = "lipkaya__n"; n.href = "#verh"; n.innerHTML = ZNAK;
    n.setAttribute("aria-label", "К началу: " + h1.dataset.korotko);
    var s = document.createElement("span"); s.textContent = h1.dataset.korotko; n.appendChild(s);
    n.addEventListener("click", function (e) {
      e.preventDefault();
      var tiho = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
      window.scrollTo({ top: 0, behavior: tiho ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    });
    d.appendChild(n);
    if (document.getElementById("zakaz")) {
      var z = document.createElement("a");
      z.className = "lipkaya__z"; z.href = "#zakaz"; z.textContent = "Сделать за меня";
      d.appendChild(z);
    }
    document.body.appendChild(d);
    function vidna(da) {
      d.classList.toggle("vidna", da);
      // пока строка спрятана, её ссылки не должны ловить Tab
      if (da) d.removeAttribute("inert"); else d.setAttribute("inert", "");
    }
    vidna(false);
    new IntersectionObserver(function (z) {
      var e = z[0];
      // H1 вне экрана и остался выше: показываем
      vidna(!e.isIntersecting && e.boundingClientRect.bottom <= 0);
    }).observe(h1);
  }

  // подсказка у кнопок подарка. Текст один на все статьи и зависит от того, что делает кнопка:
  // PDF открывается в этой же вкладке (у ссылки нет download), остальные файлы скачиваются
  var POSLE = {
    pdf: "PDF открывается в этой же вкладке, вернуться к статье: кнопка «Назад». Если файл скачался, он в загрузках. Ничего не произошло? Откройте эту страницу в обычном браузере: меню с тремя точками, пункт «Открыть в браузере».",
    fayl: "Файл скачивается, ищите его в загрузках. Не скачался? Откройте эту страницу в обычном браузере: меню с тремя точками, пункт «Открыть в браузере»."
  };
  var KLYUCH = "razbor-podskazka:" + location.pathname;

  function pokazat(a) {
    var blok = a.closest(".dar, .darm");
    var p = blok && blok.querySelector(".dar__posle");
    if (!p) return;
    var vid = a.hasAttribute("download") ? "fayl" : (a.getAttribute("data-dar") === "pdf" ? "pdf" : "fayl");
    p.textContent = POSLE[vid];
    p.hidden = false;
  }

  function podarki() {
    var vse = [].slice.call(document.querySelectorAll("a[data-dar]"));
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-dar]");
      if (!a) return;
      // подсказка появляется сразу, до ухода на файл
      pokazat(a);
      // и запоминается до закрытия вкладки: если браузер по кнопке «Назад» загрузит страницу заново, подсказка вернётся
      try { sessionStorage.setItem(KLYUCH, String(vse.indexOf(a))); } catch (err) {}
    });
    try {
      var n = sessionStorage.getItem(KLYUCH);
      if (n !== null && vse[+n]) pokazat(vse[+n]);
    } catch (err) {}
  }

  // увеличение картинки по нажатию: <a class="uvel" href="полная картинка">
  function uvelichenie() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a.uvel");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var mal = a.querySelector("img");
      var o = document.createElement("div");
      o.className = "uvel-okno";
      o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Картинка крупно");
      var v = document.createElement("div"); v.className = "uvel-okno__v";
      var t = document.createElement("span"); t.textContent = "Двигайте картинку пальцем";
      var x = document.createElement("button"); x.type = "button"; x.className = "uvel-okno__x"; x.textContent = "Закрыть";
      v.appendChild(t); v.appendChild(x);
      var pole = document.createElement("div"); pole.className = "uvel-okno__p";
      var im = document.createElement("img");
      im.src = a.getAttribute("href"); im.alt = mal ? mal.alt : "";
      if (mal && mal.getAttribute("width")) { im.width = mal.getAttribute("width"); im.height = mal.getAttribute("height"); }
      pole.appendChild(im);
      o.appendChild(v); o.appendChild(pole);
      function zakryt() {
        o.remove(); document.body.classList.remove("uvel-otkryto");
        document.removeEventListener("keydown", klav);
        a.focus({ preventScroll: true });
      }
      function klav(ev) { if (ev.key === "Escape") zakryt(); }
      x.addEventListener("click", zakryt);
      pole.addEventListener("click", function (ev) { if (ev.target === pole) zakryt(); });
      document.addEventListener("keydown", klav);
      document.body.appendChild(o); document.body.classList.add("uvel-otkryto");
      // на компьютере картинка помещается целиком, двигать нечего
      if (pole.scrollWidth <= pole.clientWidth + 2) t.textContent = "";
      x.focus();
    });
  }

  function kopii() {
    document.addEventListener("click", function (e) {
      var kn = e.target.closest && e.target.closest("button[data-kop]");
      if (!kn) return;
      var el = document.querySelector(kn.getAttribute("data-kop"));
      if (!el) return;
      // текст в <pre> (готовый запрос) копируем как есть, со строками; обычный абзац одной строкой
      var tekst = el.tagName === "PRE" ? el.textContent.trim() : el.textContent.replace(/\s+/g, " ").trim();
      skopirovat(tekst).then(
        function () {
          migni(kn, "Скопировано");
          // кнопка в компактной карточке подарка: под ней открывается подсказка, что делать дальше
          var k = kn.closest(".darm"), p = k && k.querySelector(".dar__posle");
          if (p) p.hidden = false;
        },
        function () { migni(kn, "Выделите текст и скопируйте"); }
      );
    });
  }

  function sebe() {
    var mozhnoShare = typeof navigator.share === "function";
    var mozhnoKop = !!(navigator.clipboard && window.isSecureContext) || !!document.queryCommandSupported;
    [].forEach.call(document.querySelectorAll("button.dar__sebe"), function (kn) {
      if (!mozhnoShare && !mozhnoKop) return;
      kn.hidden = false;
      kn.addEventListener("click", function () {
        var blok = kn.closest("[id]");
        var url = location.origin + location.pathname + (blok ? "#" + blok.id : "");
        var zag = (blok && blok.querySelector("h2") || document.querySelector("h1") || {}).textContent || document.title;
        if (mozhnoShare) {
          navigator.share({ title: zag, url: url }).catch(function (err) {
            // человек сам закрыл окно: ничего не делаем; иначе копируем ссылку
            if (err && err.name === "AbortError") return;
            skopirovat(url).then(function () { migni(kn, "Ссылка скопирована"); }, function () {});
          });
        } else {
          skopirovat(url).then(function () { migni(kn, "Ссылка скопирована"); }, function () { migni(kn, "Не получилось, скопируйте адрес страницы"); });
        }
      });
    });
  }

  function start() { lipkaya(); podarki(); kopii(); sebe(); uvelichenie(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* 6. С 26.11.2026. Пин ведёт не на начало статьи, а в раздел по якорю. Для такого входа:
   под заголовком раздела строка «Вы в разборе «…». <Подарок>, бесплатно ↓» (↑, если подарок выше) со ссылкой на подарок;
   в липкой строке (всегда) ссылка на подарок рядом с «Сделать за меня».
   Данные берутся с <main>: data-razbor="Название статьи", data-podarok="Что за подарок",
   data-podarok-korotko="Одно слово для липкой строки", data-podarok-yakor="id блока подарка".
   Нет data-podarok-yakor или такого id на странице: ничего не добавляется. Никуда ничего не отправляет. */
(function () {
  "use strict";
  function gdeYa() {
    var m = document.querySelector("main[data-podarok-yakor]");
    if (!m) return;
    var yak = m.getAttribute("data-podarok-yakor");
    var dar = yak && document.getElementById(yak);
    if (!dar) return;
    var podarok = m.getAttribute("data-podarok") || "";
    var korotko = m.getAttribute("data-podarok-korotko") || podarok;
    var razbor = m.getAttribute("data-razbor") || "";

    // ссылка на подарок в липкой строке, перед «Сделать за меня»
    var l = document.querySelector(".lipkaya");
    if (l && korotko && !l.querySelector(".lipkaya__dar")) {
      var a = document.createElement("a");
      a.className = "lipkaya__dar"; a.href = "#" + yak; a.textContent = korotko;
      if (podarok) a.setAttribute("aria-label", podarok + ", бесплатно");
      l.insertBefore(a, l.querySelector(".lipkaya__z"));
    }

    // строка «где я»: только если адрес с якорем и якорь в середине статьи
    var h = location.hash.slice(1);
    if (!h || !podarok) return;
    try { h = decodeURIComponent(h); } catch (e) {}
    var cel = document.getElementById(h);
    if (!cel || !m.contains(cel) || cel === m) return;
    // сам подарок, первый экран, заказ и блоки в конце: строка не нужна
    if (dar.contains(cel) || cel.closest(".dar, .darm, .otvet, .order, .eshche, .faq")) return;
    // якорь выше карточки подарка в начале статьи: человек и так видит полосу подарка
    var nachalo = m.querySelector(".darm") || m.querySelector(".st__dar");
    if (nachalo && (cel.compareDocumentPosition(nachalo) & 4)) return;

    var vLi = cel.tagName === "LI";
    var s = document.createElement(vLi ? "span" : "p");
    s.className = "gde-ya";
    if (razbor) s.appendChild(document.createTextNode("Вы в разборе «" + razbor + "». "));
    // стрелка туда, где подарок: ниже раздела или уже выше; перед стрелкой неразрывный пробел
    var vyshe = cel.compareDocumentPosition(dar) & 2;
    var ss = document.createElement("a");
    ss.href = "#" + yak; ss.textContent = podarok + ", бесплатно\u00a0" + (vyshe ? "↑" : "↓");
    s.appendChild(ss);
    if (vLi) { cel.appendChild(s); return; }
    // под заголовком раздела; если якорь на блоке, под его первым заголовком; если на абзаце, под абзацем
    var zag = /^(H2|H3|P)$/.test(cel.tagName) ? cel : (cel.querySelector("h2, h3") || cel);
    zag.insertAdjacentElement("afterend", s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gdeYa); else gdeYa();
})();
