/* Fitur bersama: tema, hamburger, navbar, ripple, toast */
(function () {
    var root = document.documentElement;
    var $ = function (id) { return document.getElementById(id); };

    // --- Tema (tersimpan) ---
    try {
        var t = localStorage.getItem("kwh-theme");
        if (t) root.dataset.theme = t;
    } catch (e) { }
    var themeBtn = $("theme");
    if (themeBtn) themeBtn.addEventListener("click", function () {
        var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
        root.dataset.theme = dark ? "light" : "dark";
        try { localStorage.setItem("kwh-theme", root.dataset.theme); } catch (e) { }
    });

    // --- Hamburger ---
    var burger = $("burger"), menu = $("menu"), scrim = $("scrim");
    function setMenu(open) {
        if (!burger || !menu) return;
        menu.classList.toggle("open", open);
        scrim.classList.toggle("show", open);
        burger.setAttribute("aria-expanded", open);
        burger.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
        document.body.classList.toggle("lock", open);
    }
    if (burger) {
        burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
        scrim.addEventListener("click", function () { setMenu(false); });
        menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
        matchMedia("(min-width:761px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
    }

    // --- Bayangan navbar saat scroll ---
    var nav = document.querySelector(".nav");
    function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // --- Efek ripple di tombol ---
    document.addEventListener("click", function (e) {
        var b = e.target.closest(".btn");
        if (!b || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
        var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement("span");
        d.className = "ripple";
        d.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
        b.appendChild(d);
        setTimeout(function () { d.remove(); }, 650);
    });

    // --- Toast ---
    window.toast = function (msg) {
        var e = $("toast"); if (!e) return;
        e.textContent = msg; e.classList.add("show");
        clearTimeout(e._t); e._t = setTimeout(function () { e.classList.remove("show"); }, 1800);
    };
})();