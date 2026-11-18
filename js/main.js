(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lanterns ---------- */
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  document.querySelectorAll(".lanterns").forEach((field) => {
    const count = Number(field.dataset.count || 8);
    for (let i = 0; i < count; i++) {
      const l = document.createElement("span");
      l.className = "lantern";
      const depth = rand();                         // 0 = far, 1 = near
      const w = Math.round(14 + depth * 26);
      l.style.setProperty("--w", `${w}px`);
      l.style.setProperty("--o", (0.45 + depth * 0.55).toFixed(2));
      l.style.setProperty("--b", depth < 0.35 ? "2px" : "0px");
      l.style.setProperty("--d", `${(7 - depth * 3).toFixed(1)}s`);
      l.style.setProperty("--delay", `${(-rand() * 6).toFixed(1)}s`);
      l.style.setProperty("--dx", `${Math.round((rand() - 0.5) * 24)}px`);
      l.style.left = `${(i + 0.15 + rand() * 0.7) * (100 / count)}%`;
      l.style.top = `${4 + rand() * 78}%`;
      field.appendChild(l);
    }
  });

  /* ---------- Parallax ---------- */
  const layers = [...document.querySelectorAll("[data-speed]")];
  let ticking = false;
  const parallax = () => {
    const vh = window.innerHeight;
    for (const el of layers) {
      const host = el.parentElement.getBoundingClientRect();
      if (host.bottom < -vh || host.top > vh * 2) continue;
      const speed = Number(el.dataset.speed);
      const offset = (host.top + host.height / 2 - vh / 2) * (1 - speed);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
    ticking = false;
  };
  if (!reduceMotion) {
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    window.addEventListener("resize", parallax);
    parallax();
  }

  /* ---------- Reveal on scroll ---------- */
  const groups = new Map();
  document.querySelectorAll(".reveal").forEach((el) => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.style.setProperty("--rd", `${Math.min(i * 0.12, 0.8)}s`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Photo section shows only once assets/couple.jpg exists ---------- */
  const photo = document.getElementById("photo");
  const probe = new Image();
  probe.onload = () => { if (photo) { photo.hidden = false; photo.querySelectorAll(".reveal").forEach((el) => io.observe(el)); } };
  probe.src = "assets/couple.jpg";

  /* ---------- Music: assets/music.mp3 (button hides itself if the file is missing) ---------- */
  const btn = document.getElementById("music");
  const label = btn.querySelector(".music__label");
  const audio = new Audio("assets/music.mp3");
  audio.loop = true; audio.preload = "auto"; audio.volume = 0.7;
  let hasAudio = true;
  audio.addEventListener("error", () => { hasAudio = false; btn.hidden = true; });
  const setPlaying = (on) => {
    btn.classList.toggle("is-playing", on);
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Pause music" : "Play music";
  };
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  const play = () => { if (hasAudio) audio.play().catch(() => {}); };
  btn.addEventListener("click", () => (audio.paused ? play() : audio.pause()));

  /* ---------- Gate ---------- */
  const gate = document.getElementById("gate");
  const opener = document.getElementById("openInvite");
  const band = document.querySelector(".cord__band");
  let opened = false;
  const openEnvelope = () => {
    if (opened) return; opened = true;
    play();
    if (band) band.style.transform = "";
    gate.classList.add("is-opening");                 // cord slides off, flaps open, card rises
    setTimeout(() => {
      gate.classList.add("is-open");                  // then the envelope fades into the cover
      document.body.classList.remove("locked");
      window.scrollTo(0, 0);
      document.querySelectorAll(".scene--sky .reveal").forEach((el) => el.classList.add("in"));
    }, reduceMotion ? 0 : 3100);
  };
  // Pull the thread: drag sideways or down; the cord follows the finger, a long enough pull opens it. A tap also works.
  let start = null;
  opener.addEventListener("pointerdown", (e) => { start = { x: e.clientX, y: e.clientY }; opener.setPointerCapture(e.pointerId); });
  opener.addEventListener("pointermove", (e) => {
    if (!start || opened) return;
    const d = Math.max(Math.abs(e.clientX - start.x), e.clientY - start.y, 0);
    if (band) band.style.transform = `translateX(${Math.min(d, 90) * 0.6}px)`;
    if (d > 70) openEnvelope();
  });
  const end = () => { if (start && !opened) openEnvelope(); start = null; };
  opener.addEventListener("pointerup", end);
  opener.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); } });
})();
