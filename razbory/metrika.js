/* Яндекс Метрика только с согласия посетителя (152-ФЗ). До нажатия «Хорошо» ничего не грузится с mc.yandex.ru.
   Вебвизор выключен. Выбор хранится в браузере посетителя (localStorage), изменить его можно на странице /privacy/. */
(function () {
  var ID = 114291295; // счётчик «Алёна Прасолова · разборы», создан 17.11.2026
  var KEY = "metrika-soglasie";

  function prochitat() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function zapisat(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function zapustit() {
    if (!ID || window.__metrikaZapushena) return;
    window.__metrikaZapushena = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
    celi();
  }

  // цели: кнопка бота, скачивания, дочитал до кейса и до чек-листа
  function cel(imya) { try { window.ym && window.ym(ID, "reachGoal", imya); } catch (e) {} }
  function celi() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (h.indexOf("max.ru/") >= 0) cel("knopka_bota");
      else if (h.indexOf("t.me/") >= 0) cel("telegram");
      else if (h.indexOf("fayly/") >= 0) cel("skachal");
    }, true);
    if (!("IntersectionObserver" in window)) return;
    [["keys", "doshel_keys"], ["chek-list", "doshel_chek"], ["zakaz", "doshel_zakaz"]].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (!el) return;
      var io = new IntersectionObserver(function (z) {
        if (z[0].isIntersecting) { cel(p[1]); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(el);
    });
  }

  function plashka() {
    var d = document.createElement("div");
    d.className = "soglasie";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-label", "Счётчик посещений");
    d.innerHTML = '<p>Считаю посещения Яндекс Метрикой, без записи экрана. <a href="/privacy/#metrika">Подробнее</a></p>' +
      '<div class="soglasie__k"><button type="button" class="soglasie__da">Хорошо</button>' +
      '<button type="button" class="soglasie__net">Отказаться</button></div>';
    document.body.appendChild(d);
    // пока плашка видна, у body класс и её высота: razbor.css даёт нижнее поле, чтобы плашка не закрывала кнопки и подвал
    function vysota() { document.body.style.setProperty("--soglasie-v", d.offsetHeight + "px"); }
    document.body.classList.add("est-soglasie");
    vysota();
    window.addEventListener("resize", vysota);
    function ubrat() {
      d.remove();
      window.removeEventListener("resize", vysota);
      document.body.classList.remove("est-soglasie");
      document.body.style.removeProperty("--soglasie-v");
    }
    d.querySelector(".soglasie__da").onclick = function () { zapisat("da"); ubrat(); zapustit(); };
    d.querySelector(".soglasie__net").onclick = function () { zapisat("net"); ubrat(); };
  }

  // кнопки на /privacy/: изменить выбор
  window.metrikaVybor = function (v) {
    zapisat(v);
    var s = document.getElementById("metrika-sostoyanie");
    if (s) s.textContent = v === "da" ? "Счётчик включён." : "Счётчик выключен. Если он уже загрузился, перестанет считать после закрытия вкладки.";
    if (v === "da") zapustit();
  };

  function start() {
    var v = prochitat();
    if (v === "da") zapustit();
    else if (v !== "net" && ID) plashka();
    var s = document.getElementById("metrika-sostoyanie");
    if (s) s.textContent = v === "da" ? "Сейчас счётчик включён." : v === "net" ? "Сейчас счётчик выключен." : "Вы ещё не выбирали.";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
