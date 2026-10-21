const notifs = document.getElementById("notifs");
const playBtn = document.getElementById("playBtn");
const replayBtn = document.getElementById("replayBtn");
const progressBar = document.getElementById("progressBar");

/* ---------- Precarga de assets ---------- */
const PRELOAD_IMAGES = [
  "assets/outside.png",
  "assets/wassap.png",
  "assets/Siwa.png",
  "assets/Woki.png",
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
      audio.removeEventListener("error", onError);
      resolve({ src, ok });
    };

    const onReady = () => finish(true);
    const onError = () => finish(false);

    audio.preload = "auto";
    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.src = src;
    audio.load();

    setTimeout(() => finish(true), 2500);
  });
}

async function preloadAssets() {
  const imagePromises = PRELOAD_IMAGES.map(preloadImage);
  const audioPromises = PRELOAD_AUDIOS.map(preloadAudio);
  const results = await Promise.all([...imagePromises, ...audioPromises]);

  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.warn("Assets con posible fallo de carga:", failed.map(f => f.src));
  }
}

/* ---------- Intro ---------- */
const intro = document.getElementById("intro");
const controlsEl = document.getElementById("controls");
const introTyped = document.getElementById("introTyped");

const INTRO_TEXT = "Outside Co.";
const typing = { n: 0 };

const typingSound = new Audio("assets/typing.m4a");
typingSound.preload = "auto";
typingSound.volume = 0.75;
typingSound.loop = true;

function startTypingSound() {
  typingSound.pause();
  typingSound.currentTime = 0;
  typingSound.loop = true;
  typingSound.volume = 0.75;
  typingSound.play().catch((e) => {
    console.warn("typing.m4a bloqueado:", e);
  });
}

function stopTypingSound() {
  typingSound.pause();
  typingSound.currentTime = 0;
}

if (intro) {
  intro.style.display = "none";
  intro.style.opacity = "1";
}
if (controlsEl) {
  controlsEl.style.opacity = "1";
  controlsEl.style.pointerEvents = "auto";
}
if (playBtn) {
  playBtn.disabled = false;
  playBtn.textContent = "▶";
}

const introTl = gsap.timeline({
  paused: true,
  onComplete: () => {
    stopTypingSound();
    if (intro) intro.style.display = "none";
    if (controlsEl) controlsEl.style.pointerEvents = "none";
    master.play(0);
  }
});

introTl
  .fromTo("#introSearch",
    { opacity: 0, y: 14, scale: .94 },
    { opacity: 1, y: 0, scale: 1, duration: .5, ease: "power3.out" }, 0)
  .call(startTypingSound, null, 0.5)
  .to(typing, {
    n: INTRO_TEXT.length,
    duration: 1.6,
    ease: "none",
    onUpdate: () => {
      if (introTyped) introTyped.textContent = INTRO_TEXT.slice(0, Math.round(typing.n));
    }
  }, 0.5)
  .call(stopTypingSound, null, 2.1)
  .to("#introGo", { scale: .9, duration: .12, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.1)
  .to("#introSearch",
    { opacity: 0, scale: 1.06, y: -10, filter: "blur(6px)", duration: .5, ease: "power2.in" }, 2.5)
  .fromTo("#introLogo",
    { opacity: 0, scale: .85, filter: "blur(10px)" },
    { opacity: 1, scale: 1, filter: "blur(0px)", duration: .6, ease: "power3.out" }, 2.9)
  .to("#introLogo", { scale: 1.2, duration: 1, ease: "none" }, 3.5)
  .to("#introLogo", {
    duration: 1.05,
    ease: "none",
    keyframes: [
      { opacity: 1, filter: "drop-shadow(0 0 8px rgba(125,220,255,.65)) brightness(1.22)", duration: .08 },
      { opacity: .22, filter: "drop-shadow(0 0 2px rgba(125,220,255,.22)) brightness(.82)", duration: .05 },
      { opacity: .98, filter: "drop-shadow(0 0 12px rgba(125,220,255,.85)) brightness(1.34)", duration: .08 },
      { opacity: .15, filter: "drop-shadow(0 0 1px rgba(125,220,255,.15)) brightness(.72)", duration: .05 },
      { opacity: .86, filter: "drop-shadow(0 0 9px rgba(125,220,255,.62)) brightness(1.16)", duration: .07 },
      { opacity: .12, filter: "drop-shadow(0 0 0px rgba(125,220,255,0)) brightness(.70)", duration: .05 },
      { opacity: .74, filter: "drop-shadow(0 0 8px rgba(125,220,255,.55)) brightness(1.10)", duration: .07 },
      { opacity: .08, filter: "drop-shadow(0 0 0px rgba(125,220,255,0)) brightness(.66)", duration: .05 },
      { opacity: .64, filter: "drop-shadow(0 0 7px rgba(125,220,255,.45)) brightness(1.02)", duration: .08 },
      { opacity: .05, filter: "drop-shadow(0 0 0px rgba(125,220,255,0)) brightness(.62)", duration: .06 },
      { opacity: .42, filter: "drop-shadow(0 0 5px rgba(125,220,255,.35)) brightness(.92)", duration: .08 },
      { opacity: 0, filter: "drop-shadow(0 0 0px rgba(125,220,255,0)) brightness(.60) blur(1.4px)", duration: .23 }
    ]
  }, 4.5)
  .to("#introLogo", {
    keyframes: [
      { x: 1.5, y: -0.5, rotation: .25, duration: .03 },
      { x: -1.8, y: 0.8, rotation: -.25, duration: .03 },
      { x: 1.2, y: 0.4, rotation: .2, duration: .03 },
      { x: -1.2, y: -0.6, rotation: -.2, duration: .03 },
      { x: 0.8, y: 0.3, rotation: .12, duration: .03 },
      { x: 0, y: 0, rotation: 0, duration: .04 }
    ],
    ease: "none"
  }, 4.58)
  .to("#intro", { opacity: 0, duration: .35, ease: "power2.out" }, 5.35);

/* ---------- Audio ---------- */
const MUSIC_VOLUME = 0.35;
let audioUnlocked = false;
let appMusicStarted = false;

const SOUNDS = {
  whatsapp: new Audio("assets/notification.wav"),
  appMusic: new Audio("assets/1.mp3"),
  click: new Audio("assets/click.wav")
};

SOUNDS.whatsapp.preload = "auto";
SOUNDS.whatsapp.volume = 0.5;
SOUNDS.appMusic.preload = "auto";
SOUNDS.appMusic.volume = MUSIC_VOLUME;
SOUNDS.appMusic.loop = true;
SOUNDS.click.preload = "auto";
SOUNDS.click.volume = 0.6;

function unlockAudioFromUserGesture() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  SOUNDS.whatsapp.play().then(() => {
    SOUNDS.whatsapp.pause();
    SOUNDS.whatsapp.currentTime = 0;
  }).catch(() => {});

  typingSound.load();
  typingSound.play().then(() => {
    typingSound.pause();
    typingSound.currentTime = 0;
  }).catch((e) => {
    console.warn("No se pudo desbloquear typing.wav:", e);
  });

  SOUNDS.click.play().then(() => {
    SOUNDS.click.pause();
    SOUNDS.click.currentTime = 0;
  }).catch(() => {});
}

function playWhatsappNotification() {
  if (!audioUnlocked) return;
  SOUNDS.whatsapp.currentTime = 0;
  SOUNDS.whatsapp.play().catch(() => {});
}

function playClick() {
  if (!audioUnlocked) return;
  SOUNDS.click.currentTime = 0;
  SOUNDS.click.play().catch(() => {});
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

/* ---------- Replay UI ---------- */
function showReplayButton() {
  replayBtn.classList.add("show");
}

function hideReplayButton() {
  replayBtn.classList.remove("show");
}

/* ---------- Notificaciones ---------- */
const MAX_VISIBLE = 4;

function showNotif({
  appIcon = "assets/wassap.png",
  app = "WhatsApp",
  avatar = "",
  name = "",
  text = "",
  detail = "",
  status = "",
  time = "ahora",
  mode = "contact",
  actions = false,
  side = "left",
  silent = false
}) {

  if (mode === "contact") {
    if (!silent) playWhatsappNotification();
  } else {
    startAppMusic();
  }

  const wrap = document.createElement("div");
  wrap.className = "notif-wrap";

  const avatarHtml = `
    <div class="avatar-stack">
      <img class="avatar-img" src="${avatar}" alt="">
      <img class="avatar-app-badge" src="${appIcon}" alt="">
    </div>`;

  const leftVisual =
    mode === "app" ? `<img class="left-app-icon" src="${appIcon}" alt="">` :
    (mode === "contact" && side === "left") ? avatarHtml : "";

  const rightVisual =
    (mode === "contact" && side === "right") ? avatarHtml : "";

  const sideClass = mode === "contact" ? `side-${side}` : "side-app";

  wrap.innerHTML = `
    <div class="notif ${sideClass}">
      ${leftVisual}
      <div class="body">
        <div class="top"><span>${app}</span><span>${time}</span></div>
        <div class="name">${name}</div>
        ${text ? `<div class="msg">${text}</div>` : ""}
        ${detail ? `<div class="detail">${detail}</div>` : ""}
        ${status ? `<div class="status">${status}</div>` : ""}
        ${actions ? `
          <div class="actions">
            <button class="act-btn" data-act="pay" tabindex="-1">Pagar</button>
            <button class="act-btn primary" data-act="redeem" tabindex="-1">Canjear puntos</button>
          </div>` : ""}
      </div>
      ${rightVisual}
    </div>`;

  notifs.appendChild(wrap);

  gsap.from(wrap, {
    height: 0,
    duration: .55,
    ease: "power3.out"
  });

  gsap.fromTo(
    wrap.firstElementChild,
    { y: 18, scale: .98, opacity: 0, filter: "blur(3px)" },
    { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: .55, ease: "power2.out" }
  );

  const items = [...notifs.children];
  const lastIndex = items.length - 1;

  items.forEach((w, i) => {
    const distanceFromNewest = lastIndex - i;
    if (distanceFromNewest === 0) return;

    if (distanceFromNewest >= MAX_VISIBLE) {
      gsap.to(w, {
        opacity: 0,
        duration: .32,
        onComplete: () => w.remove()
      });
      return;
    }

    gsap.to(w.firstElementChild, {
      scale: 1 - distanceFromNewest * .04,
      opacity: Math.max(1 - distanceFromNewest * .18, .42),
      duration: .42,
      ease: "power2.out"
    });
  });
}

function clearNotifs() {
  const items = [...notifs.querySelectorAll(".notif")];
  gsap.to(items, {
    y: -42,
    opacity: 0,
    stagger: .07,
    duration: .45,
    ease: "power2.in",
    onComplete: () => { notifs.innerHTML = ""; }
  });
}

function simulateRedeemClick() {
  const redeem = notifs.querySelector('.act-btn[data-act="redeem"]');
  const pay = notifs.querySelector('.act-btn[data-act="pay"]');
  if (!redeem) return;

  playClick();
  redeem.classList.add("selected");
  gsap.fromTo(redeem, { scale: 1 }, { scale: .92, duration: .1, yoyo: true, repeat: 1, ease: "power1.inOut" });
  if (pay) gsap.to(pay, { opacity: .35, duration: .3 });
}

/* ---------- Datos ---------- */
const MARIA = { avatar: "assets/Siwa.png", name: "María", side: "left" };
const JUAN  = { avatar: "assets/Woki.png", name: "Juan", side: "right" };
const APP = {
  appIcon: "assets/App.png",
  app: "Club Metro"
};

/* ---------- Escena intermedia ---------- */
const bridge = document.createElement("div");
bridge.id = "bridge-scene";
bridge.innerHTML = `
  <div class="bridge-vignette"></div>
  <div class="bridge-orb bridge-orb-1"></div>
  <div class="bridge-orb bridge-orb-2"></div>
  <div class="bridge-noise"></div>


`;
document.body.appendChild(bridge);

const bridgeStyle = document.createElement("style");
bridgeStyle.textContent = `
  #bridge-scene{
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:var(--app-bg); opacity:0; pointer-events:none; z-index:9000; overflow:hidden;
  }
  .bridge-lines{ width:min(920px, 92vw); text-align:center; padding:0 18px; }
  .bridge-line{
    opacity:0; transform:translateY(22px) scale(.95); color:#eef3ff; letter-spacing:.01em; font-weight:800;
    line-height:1.15; margin:10px 0; font-size:clamp(28px, 5.4vw, 68px);
    text-shadow:0 0 8px rgba(125,180,255,.35),0 0 24px rgba(125,180,255,.20),0 10px 28px rgba(0,0,0,.35);
  }
  .bridge-accent{
    background:linear-gradient(92deg,#a7b8ff 0%,#7de3ff 38%,#ffffff 55%,#8db4ff 100%);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
    filter:drop-shadow(0 0 14px rgba(125,220,255,.4));
  }
  .bridge-vignette{
    position:absolute; inset:0; background:radial-gradient(circle at center, transparent 30%, rgba(0,0,0,.52) 100%);
    pointer-events:none;
  }
  .bridge-orb{ position:absolute; border-radius:50%; filter:blur(95px); opacity:.2; pointer-events:none; }
  .bridge-orb-1{ width:360px; height:360px; background:#4f86ff; top:8%; left:8%; }
  .bridge-orb-2{ width:320px; height:320px; background:#7f5dff; right:8%; bottom:8%; }
  .bridge-noise{
    position:absolute; inset:0; opacity:.08;
    background-image:radial-gradient(rgba(255,255,255,.65) .6px, transparent .6px);
    background-size:3px 3px; mix-blend-mode:soft-light; pointer-events:none;
  }
`;
document.head.appendChild(bridgeStyle);

gsap.to(".bridge-orb-1",{x:30,y:-18,repeat:-1,yoyo:true,duration:7.5,ease:"sine.inOut"});
gsap.to(".bridge-orb-2",{x:-26,y:16,repeat:-1,yoyo:true,duration:8.5,ease:"sine.inOut"});

function buildBridgeTimeline() {
  const tl = gsap.timeline();

  tl.fromTo("#bridge-scene",
    { opacity:0, scale:1.02 },
    { opacity:1, scale:1, duration:.35, ease:"power2.out" }, 0);

  tl.fromTo("#b1",
    { opacity:0, y:28, scale:.9, filter:"blur(10px)" },
    { opacity:1, y:0, scale:1.03, filter:"blur(0px)", duration:.38, ease:"power4.out" }, 0.08)
    .to("#b1", { scale:1, duration:.16, ease:"power2.out" }, ">")
    .to("#b1", { opacity:.32, y:-8, duration:.22, ease:"power2.inOut" }, "+=0.28");

  tl.fromTo("#b2",
    { opacity:0, y:28, scale:.9, filter:"blur(10px)" },
    { opacity:1, y:0, scale:1.03, filter:"blur(0px)", duration:.38, ease:"power4.out" }, ">-0.04")
    .to("#b2", { scale:1, duration:.16, ease:"power2.out" }, ">")
    .to("#b2", { opacity:.4, y:-7, duration:.22, ease:"power2.inOut" }, "+=0.26");

  tl.fromTo("#b3",
    { opacity:0, y:28, scale:.9, filter:"blur(10px)" },
    { opacity:1, y:0, scale:1.03, filter:"blur(0px)", duration:.4, ease:"power4.out" }, ">-0.03")
    .to("#b3", { scale:1, duration:.16, ease:"power2.out" }, ">")
    .to("#b3", { opacity:.5, y:-6, duration:.2, ease:"power2.inOut" }, "+=0.22");

  tl.fromTo("#b4",
    { opacity:0, y:36, scale:.88, filter:"blur(12px)" },
    { opacity:1, y:0, scale:1.08, filter:"blur(0px)", duration:.52, ease:"back.out(1.6)" }, ">-0.02")
    .to("#b4", { scale:1, duration:.22, ease:"power3.out" }, ">")
    .to("#b4",
      { textShadow:"0 0 12px rgba(160,220,255,.55), 0 0 34px rgba(125,180,255,.35)", duration:.18, yoyo:true, repeat:2 }, "<")
    .to("#bridge-lines, #bridge-scene",
      { x:1.2, duration:.03, repeat:3, yoyo:true, ease:"none" }, "<0.04")
    .to("#bridge-scene",
      { opacity:0, scale:.985, duration:.38, ease:"power2.inOut" }, "+=0.35");

  return tl;
}

/* ---------- Escena final ---------- */
function splitChars(selector){
  const el = document.querySelector(selector);
  if(!el) return [];
  const text = el.textContent.trim();
  el.textContent = "";
  return [...text].map(ch=>{
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch === " " ? "\u00A0" : ch;
    el.appendChild(span);
    return span;
  });
}

const scene = document.createElement("div");
scene.id = "saas-scene";
scene.innerHTML = `
  <div class="vignette"></div>
  <div class="bg-orb orb-1"></div>
  <div class="bg-orb orb-2"></div>
  <div class="noise"></div>

  <div id="slide1" class="saas-slide">
    <div class="saas-number gradient-text">2,5 millones</div>
    <div class="saas-subtitle">de pasajeros cada día</div>
  </div>

  <div id="slide2" class="saas-slide">
    <div class="saas-word">Movilidad</div>
    <div class="saas-word">Comercio</div>
    <div class="saas-word">Cultura</div>
    <div class="saas-word">Servicios</div>
    <div class="saas-word">Beneficios</div>
  </div>

/* ---------- SLIDE 3 METRO ---------- */

tl.fromTo(
    "#slide3",
    { opacity:0 },
    {
      opacity:1,
      duration:.3
    }
)

.fromTo(
    "#node1",
    {
      opacity:0,
      scale:.4
    },
    {
      opacity:1,
      scale:1,
      duration:.3
    }
)

.to(
    "#track1",
    {
      height:80,
      duration:.45,
      ease:"power2.out"
    }
)

.fromTo(
    "#node2",
    {
      opacity:0,
      scale:.4
    },
    {
      opacity:1,
      scale:1,
      duration:.3
    }
)

.to(
    "#track2",
    {
      height:80,
      duration:.45
    }
)

.fromTo(
    "#node3",
    {
      opacity:0,
      scale:.4
    },
    {
      opacity:1,
      scale:1,
      duration:.3
    }
)

.to(
    "#track3",
    {
      height:80,
      duration:.45
    }
)

.fromTo(
    "#node4",
    {
      opacity:0,
      scale:.4
    },
    {
      opacity:1,
      scale:1,
      duration:.3
    }
)

.to(
    "#track4",
    {
      height:80,
      duration:.45
    }
)

.fromTo(
    "#node5",
    {
      opacity:0,
      scale:.4
    },
    {
      opacity:1,
      scale:1,
      duration:.3
    }
)

.fromTo(
    ".metro-caption",
    {
      opacity:0,
      y:20
    },
    {
      opacity:1,
      y:0,
      duration:.6
    }
)

.to(
    "#slide3",
    {
      opacity:0,
      y:-24,
      duration:.6
    },
    "+=2"
);

  <div id="slide4" class="saas-slide">
    <div class="saas-logo" id="logoMain">Metro MUV</div>
    <div class="saas-logo-sub">Beneficios para cada trayecto</div>
    <div class="cta-pill">Muévete · Descubre · Disfruta</div>
<a
  class="download-btn"
  href="assets/Propuesta_Club_Metro.pdf"
  target="_blank"
>
  Descargar propuesta ejecutiva
</a>
    
  </div>
`;
document.body.appendChild(scene);

const sceneStyle = document.createElement("style");
sceneStyle.textContent = `
  #slide3{ overflow:hidden; }
  #nodesCanvas{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    opacity:0;
    pointer-events:none;
    z-index:0;
  }
  #slide3 .saas-message{
    position:relative;
    z-index:2;
  }
`;
document.head.appendChild(sceneStyle);

const connectedChars = splitChars("#connectedText");
const logoChars = splitChars("#logoMain");



gsap.to(".orb-1",{x:40,y:-25,repeat:-1,yoyo:true,duration:9,ease:"sine.inOut"});
gsap.to(".orb-2",{x:-35,y:20,repeat:-1,yoyo:true,duration:10,ease:"sine.inOut"});

function buildSaaSTimeline(){
  const tl = gsap.timeline();

  tl.to("#stage",
    {scale:1.08, opacity:0, filter:"blur(12px)", y:-20, duration:1.0, ease:"power3.inOut"}, 0);
  tl.fromTo("#saas-scene",
    {opacity:0}, {opacity:1, duration:.75, ease:"power2.out"}, 0);

  tl.addLabel("s1", .6);

  tl.fromTo("#slide1",
      {opacity:0, scale:.58, y:110, filter:"blur(18px)"},
      {opacity:1, scale:1, y:0, filter:"blur(0px)", duration:1.2, ease:"power4.out"}, "s1")
    .fromTo(".saas-number",
      {letterSpacing:"0.22em", textShadow:"0 0 0 rgba(120,190,255,0)"},
      {letterSpacing:"0.02em", textShadow:"0 0 28px rgba(120,190,255,.35)", duration:.9, ease:"power3.out"},
      "<0.08")
    .to("#slide1",
      {opacity:0, scale:1.18, y:-46, filter:"blur(14px)", duration:.85, ease:"power3.in"},
      "+=1.15");

  // Slide 2 (mismo tratamiento para todos)
  tl.fromTo("#slide2", { opacity:0 }, { opacity:1, duration:.33 })
    .fromTo(".saas-word",
      {
        opacity:0,
        x:(i) => (i % 2 === 0 ? -46 : 46),
        y:42,
        scale:.84,
        rotateX:-78,
        filter:"blur(12px)",
        transformOrigin:"50% 100%"
      },
      {
        opacity:1, x:0, y:0, scale:1.04, rotateX:0, filter:"blur(0px)",
        stagger:.14, duration:.65, ease:"power4.out"
      },
      "<")
    .to(".saas-word",
      { scale:1, duration:.2, stagger:.08, ease:"power2.out" },
      "<+.2")
    .to("#slide2",
      { scale:1.025, duration:.3, yoyo:true, repeat:1, ease:"sine.inOut" },
      "<+.1")
    .to(".saas-word",
      { textShadow:"0 0 26px rgba(140,210,255,.55), 0 0 44px rgba(120,180,255,.3)", duration:.24, yoyo:true, repeat:1, stagger:.09, ease:"sine.inOut" },
      "<")
    .to("#slide2",
      { x:1, duration:.05, repeat:3, yoyo:true, ease:"none" },
      "<+.05")
    .to({}, { duration:.8 })
    .to(".saas-word",
      {
        y:-30, opacity:0, scale:.92,
        x:(i) => (i % 2 === 0 ? 24 : -24),
        filter:"blur(9px)", stagger:.08, duration:.45, ease:"power2.in"
      },
      "<")
    .to("#slide2", { opacity:0, duration:.22 }, "<+.15");

  // Slide 3: red de nodos tenue
tl.fromTo(
    "#slide3",
    {opacity:0},
    {
      opacity:1,
      duration:.5
    }
)

.fromTo(
    "#traveler",
    { x:0 },
    {
      x:720,
      duration:4,
      ease:"power1.inOut"
    },
    "<"
)

.call(() => {

    document.getElementById("s1").classList.add("active");

}, null, "<")

.call(() => {

    document.getElementById("s2").classList.add("active");

}, null, "+=0.6")

.call(() => {

    document.getElementById("s3").classList.add("active");

}, null, "+=0.6")

.call(() => {

    document.getElementById("s4").classList.add("active");

}, null, "+=0.6")

.call(() => {

    document.getElementById("s5").classList.add("active");

}, null, "+=0.6")

.call(() => {

    document.getElementById("s6").classList.add("active");

}, null, "+=0.6")

.fromTo(
    ".route-caption",
    {
      opacity:0,
      y:20
    },
    {
      opacity:1,
      y:0,
      duration:.6
    },
    "-=1"
)

.to(
    "#slide3",
    {
      opacity:0,
      y:-24,
      duration:.6
    },
    "+=2"
);
  tl.addLabel("s4", ">");
  tl.fromTo("#slide4",
      {opacity:0, scale:.94},
      {opacity:1, scale:1, duration:.8, ease:"power3.out"}, "s4")
    .fromTo(logoChars,
      {opacity:0, y:16},
      {opacity:1, y:0, stagger:.022, duration:.42, ease:"power2.out"},
      "s4+=.05")
    .fromTo(".saas-logo-sub",
      {opacity:0, y:14},
      {opacity:1, y:0, duration:.45},
      "s4+=.15")
    .fromTo(".cta-pill",
      {opacity:0, y:12, scale:.92},
      {opacity:1, y:0, scale:1, duration:.4, ease:"power2.out"},
      "s4+=.27")
    .fromTo("#slide4",
      {scale:1},
      {scale:1.035, duration:5, ease:"none", force3D:true, immediateRender:false},
      "s4+=.8")
    .to("#saas-scene",
      {opacity:0, duration:1.0, ease:"power2.inOut"},
      "s4+=5.8");

  return tl;
}

/* ---------- Timeline maestro ---------- */
const master = gsap.timeline({
  paused:true,
  onUpdate:()=>{
    progressBar.style.width = `${(master.progress()*100).toFixed(2)}%`;
  },
  onComplete:()=>{
    progressBar.style.width = "100%";
    stopAppMusic();
    showReplayButton();
  }
});

/* ---------- Inicio experiencia Club Metro ---------- */

master.call(() => {
  startAppMusic();
}, null, 0.5);

/* Bridge */
master.add(buildBridgeTimeline(), 0.8);

/* Mirador */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"🚲 Bicimetro",
    detail:"Estación Mirador · 8 espacios disponibles",
    status:"Disponible ahora",
    time:"08:00"
  });
}, null, 5.5);

/* Vicente Valdés */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"☕ Café",
    detail:"20% OFF en cafeterías seleccionadas",
    status:"Vicente Valdés",
    time:"08:02"
  });
}, null, 7.2);

/* Vicuña Mackenna */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"🛍 Comercios asociados",
    detail:"4 beneficios disponibles cerca tuyo",
    status:"Explorar",
    time:"08:05"
  });
}, null, 8.9);

/* Ñuble */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"🎁 Beneficio destacado",
    detail:"Promoción especial de la semana",
    status:"Activo",
    time:"08:08"
  });
}, null, 10.6);

/* Universidad de Chile */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"📚 Bibliometro",
    detail:"Libros disponibles para retiro hoy",
    status:"Universidad de Chile",
    time:"08:12"
  });
}, null, 12.3);

/* Intermodal */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"🚌 Conexión intermodal",
    detail:"Ruta optimizada disponible",
    status:"Continuar viaje",
    time:"08:15"
  });
}, null, 14.0);

/* Puntos */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"⭐ Tienes 3.250 puntos",
    detail:"¿Quieres pagar o canjear?",
    time:"08:16",
    actions:true
  });
}, null, 15.8);

master.call(() => {
  simulateRedeemClick();
}, null, 17.0);

master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"✅ Canje realizado",
    detail:"Tus puntos fueron aplicados correctamente",
    status:"Exitoso",
    time:"08:16"
  });
}, null, 18.2);

/* Cierre operativo */
master.call(() => {
  showNotif({
    ...APP,
    mode:"app",
    name:"🚇 Todo listo",
    detail:"Beneficios disponibles durante tu trayecto",
    status:"Club Metro",
    time:"08:17"
  });
}, null, 19.8);

/* Limpieza */
master.call(() => {
  clearNotifs();
}, null, 23.0);

/* Escena final */
master.add(buildSaaSTimeline(), 24.0);

const END = master.duration();
master.fromTo(SOUNDS.appMusic,
  {volume:MUSIC_VOLUME},
  {volume:0, duration:1.0, ease:"none", immediateRender:false},
  END - 1.0);

/* ---------- Controles ---------- */
playBtn.addEventListener("click", ()=>{
  unlockAudioFromUserGesture();

  playBtn.disabled = true;
  playBtn.textContent = "⏵";
  controlsEl.style.pointerEvents = "none";

  if (intro) {
    intro.style.display = "flex";
    intro.style.opacity = "1";
  }
  if (introTyped) introTyped.textContent = "";
  typing.n = 0;

  master.pause(0);
  introTl.restart(true);
});

replayBtn.addEventListener("click", ()=>{
  hideReplayButton();
  notifs.innerHTML = "";
  stopAppMusic();
  stopTypingSound();
  stopNodesBackground();
  progressBar.style.width = "0%";

  gsap.set("#stage", { clearProps: "all" });
  gsap.set("#saas-scene", { opacity: 0 });
  gsap.set("#bridge-scene", { opacity: 0, scale: 1 });
  gsap.set("#nodesCanvas", { opacity: 0 });
  gsap.set("#b1, #b2, #b3, #b4", { clearProps: "all" });
  gsap.set("#bridge-lines", { clearProps: "all" });
  gsap.set("#introSearch", { clearProps: "all" });
  gsap.set("#introLogo", { clearProps: "all" });
  gsap.set("#introGo", { clearProps: "all" });

  if (intro) {
    intro.style.display = "none";
    intro.style.opacity = "1";
  }

  master.pause(0);
  introTl.pause(0);

  playBtn.disabled = false;
  playBtn.textContent = "▶";
  controlsEl.style.opacity = "1";
  controlsEl.style.pointerEvents = "auto";
});

/* ---------- Boot ---------- */
(async function boot() {

  preloadAssets().catch(() => {});

  if (playBtn) {
    playBtn.disabled = false;
    playBtn.textContent = "▶";
  }

})();
