(() => {
  const PLAYLIST_ID = "OLAK5uy_nmYXVCudQpXrnQW8eqGMLWjKii1mLfxe8";
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

  /* ---------- Hide the dashed guide once the carved frame art exists ---------- */
  const probe = new Image();
  probe.onload = () => document.querySelector(".carved")?.classList.add("has-frame");
  probe.src = "assets/carved-frame.png";

  /* ---------- Music (YouTube playlist) ---------- */
  const btn = document.getElementById("music");
  const label = btn.querySelector(".music__label");
  let player = null, ready = false, wantPlay = false;

  const setPlaying = (on) => {
    btn.classList.toggle("is-playing", on);
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Pause music" : "Play music";
  };
  const play = () => {
    if (!ready) { wantPlay = true; return; }
    try { player.unMute(); player.setVolume(70); player.playVideo(); } catch (e) {}
  };

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("yt", {
      width: "1", height: "1",
      playerVars: { listType: "playlist", list: PLAYLIST_ID, playsinline: 1, controls: 0, loop: 1 },
      events: {
        onReady: () => { ready = true; if (wantPlay) play(); },
        onStateChange: (e) => setPlaying(e.data === YT.PlayerState.PLAYING),
      },
    });
  };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);

  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-playing")) { try { player.pauseVideo(); } catch (e) {} }
    else play();
  });

  /* ---------- Gate ---------- */
  document.getElementById("openInvite").addEventListener("click", () => {
    play();
    document.getElementById("gate").classList.add("is-open");
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    document.querySelectorAll(".scene--sky .reveal").forEach((el) => el.classList.add("in"));
  });
})();
