"use strict";

(() => {
  /* ----------------------------------------------------------
     Referencias al DOM
     ---------------------------------------------------------- */
  const body = document.body;
  const $ = (id) => document.getElementById(id);

  const starsLayer = $("stars");
  const envelope = $("envelope");
  const seal = $("seal");
  const reader = $("reader");
  const scrollEl = $("letterScroll");
  const closeBtn = $("closeBtn");
  const scrollHint = $("scrollHint");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* ----------------------------------------------------------
     1. ESTRELLAS que titilan + estrella fugaz ocasional
     ---------------------------------------------------------- */
  function createStars() {
    // Cantidad proporcional al tamaño de pantalla (máx. 220)
    const count = Math.min(220, Math.round((window.innerWidth * window.innerHeight) / 6500));
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      const big = Math.random() < 0.1;
      const size = big ? rand(2.6, 3.8) : rand(1, 2.2);
      // Más estrellas arriba, menos hacia el horizonte (máx. 72% de alto)
      const top = Math.pow(Math.random(), 1.25) * 72;

      star.className = big ? "star star--big" : "star";
      star.style.cssText =
        `left:${rand(0, 100).toFixed(2)}%;top:${top.toFixed(2)}%;` +
        `width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
        `--dur:${rand(2.5, 6).toFixed(1)}s;--delay:${rand(0, 6).toFixed(1)}s;` +
        `--peak:${rand(0.6, 1).toFixed(2)};`;
      fragment.appendChild(star);
    }
    starsLayer.appendChild(fragment);
  }

  function spawnShootingStar() {
    const s = document.createElement("span");
    s.className = "shooting-star";
    s.style.left = `${rand(5, 65)}%`;
    s.style.top = `${rand(3, 30)}%`;
    s.addEventListener("animationend", () => s.remove());
    starsLayer.appendChild(s);
  }

  function scheduleShootingStars() {
    if (reduceMotion) return;
    setTimeout(() => {
      if (!document.hidden) spawnShootingStar();
      scheduleShootingStars();
    }, rand(8000, 16000));
  }

  /* ----------------------------------------------------------
     2. INTERACCIÓN DEL SOBRE
        Secuencia: sello se desvanece → solapa se abre →
        hoja sube → la carta se despliega
     ---------------------------------------------------------- */
  let state = "closed"; // closed | opening | open | closing
  let timers = [];

  const later = (fn, ms) => timers.push(setTimeout(fn, reduceMotion ? 0 : ms));
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function openEnvelope() {
    if (state !== "closed") return;
    state = "opening";
    clearTimers();

    seal.disabled = true;
    body.classList.add("is-open"); // sello se desvanece + solapa gira

    later(() => body.classList.add("is-lifted"), 1200); // la hoja asoma

    later(() => {
      body.classList.add("is-reading"); // la carta se despliega
      reader.inert = false;
      reader.setAttribute("aria-hidden", "false");
      state = "open";
      updateScrollHint();
      scrollEl.focus({ preventScroll: true });
    }, 1900);
  }

  function closeEnvelope() {
    if (state !== "open") return;
    state = "closing";
    clearTimers();

    reader.inert = true;
    reader.setAttribute("aria-hidden", "true");
    body.classList.remove("is-reading");

    later(() => body.classList.remove("is-lifted"), 700);
    later(() => body.classList.remove("is-open"), 1600);
    later(() => {
      scrollEl.scrollTo({ top: 0, behavior: "instant" });
      seal.disabled = false;
      state = "closed";
    }, 2700);
  }

  // Click o toque en el sobre (el sello también lo activa por propagación)
  envelope.addEventListener("click", openEnvelope);
  closeBtn.addEventListener("click", closeEnvelope);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEnvelope();
  });

  /* ----------------------------------------------------------
     3. Pista "desliza" (solo si la carta es más larga que la hoja)
     ---------------------------------------------------------- */
  function updateScrollHint() {
    const remaining = scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
    scrollHint.classList.toggle("is-visible", remaining > 24);
  }
  scrollEl.addEventListener("scroll", updateScrollHint, { passive: true });
  window.addEventListener("resize", updateScrollHint);

  /* ----------------------------------------------------------
     Inicio
     ---------------------------------------------------------- */
  createStars();
  scheduleShootingStars();
})();