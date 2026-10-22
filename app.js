(() => {
  const stage = document.getElementById("stage");
  const notifs = document.getElementById("notifs");
  const playBtn = document.getElementById("playBtn");
  const replayBtn = document.getElementById("replayBtn");
  const progressBar = document.getElementById("progressBar");
  const intro = document.getElementById("intro");
  const controlsEl = document.getElementById("controls");
  const introTyped = document.getElementById("introTyped");

  if (!stage || !notifs || !playBtn || !replayBtn || !progressBar || !intro || !controlsEl || !introTyped) {
    console.error("Faltan nodos requeridos del DOM.");
    return;
  }

  /* ---------- Preload ---------- */
  const PRELOAD_IMAGES = ["assets/redmetro.png", "assets/App.png", "assets/outside.png"];
  const PRELOAD_AUDIOS = ["assets/typing.m4a", "assets/click.wav", "assets/notification.wav", "assets/1.mp3"];

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
      const a = new Audio();
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        a.removeEventListener("canplaythrough", onReady);
        a.removeEventListener("loadedmetadata", onMeta);
        a.removeEventListener("error", onErr);
        resolve({ src, ok });
      };
      const onReady = () => finish(true);
      const onMeta = () => finish(true);
      const onErr = () => finish(false);

      a.preload = "auto";
      a.addEventListener("canplaythrough", onReady, { once: true });
      a.addEventListener("loadedmetadata", onMeta, { once: true });
      a.addEventListener("error", onErr, { once: true });
      a.src = src;
      a.load();

      setTimeout(() => finish(false), 3000);
    });
  }

  async function preloadAssets() {
    const results = await Promise.all([
      ...PRELOAD_IMAGES.map(preloadImage),
      ...PRELOAD_AUDIOS.map(preloadAudio)
    ]);
    const failed = results.filter(r => !r.ok);
    if (failed.length) console.warn("Assets con posible fallo:", failed.map(f => f.src));
  }

  /* ---------- Audio ---------- */
  const MUSIC_VOLUME = 0.35;
  let audioUnlocked = false;
  let appMusicStarted = false;

  const typingSound = new Audio("assets/typing.m4a");
  typingSound.preload = "auto";
  typingSound.loop = true;
  typingSound.volume = 0.75;

  const SOUNDS = {
    notif: new Audio("assets/notification.wav"),
    click: new Audio("assets/click.wav"),
    appMusic: new Audio("assets/1.mp3"),
  };

  SOUNDS.notif.preload = "auto";
  SOUNDS.notif.volume = 0.5;
  SOUNDS.click.preload = "auto";
  SOUNDS.click.volume = 0.6;
  SOUNDS.appMusic.preload = "auto";
  SOUNDS.appMusic.loop = true;
  SOUNDS.appMusic.volume = MUSIC_VOLUME;

  function unlockAudioFromUserGesture() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    [SOUNDS.notif, SOUNDS.click, typingSound, SOUNDS.appMusic].forEach((a) => {
      a.play().then(() => {
        a.pause();
        a.currentTime = 0;
      }).catch(() => {});
    });
  }

  const playNotif = () => {
    if (!audioUnlocked) return;
    SOUNDS.notif.currentTime = 0;
    SOUNDS.notif.play().catch(() => {});
  };

  const playClick = () => {
    if (!audioUnlocked) return;
    SOUNDS.click.currentTime = 0;
    SOUNDS.click.play().catch(() => {});
  };

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

  /* ---------- Notifications ---------- */
  const MAX_VISIBLE = 4;

  function showNotif({ name = "", detail = "", status = "", time = "ahora", actions = false }) {
    playNotif();

    const wrap = document.createElement("div");
    wrap.className = "notif-wrap";
    wrap.innerHTML = `
      <div class="notif side-app">
        <img class="left-app-icon" src="assets/App.png" alt="">
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
      { y: 16, opacity: 0, scale: 0.98, filter: "blur(3px)" },
      { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }
    );

    const items = [...notifs.children];
    const last = items.length - 1;
    items.forEach((w, i) => {
      const d = last - i;
      if (d === 0) return;
      if (d >= MAX_VISIBLE) {
        gsap.to(w, { opacity: 0, duration: 0.25, onComplete: () => w.remove() });
      } else {
        gsap.to(w.firstElementChild, {
          scale: 1 - d * 0.04,
          opacity: Math.max(1 - d * 0.18, 0.42),
          duration: 0.3
        });
      }
    });
  }

  function clearNotifs() {
    const items = [...notifs.querySelectorAll(".notif")];
    gsap.to(items, {
      y: -30, opacity: 0, stagger: 0.06, duration: 0.35,
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

  /* ---------- Stage overlay (se monta dentro de #stage, compatible con tu layout) ---------- */
  const overlay = document.createElement("div");
  overlay.id = "metroOverlay";
  overlay.innerHTML = `
    <div class="ov-vignette"></div>
    <div class="ov-orb orb-1"></div>
    <div class="ov-orb orb-2"></div>
    <div class="ov-noise"></div>
    <div class="ov-map" aria-hidden="true"></div>

    <div id="slideA" class="ov-slide">
      <div class="ov-kpi">2,5 millones</div>
      <div class="ov-sub">de pasajeros cada día</div>
    </div>

    <div id="slideB" class="ov-slide">
      <div id="metroSimple">
        <div class="metro-line"></div>
        <div id="metroTraveler"></div>

        <div class="station station-1">
          <div class="node" id="s1-node"></div>
          <div class="label" id="s1-label">Mirador</div>
          <div class="benefit" id="s1-benefit">🚲 Bicimetro disponible</div>
        </div>

        <div class="station station-2">
          <div class="node" id="s2-node"></div>
          <div class="label" id="s2-label">Bellavista de La Florida</div>
          <div class="benefit" id="s2-benefit">☕ Café 20% OFF</div>
        </div>

        <div class="station station-3">
          <div class="node" id="s3-node"></div>
          <div class="label" id="s3-label">Vicente Valdés</div>
          <div class="benefit" id="s3-benefit">🛍 Comercios asociados</div>
        </div>

        <div class="station station-4">
          <div class="node" id="s4-node"></div>
          <div class="label" id="s4-label">Vicuña Mackenna</div>
          <div class="benefit" id="s4-benefit">🎁 Promo de la semana</div>
        </div>

        <div class="station station-5">
          <div class="node terminal" id="s5-node"></div>
          <div class="label destination" id="s5-label">Universidad de Chile</div>
          <div class="benefit" id="s5-benefit">📚 Bibliometro activo</div>
        </div>
      </div>
    </div>

    <div id="slideC" class="ov-slide">
      <div class="ov-brand">Metro MUV</div>
      <div class="ov-brand-sub">Beneficios para cada trayecto</div>
      <div class="ov-pill">Muévete · Descubre · Disfruta</div>
      <a class="ov-download" href="assets/Propuesta_Club_Metro.pdf" target="_blank" rel="noopener">
        Descargar propuesta ejecutiva
      </a>
    </div>
  `;
  stage.appendChild(overlay);

  const style = document.createElement("style");
  style.textContent = `
    #metroOverlay{
      position:absolute; inset:0; opacity:0; z-index:2; pointer-events:none; overflow:hidden;
    }
    .ov-vignette{position:absolute; inset:0; background:radial-gradient(circle at center, transparent 25%, rgba(0,0,0,.55) 100%); z-index:1;}
    .ov-orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.18;z-index:1;}
    .ov-orb.orb-1{width:340px;height:340px;background:#3e7dff;left:8%;top:8%;}
    .ov-orb.orb-2{width:300px;height:300px;background:#7559ff;right:10%;bottom:10%;}
    .ov-noise{
      position:absolute; inset:0; opacity:.06; z-index:1;
      background-image:radial-gradient(rgba(255,255,255,.7) .6px, transparent .6px);
      background-size:3px 3px;
    }
    .ov-map{
      position:absolute; inset:0; z-index:1; opacity:.17;
      background:url("assets/redmetro.png") center 56%/cover no-repeat;
      filter:grayscale(1) blur(1px) contrast(.92);
      transform:scale(1.05);
      mask-image:radial-gradient(circle at center, black 35%, transparent 88%);
      -webkit-mask-image:radial-gradient(circle at center, black 35%, transparent 88%);
    }

    .ov-slide{
      position:absolute; inset:0; z-index:3;
      display:flex; align-items:center; justify-content:center; flex-direction:column;
      opacity:0;
    }

    .ov-kpi{
      font-size:clamp(42px,8vw,92px); font-weight:900; line-height:1;
      background:linear-gradient(92deg,#aac2ff 0%,#7de3ff 52%,#fff 100%);
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    }
    .ov-sub{margin-top:10px;font-size:clamp(16px,2.8vw,28px);color:#d6e3ff;}

    #metroSimple{position:relative; width:min(900px,92vw); height:min(74vh,580px);}
    .metro-line{
      position:absolute; left:33%; top:10%; width:8px; height:80%;
      border-radius:999px; background:#ff005c; box-shadow:0 0 24px rgba(255,0,92,.35); opacity:.85;
    }
    #metroTraveler{
      position:absolute; left:calc(33% - 6px); top:10%; width:20px;height:20px;
      border-radius:50%; background:#fff;
      box-shadow:0 0 18px rgba(255,255,255,.8),0 0 26px rgba(255,0,92,.45);
      opacity:0;
    }

    .station{
      position:absolute; left:33%; transform:translateX(-50%);
      width:min(700px,88vw); display:grid; grid-template-columns:24px 1fr; column-gap:16px; align-items:center;
    }
    .station .node{width:16px;height:16px;border-radius:50%;background:#ffd6e7;border:2px solid #fff;transform:scale(.4);opacity:0;}
    .station .node.terminal{background:#c8ffdf;}
    .station .label{font-weight:800;font-size:clamp(15px,2.1vw,22px);opacity:0;transform:translateX(-14px);}
    .station .benefit{grid-column:2/3;margin-top:5px;font-size:clamp(13px,1.6vw,17px);color:#d5def3;opacity:0;transform:translateX(14px);}
    .station-1{top:14%}.station-2{top:30%}.station-3{top:46%}.station-4{top:62%}.station-5{top:78%}

    .ov-brand{
      font-size:clamp(42px,8vw,96px); font-weight:900;
      background:linear-gradient(92deg,#a9c1ff 0%,#7de3ff 52%,#fff 100%);
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    }
    .ov-brand-sub{margin-top:8px;font-size:clamp(16px,2.4vw,28px);color:#d9e4fb;}
    .ov-pill{
      margin-top:16px; padding:10px 18px; border-radius:999px;
      background:rgba(142,168,255,.2); border:1px solid rgba(255,255,255,.2); color:#ecf3ff;
    }
    .ov-download{
      margin-top:16px; text-decoration:none; color:#eff5ff; background:#314a84;
      padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,.25);
      pointer-events:auto;
    }

    @media (max-width:720px){
      .metro-line{left:18%}
      #metroTraveler{left:calc(18% - 6px)}
      .station{left:18%; width:92vw}
    }
  `;
  document.head.appendChild(style);

  /* ---------- Intro timeline ---------- */
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
      duration: 1.25,
      ease: "none",
      onUpdate: () => {
        introTyped.textContent = INTRO_TEXT.slice(0, Math.round(typing.n));
      }
    }, 0.45)
    .call(stopTypingSound, null, 1.75)
    .to("#introGo", { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 }, 1.75)
    .to("#introSearch", { opacity: 0, y: -10, filter: "blur(6px)", duration: 0.45 }, 2.1)
    .fromTo("#introLogo", { opacity: 0, scale: 0.86, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55 }, 2.35)
    .to("#introLogo", { opacity: 0, scale: 1.1, duration: 0.65 }, 3.0)
    .to("#intro", { opacity: 0, duration: 0.3 }, 3.35);

  /* ---------- Metro timeline ---------- */
  gsap.to(".ov-orb.orb-1", { x: 36, y: -22, repeat: -1, yoyo: true, duration: 9, ease: "sine.inOut" });
  gsap.to(".ov-orb.orb-2", { x: -30, y: 18, repeat: -1, yoyo: true, duration: 10, ease: "sine.inOut" });
  gsap.to(".ov-map", { y: 4, repeat: -1, yoyo: true, duration: 9.5, ease: "sine.inOut" });

  function stationStep(tl, i, topPct, notif) {
    const node = `#s${i}-node`;
    const label = `#s${i}-label`;
    const benefit = `#s${i}-benefit`;
    tl.to("#metroTraveler", { opacity: 1, duration: 0.15 }, "<")
      .to("#metroTraveler", { top: `${topPct}%`, duration: 0.55, ease: "power2.inOut" })
      .fromTo(node, { opacity: 0, scale: 0.45 }, { opacity: 1, scale: 1, duration: 0.24 }, "<0.08")
      .fromTo(label, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.22 }, "<0.02")
      .fromTo(benefit, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.28 }, "<0.06")
      .call(() => showNotif(notif), null, ">-0.02");
  }

  function buildMetroTimeline() {
    const tl = gsap.timeline();
    tl.to("#metroOverlay", { opacity: 1, duration: 0.6 }, 0);

    tl.fromTo("#slideA", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.65 }, 0.1)
      .to("#slideA", { opacity: 0, scale: 1.08, duration: 0.6 }, "+=1.0");

    tl.fromTo("#slideB", { opacity: 0 }, { opacity: 1, duration: 0.35 }, ">-0.1")
      .fromTo(".metro-line", { height: "0%" }, { height: "80%", duration: 1.2, ease: "power2.out" }, "<");

    stationStep(tl, 1, 14, { name: "🚲 Bicimetro", detail: "Mirador · 8 espacios disponibles", status: "Disponible ahora", time: "08:00" });
    stationStep(tl, 2, 30, { name: "☕ Café", detail: "Bellavista · 20% OFF", status: "Beneficio activo", time: "08:02" });
    stationStep(tl, 3, 46, { name: "🛍 Comercios", detail: "Vicente Valdés · 4 beneficios", status: "Explorar", time: "08:05" });
    stationStep(tl, 4, 62, { name: "🎁 Promo semanal", detail: "Vicuña Mackenna", status: "Activo", time: "08:08" });
    stationStep(tl, 5, 78, { name: "📚 Bibliometro", detail: "Universidad de Chile", status: "Disponible hoy", time: "08:12" });

    tl.to("#s5-node", { scale: 1.25, repeat: 1, yoyo: true, duration: 0.3 })
      .call(() => showNotif({ name: "⭐ Tienes 3.250 puntos", detail: "¿Pagar o canjear?", actions: true, time: "08:16" }))
      .call(simulateRedeemClick, null, "+=0.7")
      .call(() => showNotif({ name: "✅ Canje realizado", detail: "Tus puntos fueron aplicados", status: "Exitoso", time: "08:17" }), null, "+=0.45")
      .to("#slideB", { opacity: 0, duration: 0.6 }, "+=1.0");

    tl.fromTo("#slideC", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.7 }, ">")
      .fromTo(".ov-brand", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.08")
      .fromTo(".ov-brand-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.08")
      .fromTo(".ov-pill", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 }, "<0.12")
      .fromTo(".ov-download", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, "<0.1")
      .call(clearNotifs, null, "+=1.2")
      .to("#metroOverlay", { opacity: 0, duration: 0.8 }, "+=2.2");

    return tl;
  }

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

  master.add(buildMetroTimeline(), 0);
  master.fromTo(
    SOUNDS.appMusic,
    { volume: MUSIC_VOLUME },
    { volume: 0, duration: 1.0, ease: "none", immediateRender: false },
    () => Math.max(0, master.duration() - 1.0)
  );

  function hardReset() {
    notifs.innerHTML = "";
    stopAppMusic();
    stopTypingSound();
    progressBar.style.width = "0%";

    gsap.set([
      "#metroOverlay", "#slideA", "#slideB", "#slideC",
      ".metro-line", "#metroTraveler",
      "#s1-node","#s2-node","#s3-node","#s4-node","#s5-node",
      "#s1-label","#s2-label","#s3-label","#s4-label","#s5-label",
      "#s1-benefit","#s2-benefit","#s3-benefit","#s4-benefit","#s5-benefit"
    ], { clearProps: "all" });

    gsap.set("#metroOverlay", { opacity: 0 });
    gsap.set(".metro-line", { height: "0%" });
    gsap.set("#metroTraveler", { opacity: 0, top: "10%" });
    gsap.set("#slideA, #slideB, #slideC", { opacity: 0 });

    intro.style.display = "none";
    intro.style.opacity = "1";
    introTyped.textContent = "";
    typing.n = 0;

    master.pause(0);
    introTl.pause(0);

    playBtn.disabled = false;
    playBtn.textContent = "▶";
    controlsEl.style.pointerEvents = "auto";
    controlsEl.style.opacity = "1";
    replayBtn.classList.remove("show");
  }

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
    hardReset();
  });

  (async function boot() {
    hardReset();
    preloadAssets().catch(() => {});
    playBtn.textContent = "▶";
    playBtn.disabled = false;
  })();
})();
