(() => {
  // ---------- Guards ----------
  const notifs = document.getElementById("notifs");
  const playBtn = document.getElementById("playBtn");
  const replayBtn = document.getElementById("replayBtn");
  const progressBar = document.getElementById("progressBar");
  const intro = document.getElementById("intro");
  const controlsEl = document.getElementById("controls");
  const introTyped = document.getElementById("introTyped");

  if (!notifs || !playBtn || !replayBtn || !progressBar || !intro || !controlsEl || !introTyped) {
    console.error("Faltan nodos requeridos del DOM.");
    return;
  }

  // ---------- Preload ----------
  const PRELOAD_IMAGES = [
    "assets/redmetro.png",
    "assets/App.png"
  ];
  const PRELOAD_AUDIOS = [
    "assets/typing.m4a",
    "assets/click.wav",
    "assets/notification.wav",
    "assets/1.mp3"
  ];

  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ src, ok: true });
      img.onerror = () => resolve({ src, ok: false });
      img.src = src;
    });
  }

  function preloadAudio(src) {
    return new Promise((resolve) => {
      const audio = new Audio();
      let done = false;

      const finish = (ok) => {
        if (done) return;
        done = true;
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("loadedmetadata", onMeta);
        audio.removeEventListener("error", onError);
        resolve({ src, ok });
      };

      const onReady = () => finish(true);
      const onMeta = () => finish(true);
      const onError = () => finish(false);

      audio.preload = "auto";
      audio.addEventListener("canplaythrough", onReady, { once: true });
      audio.addEventListener("loadedmetadata", onMeta, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = src;
      audio.load();

      setTimeout(() => finish(false), 3000);
    });
  }

  async function preloadAssets() {
    const results = await Promise.all([
      ...PRELOAD_IMAGES.map(preloadImage),
      ...PRELOAD_AUDIOS.map(preloadAudio)
    ]);
    const failed = results.filter(r => !r.ok);
    if (failed.length) {
      console.warn("Assets con posible fallo de carga:", failed.map(f => f.src));
    }
  }

  // ---------- Audio ----------
  const MUSIC_VOLUME = 0.35;
  let audioUnlocked = false;
  let appMusicStarted = false;

  const typingSound = new Audio("assets/typing.m4a");
  typingSound.preload = "auto";
  typingSound.volume = 0.75;
  typingSound.loop = true;

  const SOUNDS = {
    notif: new Audio("assets/notification.wav"),
    appMusic: new Audio("assets/1.mp3"),
    click: new Audio("assets/click.wav")
  };
  SOUNDS.notif.preload = "auto";
  SOUNDS.notif.volume = 0.5;
  SOUNDS.appMusic.preload = "auto";
  SOUNDS.appMusic.volume = MUSIC_VOLUME;
  SOUNDS.appMusic.loop = true;
  SOUNDS.click.preload = "auto";
  SOUNDS.click.volume = 0.6;

  function unlockAudioFromUserGesture() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    [SOUNDS.notif, SOUNDS.click, SOUNDS.appMusic, typingSound].forEach((a) => {
      a.play().then(() => {
        a.pause();
        a.currentTime = 0;
      }).catch(() => {});
    });
  }

  function playNotif() {
    if (!audioUnlocked) return;
    SOUNDS.notif.currentTime = 0;
    SOUNDS.notif.play().catch(() => {});
  }

  function playClick() {
    if (!audioUnlocked) return;
    SOUNDS.click.currentTime = 0;
    SOUNDS.click.play().catch(() => {});
  }

  function startTypingSound() {
    if (!audioUnlocked) return;
    typingSound.pause();
    typingSound.currentTime = 0;
    typingSound.play().catch(() => {});
  }

  function stopTypingSound() {
    typingSound.pause();
    typingSound.currentTime = 0;
  }

  function startAppMusic() {
    if (!audioUnlocked || appMusicStarted) return;
    appMusicStarted = true;
    SOUNDS.appMusic.currentTime = 0;
    SOUNDS.appMusic.volume = MUSIC_VOLUME;
    SOUNDS.appMusic.play().catch(() => {});
  }

  function stopAppMusic() {
    SOUNDS.appMusic.pause();
    SOUNDS.appMusic.currentTime = 0;
    SOUNDS.appMusic.volume = MUSIC_VOLUME;
    appMusicStarted = false;
  }

  // ---------- Notifications ----------
  const MAX_VISIBLE = 4;

  function showNotif({ name = "", detail = "", status = "", time = "ahora", actions = false }) {
    playNotif();

    const wrap = document.createElement("div");
    wrap.className = "notif-wrap";
    wrap.innerHTML = `
      <div class="notif">
        <img class="left-app-icon" src="assets/App.png" alt="App">
        <div class="body">
          <div class="top"><span>Club Metro</span><span>${time}</span></div>
          <div class="name">${name}</div>
          ${detail ? `<div class="detail">${detail}</div>` : ""}
          ${status ? `<div class="status">${status}</div>` : ""}
          ${actions ? `
            <div class="actions">
              <button class="act-btn" data-act="pay" tabindex="-1">Pagar</button>
              <button class="act-btn primary" data-act="redeem" tabindex="-1">Canjear puntos</button>
            </div>` : ""}
        </div>
      </div>
    `;
    notifs.appendChild(wrap);

    gsap.from(wrap, { height: 0, duration: 0.45, ease: "power2.out" });
    gsap.fromTo(
      wrap.firstElementChild,
      { y: 16, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
    );

    const items = [...notifs.children];
    const lastIndex = items.length - 1;
    items.forEach((w, i) => {
      const d = lastIndex - i;
      if (d === 0) return;
      if (d >= MAX_VISIBLE) {
        gsap.to(w, { opacity: 0, duration: 0.25, onComplete: () => w.remove() });
        return;
      }
      gsap.to(w.firstElementChild, {
        scale: 1 - d * 0.04,
        opacity: Math.max(1 - d * 0.18, 0.42),
        duration: 0.3
      });
    });
  }

  function clearNotifs() {
    const items = [...notifs.querySelectorAll(".notif")];
    gsap.to(items, {
      y: -30,
      opacity: 0,
      stagger: 0.06,
      duration: 0.35,
      onComplete: () => { notifs.innerHTML = ""; }
    });
  }

  function simulateRedeemClick() {
    const redeem = notifs.querySelector('.act-btn[data-act="redeem"]');
    const pay = notifs.querySelector('.act-btn[data-act="pay"]');
    if (!redeem) return;
    playClick();
    redeem.classList.add("selected");
    gsap.fromTo(redeem, { scale: 1 }, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1 });
    if (pay) gsap.to(pay, { opacity: 0.35, duration: 0.25 });
  }

  // ---------- Intro ----------
  const INTRO_TEXT = "Outside Co.";
  const typing = { n: 0 };

  const introTl = gsap.timeline({
    paused: true,
    onComplete: () => {
      stopTypingSound();
      intro.style.display = "none";
      controlsEl.style.pointerEvents = "none";
      master.play(0);
    }
  });

  introTl
    .fromTo("#introSearch", { opacity: 0, y: 14, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.45 }, 0)
    .call(startTypingSound, null, 0.45)
    .to(typing, {
      n: INTRO_TEXT.length,
      duration: 1.3,
      ease: "none",
      onUpdate: () => { introTyped.textContent = INTRO_TEXT.slice(0, Math.round(typing.n)); }
    }, 0.45)
    .call(stopTypingSound, null, 1.85)
    .to("#introGo", { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 }, 1.85)
    .to("#introSearch", { opacity: 0, y: -10, filter: "blur(6px)", duration: 0.45 }, 2.2)
    .fromTo("#introLogo", { opacity: 0, scale: 0.86, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55 }, 2.45)
    .to("#introLogo", { opacity: 0, scale: 1.1, duration: 0.65 }, 3.1)
    .to("#intro", { opacity: 0, duration: 0.3 }, 3.45);

  // ---------- Bridge ----------
  gsap.to(".bridge-orb-1", { x: 28, y: -16, repeat: -1, yoyo: true, duration: 7.5, ease: "sine.inOut" });
  gsap.to(".bridge-orb-2", { x: -24, y: 14, repeat: -1, yoyo: true, duration: 8.5, ease: "sine.inOut" });

  function buildBridgeTimeline() {
    const tl = gsap.timeline();
    tl.fromTo("#bridge-scene", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);

    ["#b1", "#b2", "#b3", "#b4"].forEach((id, i) => {
      tl.fromTo(id, { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.35 }, i === 0 ? 0.08 : ">-0.04")
        .to(id, { opacity: i === 3 ? 1 : 0.35, y: -6, duration: 0.2 }, "+=0.22");
    });

    tl.to("#bridge-scene", { opacity: 0, duration: 0.35 }, "+=0.28");
    return tl;
  }

  // ---------- Metro scene ----------
  gsap.to(".orb-1", { x: 36, y: -22, repeat: -1, yoyo: true, duration: 9, ease: "sine.inOut" });
  gsap.to(".orb-2", { x: -30, y: 18, repeat: -1, yoyo: true, duration: 10, ease: "sine.inOut" });
  gsap.to(".metro-map-bg", { y: 4, repeat: -1, yoyo: true, duration: 9.5, ease: "sine.inOut" });

  function stationStep(tl, i, yPercent, notif) {
    const node = `#s${i}-node`;
    const label = `#s${i}-label`;
    const benefit = `#s${i}-benefit`;

    tl.to("#metroTraveler", { opacity: 1, duration: 0.15 }, "<")
      .to("#metroTraveler", { top: `${yPercent}%`, duration: 0.55, ease: "power2.inOut" })
      .fromTo(node, { opacity: 0, scale: 0.45 }, { opacity: 1, scale: 1, duration: 0.24 }, "<0.08")
      .fromTo(label, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.22 }, "<0.02")
      .fromTo(benefit, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.28 }, "<0.06")
      .call(() => showNotif(notif), null, ">-0.02");
  }

  function buildMetroTimeline() {
    const tl = gsap.timeline();
    tl.to("#metro-scene", { opacity: 1, duration: 0.6 }, 0);

    // KPI
    tl.fromTo("#slideA", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.65 }, 0.15)
      .to("#slideA", { opacity: 0, scale: 1.08, duration: 0.6 }, "+=1.0");

    // Recorrido 5 estaciones
    tl.fromTo("#slideB", { opacity: 0 }, { opacity: 1, duration: 0.4 }, ">-0.1")
      .fromTo(".metro-line", { height: "0%" }, { height: "80%", duration: 1.2, ease: "power2.out" }, "<");

    stationStep(tl, 1, 14, { name: "🚲 Bicimetro", detail: "Mirador · 8 espacios disponibles", status: "Disponible ahora", time: "08:00" });
    stationStep(tl, 2, 30, { name: "☕ Café", detail: "Bellavista · 20% OFF", status: "Beneficio activo", time: "08:02" });
    stationStep(tl, 3, 46, { name: "🛍 Comercios asociados", detail: "Vicente Valdés · 4 beneficios", status: "Explorar", time: "08:05" });
    stationStep(tl, 4, 62, { name: "🎁 Promo semanal", detail: "Vicuña Mackenna", status: "Activo", time: "08:08" });
    stationStep(tl, 5, 78, { name: "📚 Bibliometro", detail: "Universidad de Chile", status: "Disponible hoy", time: "08:12" });

    tl.to("#s5-node", { scale: 1.25, repeat: 1, yoyo: true, duration: 0.3 })
      .call(() => showNotif({ name: "⭐ Tienes 3.250 puntos", detail: "¿Pagar o canjear?", actions: true, time: "08:16" }))
      .call(simulateRedeemClick, null, "+=0.7")
      .call(() => showNotif({ name: "✅ Canje realizado", detail: "Tus puntos fueron aplicados", status: "Exitoso", time: "08:17" }), null, "+=0.45")
      .to("#slideB", { opacity: 0, duration: 0.6 }, "+=1.0");

    // Cierre
    tl.fromTo("#slideC", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.7 }, ">")
      .fromTo("#brandTitle", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.08")
      .fromTo(".brand-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.08")
      .fromTo(".cta-pill", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 }, "<0.12")
      .fromTo(".download-btn", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, "<0.1")
      .call(clearNotifs, null, "+=1.2")
      .to("#metro-scene", { opacity: 0, duration: 0.8 }, "+=2.4");

    return tl;
  }

  // ---------- Master ----------
  const master = gsap.timeline({
    paused: true,
    onStart: () => startAppMusic(),
    onUpdate: () => {
      progressBar.style.width = `${(master.progress() * 100).toFixed(2)}%`;
    },
    onComplete: () => {
      progressBar.style.width = "100%";
      stopAppMusic();
      replayBtn.classList.add("show");
    }
  });

  master.add(buildBridgeTimeline(), 0);
  master.add(buildMetroTimeline(), 2.2);

  // fade out music at end
  master.fromTo(
    SOUNDS.appMusic,
    { volume: MUSIC_VOLUME },
    { volume: 0, duration: 1.0, ease: "none", immediateRender: false },
    () => Math.max(0, master.duration() - 1.0)
  );

  // ---------- Reset ----------
  function hardResetUI() {
    notifs.innerHTML = "";
    stopAppMusic();
    stopTypingSound();
    progressBar.style.width = "0%";

    gsap.set([
      "#intro", "#introSearch", "#introLogo", "#introGo",
      "#bridge-scene", "#bridge-lines", "#b1", "#b2", "#b3", "#b4",
      "#metro-scene", "#slideA", "#slideB", "#slideC",
      ".metro-line", "#metroTraveler",
      "#s1-node", "#s2-node", "#s3-node", "#s4-node", "#s5-node",
      "#s1-label", "#s2-label", "#s3-label", "#s4-label", "#s5-label",
      "#s1-benefit", "#s2-benefit", "#s3-benefit", "#s4-benefit", "#s5-benefit",
      "#brandTitle", ".brand-sub", ".cta-pill", ".download-btn"
    ], { clearProps: "all" });

    // valores base que deben quedar forzados
    gsap.set("#bridge-scene", { opacity: 0 });
    gsap.set("#metro-scene", { opacity: 0 });
    gsap.set(".metro-line", { height: "0%" });
    gsap.set("#metroTraveler", { opacity: 0, top: "10%" });
    gsap.set("#slideA, #slideB, #slideC", { opacity: 0 });

    intro.style.display = "none";
    intro.style.opacity = "1";
    typing.n = 0;
    introTyped.textContent = "";

    master.pause(0);
    introTl.pause(0);

    playBtn.disabled = false;
    playBtn.textContent = "▶";
    controlsEl.style.pointerEvents = "auto";
    controlsEl.style.opacity = "1";
  }

  // ---------- Controls ----------
  playBtn.addEventListener("click", () => {
    unlockAudioFromUserGesture();

    playBtn.disabled = true;
    playBtn.textContent = "⏵";
    controlsEl.style.pointerEvents = "none";

    intro.style.display = "flex";
    intro.style.opacity = "1";
    introTyped.textContent = "";
    typing.n = 0;

    master.pause(0);
    introTl.restart(true);
  });

  replayBtn.addEventListener("click", () => {
    replayBtn.classList.remove("show");
    hardResetUI();
  });

  // ---------- Boot ----------
  (async function boot() {
    hardResetUI();
    preloadAssets().catch(() => {});
    playBtn.disabled = false;
    playBtn.textContent = "▶";
  })();
})();
