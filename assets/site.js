/* ==========================================================================
   PanaLink — comportamiento compartido del sitio
   1. Constelacion animada de fondo (misma identidad que la app).
   2. Reveal al hacer scroll.
   3. Pestanas accesibles (role=tablist) con soporte de teclado y enlace directo.
   ========================================================================== */
(function () {
  "use strict";

  /* -------------------- 1. fondo de constelacion -------------------- */
  var canvas = document.getElementById("sky");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [];

    var build = function () {
      W = canvas.width = innerWidth * dpr;
      H = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      var n = Math.max(24, Math.min(60, Math.round((innerWidth * innerHeight) / 28000)));
      var cores = [];
      for (var k = 0; k < 8; k++) cores.push({ x: Math.random() * W, y: Math.random() * H });
      pts = [];
      for (var i = 0; i < n; i++) {
        var core = cores[i % cores.length];
        var a = Math.random() * Math.PI * 2;
        var r = Math.random() * Math.min(W, H) * 0.22;
        pts.push({
          x: core.x + Math.cos(a) * r,
          y: core.y + Math.sin(a) * r,
          vx: (Math.random() - 0.5) * 0.12 * dpr,
          vy: (Math.random() - 0.5) * 0.12 * dpr,
          r: Math.min(W, H) * 0.0016 * (0.55 + Math.random() * 2.1)
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      var link = Math.min(W, H) * 0.24;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < link) {
            ctx.strokeStyle = "rgba(148,163,184," + (0.09 * (1 - d / link)).toFixed(3) + ")";
            ctx.lineWidth = Math.min(W, H) * 0.0011;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(126,138,153,.36)";
      for (var k = 0; k < pts.length; k++) {
        ctx.beginPath();
        ctx.arc(pts[k].x, pts[k].y, pts[k].r, 0, 6.2832);
        ctx.fill();
      }
    };

    var step = function () {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      draw();
      requestAnimationFrame(step);
    };

    build();
    draw();
    if (!reduce) step();
    var t;
    addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { build(); draw(); }, 180);
    });
  }

  /* -------------------- 2. reveal al hacer scroll -------------------- */
  var revealed = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealed, function (e) { e.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(revealed, function (e) { io.observe(e); });
  }

  /* -------------------- 3. pestanas -------------------- */
  var bars = document.querySelectorAll('[role="tablist"]');
  Array.prototype.forEach.call(bars, function (bar) {
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    var activate = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (history.replaceState) history.replaceState(null, "", "#" + tab.id.replace("tab-", ""));
    };

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { activate(tab, false); });
      tab.addEventListener("keydown", function (ev) {
        var i = tabs.indexOf(tab), n = null;
        if (ev.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (ev.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (ev.key === "Home") n = tabs[0];
        else if (ev.key === "End") n = tabs[tabs.length - 1];
        if (n) { ev.preventDefault(); activate(n, true); }
      });
    });

    // Enlace directo: #app, #equipo, etc. abre la pestana correspondiente.
    var wanted = (location.hash || "").replace("#", "");
    if (wanted) {
      var match = tabs.filter(function (t) { return t.id === "tab-" + wanted; })[0];
      if (match) activate(match, false);
    }
  });
})();
