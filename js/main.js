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

  /* ---------- Music: a YouTube mix played through a hidden player, started by the guest's tap ---------- */
  const VIDEO_ID = "VFqzggB5Isg";   // "Go To India // voices of kolkata" by MyRoadTunes
  const btn = document.getElementById("music");
  const label = btn.querySelector(".music__label");
  let player = null, ready = false, wantPlay = false;
  const setPlaying = (on) => {
    btn.classList.toggle("is-playing", on);
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Pause music" : "Play music";
  };
  const play = () => {
    wantPlay = true;
    if (!ready) return;
    try { player.unMute(); player.setVolume(60); player.playVideo(); } catch (e) {}
  };
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("yt", {
      width: "1", height: "1", videoId: VIDEO_ID, host: "https://www.youtube-nocookie.com",
      playerVars: { playsinline: 1, controls: 0, loop: 1, playlist: VIDEO_ID, rel: 0 },
      events: {
        onReady: () => { ready = true; if (wantPlay) play(); },
        onStateChange: (e) => setPlaying(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING),
        onError: () => { btn.hidden = true; },
      },
    });
  };
  const yt = document.createElement("script");
  yt.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(yt);
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-playing")) { wantPlay = false; try { player.pauseVideo(); } catch (e) {} }
    else play();
  });

  /* ---------- RSVP: a formatted reply opens in WhatsApp ---------- */
  // The family's WhatsApp number, digits only with country code (e.g. "919876543210").
  // Left empty, WhatsApp opens with the reply ready and the guest picks who to send it to.
  const RSVP_TO = "919937759242";
  const sheet = document.getElementById("rsvpSheet");
  const openSheet = () => { sheet.showModal(); document.body.classList.add("sheet-open"); };
  const closeSheet = () => sheet.close();
  document.getElementById("openRsvp")?.addEventListener("click", openSheet);
  document.getElementById("closeRsvp")?.addEventListener("click", closeSheet);
  sheet?.addEventListener("close", () => document.body.classList.remove("sheet-open"));
  sheet?.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });   // tap outside the panel
  const form = document.getElementById("rsvpForm");
  if (form) {
    const more = document.getElementById("rsvpMore");
    const err = document.getElementById("rsvpError");
    const out = document.getElementById("guests");
    const thanks = document.getElementById("rsvpThanks");
    let guests = 1;
    form.addEventListener("change", (e) => {
      if (e.target.name === "attending") more.hidden = e.target.value !== "yes";
    });
    form.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
      guests = Math.min(10, Math.max(1, guests + Number(b.dataset.step))); out.textContent = guests;
    }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const name = (f.get("name") || "").trim();
      const attending = f.get("attending");
      const fail = (msg) => { err.textContent = msg; err.hidden = false; };
      if (!name) return fail("Please add your name.");
      if (!attending) return fail("Please let us know if you can join us.");
      const events = f.getAll("events");
      if (attending === "yes" && !events.length) return fail("Please pick at least one celebration.");
      err.hidden = true;
      const lines = [`RSVP · Harini & Suraj`, ``, `Name: ${name}`];
      if (f.get("phone")) lines.push(`Phone: ${f.get("phone").trim()}`);
      if (attending === "yes") {
        lines.push(`Joyfully accepts`, `Guests: ${guests}`, `Celebrations: ${events.join(", ")}`,
          `Food: ${f.get("food")}`, `Arriving: ${f.get("arrival")}`, `Room at the venue: ${f.get("stay")}`);
        if (f.get("notes")) lines.push(`Allergies / notes: ${f.get("notes").trim()}`);
      } else {
        lines.push(`Regretfully declines`);
      }
      if (f.get("message")) lines.push(``, `Message: ${f.get("message").trim()}`);
      const text = encodeURIComponent(lines.join("\n"));
      window.open(`https://wa.me/${RSVP_TO}?text=${text}`, "_blank", "noopener");
      document.getElementById("rsvpThanksText").textContent = attending === "yes"
        ? `We can’t wait to celebrate with you${guests > 1 ? ` and your ${guests - 1 === 1 ? "guest" : `${guests - 1} guests`}` : ""}.`
        : "We’ll miss you, and we’ll be thinking of you on the day.";
      form.hidden = true; thanks.hidden = false;
    });
    document.getElementById("rsvpAgain").addEventListener("click", () => { thanks.hidden = true; form.hidden = false; });
  }

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
      document.body.classList.add("cover-live");      // shooting stars start once the cover shows
      document.body.classList.remove("locked");
      window.scrollTo(0, 0);
      document.querySelectorAll(".scene--sky .reveal").forEach((el) => el.classList.add("in"));
    }, reduceMotion ? 0 : 5400);                     // the leaf is fully open at ~1.9s; the card then stays 3.5s
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
