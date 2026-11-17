/* Общий скрипт разборов, без библиотек. Ничего не сохраняет и никуда не отправляет.
   1. Липкая строка с названием статьи (строится из <h1 data-korotko="Короткое название">).
   2. Подсказка после нажатия на кнопку подарка: <a data-dar> внутри .dar или .darm открывает .dar__posle.
   3. Кнопка «Скопировать»: <button data-kop="#id-текста">.
   4. «Отправить себе»: <button class="dar__sebe" hidden>, показывается, если есть navigator.share или буфер обмена.
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

  function podarki() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-dar]");
      if (!a) return;
      var blok = a.closest(".dar, .darm");
      var p = blok && blok.querySelector(".dar__posle");
      if (p) p.hidden = false;
    });
    // вернулись кнопкой «назад» из открытого PDF: подсказка остаётся на месте (страница из кэша), делать ничего не нужно
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

  function start() { lipkaya(); podarki(); kopii(); sebe(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
