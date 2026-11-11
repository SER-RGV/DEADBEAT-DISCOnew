/* Preview aislada: usa DD_ASSETS y DD_CINE reales, sin crear una run o un HUB ficticio. */
(function () {
  "use strict";
  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d");
  const stage = document.getElementById("stage");
  const status = document.getElementById("status");
  const replay = document.getElementById("replay");
  const skipButton = document.getElementById("skip");
  const required = ["cine_bg01_city", "cine_bg02_club_exterior", "cine_bg03_entrance", "cine_bg04_main_hall", "cine_bg05_dancefloor", "cine_bg06_hero", "hero_walk_00", "hero_walk_01", "hero_walk_02", "logo_deadbeat_cinematic"];
  let waiting = true, started = false, cancelled = false, last = null;
  const deadline = performance.now() + 15000;
  function finish(message) {
    started = false;
    status.textContent = message || "Intro finalizada. En el juego se entrega el control al Refugio real.";
  }
  function start() {
    waiting = false; cancelled = false; started = true; last = null;
    status.textContent = "Reproduciendo · Escape, espacio o clic para saltar";
    window.DD_CINE.playIntro(function () { finish(); });
    const overlay = document.getElementById("dd-cine-overlay");
    if (overlay && overlay.parentNode !== stage) stage.appendChild(overlay);
  }
  function skip() {
    if (waiting) { waiting = false; cancelled = true; finish("Carga omitida; no se inició ninguna partida."); return; }
    if (!started) return;
    window.DD_CINE.skip();
    finish("Intro saltada. Esta vista no inicia el HUB.");
  }
  replay.addEventListener("click", function () {
    if (started) window.DD_CINE.skip();
    start();
  });
  skipButton.addEventListener("click", skip);
  canvas.addEventListener("click", skip);
  window.addEventListener("keydown", function (ev) {
    if ((ev.code === "Escape" || ev.code === "Space") && waiting) { ev.preventDefault(); skip(); }
  });
  function frame(now) {
    if (waiting && !cancelled) {
      const count = required.filter(id => !!window.DD_ASSETS.get(id)).length;
      status.textContent = "Cargando recursos principales: " + count + "/" + required.length + " · Saltar disponible";
      if (count === required.length || now >= deadline) start();
    }
    if (started) {
      if (last !== null) window.DD_CINE.update((now - last) / 1000, null, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.DD_CINE.renderOverlay(ctx, canvas.width, canvas.height);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
