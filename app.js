(() => {
  "use strict";

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const notifs = $("notifs");
  const playBtn = $("playBtn");
  const replayBtn = $("replayBtn");
  const progressBar = $("progressBar");
  const intro = $("intro");
  const controlsEl = $("controls");
  const introTyped = $("introTyped");

  if (!stage || !notifs || !playBtn || !replayBtn || !progressBar || !intro || !controlsEl || !introTyped) {
    console.error("Faltan nodos requeridos del DOM.");
    return;
  }

  /* ---------- Datos ---------- */
  const STATIONS = [
    { name: "Mirador",                  title: "🚲 Bicimetro",   text: "8 espacios disponibles" },
    { name: "Bellavista de La Florida", title: "☕ Café",         text: "20% OFF" },
    { name: "Vicente Valdés",           title: "🛍 Comercios",   text: "4 beneficios disponibles" },
    { name: "Vicuña Mackenna",          title: "🎁 Promo semanal", text: "Beneficio de la semana" },
    { name: "Universidad de Chile",     title: "📚 Bibliometro", text: "Disponible hoy" }
  ];

  const NOTIFS = [
    { name: "🚲 Bicimetro",     detail: "Estación Mirador · 8 espacios disponibles", status: "Disponible ahora", time: "08:00" },
    { name: "☕ Café",           detail: "Bellavista · 20% OFF en cafeterías",       status: "Beneficio activo", time: "08:02" },
    { name: "🛍 Comercios",     detail: "Vicente Valdés · 4 beneficios cerca tuyo", status: "Explorar",         time: "08:05" },
    { name: "🎁 Promo semanal", detail: "Vicuña Mackenna · Promoción especial",     status: "Activo",           time: "08:08" },
    { name: "📚 Bibliometro",   detail: "Universidad de Chile · Libros para retiro", status: "Disponible hoy",   time: "08:12" }
  ];

  /* ---------- Preload ---------- */
  const PRELOAD_IMAGES = ["assets/outside.png", "assets/App.png", "assets/redmetro.png"];
  const PRELOAD_AUDIOS = ["assets/typing.m4a", "assets/click.wav", "assets/notification.wav", "assets/1.mp3"];

  const preloadImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ src, ok: true });
    img.onerror = () => resolve({ src, ok: false });
    img.src = src;
  });

  const preloadAudio = (src) => new Promise((resolve) => {
    const a = new Audio();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve({ src, ok });
    };
    a.preload = "auto";
    a.addEventListener("canplaythrough", () => finish(true), { once: true });
    a.addEventListener("loadedmetadata", () => finish(true), { once: true });
    a.addEventListener("error", () => finish(false), { once: true });
    a.src = src;
    a.load();
    setTimeout(() => finish(false), 3000);
  });

  async function preloadAssets() {
    const results = await Promise.all([
      ...PRELOAD_IMAGES.map(preloadImage),
      ...PRELOAD_AUDIOS.map(preloadAudio)
    ]);
    const failed = results.filter((r) => !r.ok).map((r) => r.src);
    if (failed.length) console.warn("Assets con posible fallo de carga:", failed);
  }

  /* ---------- Audio ---------- */
  const MUSIC_VOLUME = 0.35;
  let audioUnlocked = false;
  let musicStarted = false;

  const typingSound = new Audio("assets/typing.m4a");
  typingSound.preload = "auto";
  typingSound.loop = true;
  typingSound.volume = 0.75;

  const notifSound = new Audio("assets/notification.wav");
  notifSound.preload = "auto";
  notifSound.volume = 0.5;

  const clickSound = new Audio("assets/click.wav");
  clickSound.preload = "auto";
  clickSound.volume = 0.6;

  const music = new Audio("assets/1.mp3");
  music.preload = "auto";
  music.loop = true;
  music.volume = MUSIC_VOLUME;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    [notifSound, clickSound, typingSound].forEach((a) => {
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    });
  }

  function playOnce(a) {
    if (!audioUnlocked) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  function startTyping() {
    if (!audioUnlocked) return;
    typingSound.currentTime = 0;
    typingSound.play().catch(() => {});
  }
  function stopTyping() {
    typingSound.pause();
    typingSound.currentTime = 0;
  }

  function startMusic() {
    if (!audioUnlocked || musicStarted) return;
    musicStarted = true;
    music.currentTime = 0;
    music.volume = MUSIC_VOLUME;
    music.play().catch(() => {});
  }
  function stopMusic() {
    music.pause();
    music.currentTime = 0;
    music.volume = MUSIC_VOLUME;
    musicStarted = false;
  }
  const musicFade = { v: MUSIC_VOLUME };

  /* ---------- Escena (se crea una sola vez dentro de #stage) ---------- */
  const stationsHtml = STATIONS.map((s, i) => `
    <div class="st-row" data-i="${i}">
      <div class="st-node${i === STATIONS.length - 1 ? " terminal" : ""}"></div>
      <div class="st-info">
        <div class="st-name">${s.name}</div>
        <div class="st-benefit"><strong>${s.title}</strong><span>${s.text}</span></div>
      </div>
    </div>`).join("");

  const scene = document.createElement("div");
  scene.id = "scene";
  scene.innerHTML = `
    <div class="sc-map" aria-hidden="true"></div>

    <div class="sc-slide" id="slideKpi">
      <div class="kpi-number">2,5 millones</div>
      <div class="kpi-sub">de pasajeros cada día</div>
    </div>

    <div class="sc-slide" id="slideJourney">
      <div class="journey">
        <div class="j-line" id="jLine"></div>
        <div class="j-traveler" id="jTraveler"></div>
        ${stationsHtml}
      </div>
    </div>

    <div class="sc-slide" id="slideEnd">
      <div class="end-brand">Metro MUV</div>
      <div class="end-sub">Beneficios para cada trayecto</div>
      <div class="end-pill">Muévete · Descubre · Disfruta</div>
      <a class="end-download" href="assets/Propuesta_Club_Metro.pdf" target="_blank" rel="noopener">
        Descargar propuesta ejecutiva
      </a>
    </div>
  `;
  stage.insertBefore(scene, notifs);

  /* ---------- Notificaciones (una a la vez) ---------- */
  function clearNotifs(animated = true) {
    const items = [...notifs.children];
    if (!items.length) return;
    if (!animated) {
      gsap.killTweensOf(items);
      notifs.innerHTML = "";
      return;
    }
    items.forEach((el) => {
      gsap.to(el, { opacity: 0, y: 12, duration: 0.25, onComplete: () => el.remove() });
    });
  }

  function showNotif({ name = "", detail = "", status = "", time = "ahora", actions = false }) {
    clearNotifs(true);
    playOnce(notifSound);

    const el = document.createElement("div");
    el.className = "notif";
    el.innerHTML = `
      <img class="notif-icon" src="assets/App.png" alt="">
      <div class="notif-body">
        <div class="notif-top"><span>Club Metro</span><span>${time}</span></div>
        <div class="notif-name">${name}</div>
        ${detail ? `<div class="notif-detail">${detail}</div>` : ""}
        ${status ? `<div class="notif-status">${status}</div>` : ""}
        ${actions ? `
          <div class="notif-actions">
            <button type="button" class="act-btn" data-act="pay" tabindex="-1">Pagar</button>
            <button type="button" class="act-btn primary" data-act="redeem" tabindex="-1">Canjear puntos</button>
          </div>` : ""}
      </div>`;
    notifs.appendChild(el);
    gsap.fromTo(el, { opacity: 0, y: 18, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
  }

  function simulateRedeemClick() {
    const redeem = notifs.querySelector('.act-btn[data-act="redeem"]');
    const pay = notifs.querySelector('.act-btn[data-act="pay"]');
    if (!redeem) return;
    playOnce(clickSound);
    redeem.classList.add("selected");
    gsap.fromTo(redeem, { scale: 1 }, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 });
    if (pay) gsap.to(pay, { opacity: 0.35, duration: 0.25 });
  }

  /* ---------- Intro ---------- */
  const INTRO_TEXT = "Outside Co.";
  const typing = { n: 0 };

  const introTl = gsap.timeline({
    paused: true,
    onComplete: () => {
      stopTyping();
      intro.style.display = "none";
      master.play(0);
    }
  });

  introTl
    .fromTo("#introSearch", { opacity: 0, y: 14, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }, 0)
    .call(startTyping, null, 0.45)
    .to(typing, {
      n: INTRO_TEXT.length,
      duration: 1.3,
      ease: "none",
      onUpdate: () => { introTyped.textContent = INTRO_TEXT.slice(0, Math.round(typing.n)); }
    }, 0.45)
    .call(stopTyping, null, 1.8)
    .to("#introGo", { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 }, 1.8)
    .to("#introSearch", { opacity: 0, y: -10, filter: "blur(6px)", duration: 0.4, ease: "power2.in" }, 2.15)
    .fromTo("#introLogo", { opacity: 0, scale: 0.88, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, 2.5)
    .to("#introLogo", { scale: 1.12, duration: 1.0, ease: "none" }, 3.05)
    .to("#introLogo", { opacity: 0, duration: 0.4 }, 3.9)
    .to("#intro", { opacity: 0, duration: 0.35 }, 4.1);

  /* ---------- Timeline principal ---------- */
  const TOPS = [10, 30, 50, 70, 90]; // % del centro de cada fila

  function buildMaster() {
    const tl = gsap.timeline({
      paused: true,
      onStart: startMusic,
      onUpdate: () => { progressBar.style.width = `${(tl.progress() * 100).toFixed(2)}%`; },
      onComplete: () => {
        progressBar.style.width = "100%";
        stopMusic();
        replayBtn.classList.add("show");
      }
    });

    tl.call(startMusic, null, 0.1);

    // KPI
    tl.fromTo("#slideKpi", { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.2)
      .to("#slideKpi", { opacity: 0, scale: 1.08, y: -20, duration: 0.6, ease: "power2.in" }, "+=1.4");

    // Recorrido
    tl.fromTo("#slideJourney", { opacity: 0 }, { opacity: 1, duration: 0.4 }, ">-0.1")
      .fromTo("#jLine", { scaleY: 0 }, { scaleY: 1, duration: 1.0, ease: "power2.out" }, "<");

    STATIONS.forEach((_, i) => {
      const row = `.st-row[data-i="${i}"]`;
      tl.to("#jTraveler", { opacity: 1, duration: 0.01 }, ">")
        .to("#jTraveler", { top: `${TOPS[i]}%`, duration: i === 0 ? 0.01 : 0.7, ease: "power2.inOut" }, ">")
        .fromTo(`${row} .st-node`, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, ">-0.05")
        .fromTo(`${row} .st-name`, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.3 }, "<0.05")
        .fromTo(`${row} .st-benefit`, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.35 }, "<0.1")
        .call(() => showNotif(NOTIFS[i]), null, "<")
        .to({}, { duration: 0.8 }, ">");
    });

    // Puntos y canje
    tl.to(`.st-row[data-i="${STATIONS.length - 1}"] .st-node`, {
       scale: 1.3,
       repeat: 1,
       yoyo: true,
       duration: 0.3
       }, ">")
       .call(() => showNotif({
  name: "⭐ Tienes 3.250 puntos",
  detail: "¿Quieres pagar o canjear?",
  time: "08:16",
  actions: true
}), null, ">")
      .call(simulateRedeemClick, null, "+=1.3")
      .call(() => showNotif({ name: "✅ Canje realizado", detail: "Tus puntos fueron aplicados correctamente", status: "Exitoso", time: "08:16" }), null, "+=0.9")
      .to({}, { duration: 1.4 }, ">")
      .call(() => clearNotifs(true), null, ">")
      .to("#slideJourney", { opacity: 0, duration: 0.6 }, ">+0.2");

    // Cierre (queda visible)
    tl.fromTo("#slideEnd", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }, ">")
      .fromTo(".end-brand", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, "<0.1")
      .fromTo(".end-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.15")
      .fromTo(".end-pill", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.15")
      .fromTo(".end-download", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.15")
      .to({}, { duration: 3.5 }, ">");

    // Fade de música en el último segundo
    const end = tl.duration();
    tl.fromTo(musicFade, { v: MUSIC_VOLUME }, {
      v: 0,
      duration: 1.0,
      ease: "none",
      immediateRender: false,
      onUpdate: () => { music.volume = Math.max(0, musicFade.v); }
    }, end - 1.0);

    return tl;
  }

  const master = buildMaster();

  /* ---------- Reset ---------- */
  function resetAll() {
    clearNotifs(false);
    stopMusic();
    stopTyping();
    musicFade.v = MUSIC_VOLUME;

    introTl.pause(0);
    master.pause(0);

    progressBar.style.width = "0%";
    replayBtn.classList.remove("show");

    intro.style.display = "none";
    intro.style.opacity = "1";
    introTyped.textContent = "";
    typing.n = 0;
    gsap.set(["#introSearch", "#introLogo", "#introGo"], { clearProps: "all" });

    playBtn.disabled = false;
    playBtn.textContent = "▶";
    controlsEl.classList.remove("locked");
  }

  /* ---------- Controles ---------- */
  playBtn.addEventListener("click", () => {
    unlockAudio();
    resetAll();

    playBtn.disabled = true;
    playBtn.textContent = "⏵";
    controlsEl.classList.add("locked");

    intro.style.display = "flex";
    intro.style.opacity = "1";
    introTl.restart(true);
  });

  replayBtn.addEventListener("click", resetAll);

  /* ---------- Boot ---------- */
  resetAll();
  preloadAssets().catch(() => {});
})();
