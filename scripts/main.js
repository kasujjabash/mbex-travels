/* ==========================================================================
   Mbeks Travels — Site-wide behaviour
   Each feature is a small function that does nothing if its markup is absent,
   so this one file is safe to load on every page.

   Scroll-driven effects share one requestAnimationFrame loop (onScroll).
   Everything that moves is skipped for prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  const html = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ------------------------------------------------------------------------
     Shared scroll loop: features register an update function and it runs
     at most once per frame while scrolling or resizing.
     ------------------------------------------------------------------------ */
  const scrollTasks = [];
  let ticking = false;

  function onScroll(task) {
    scrollTasks.push(task);
  }

  function runScrollTasks() {
    ticking = false;
    scrollTasks.forEach((task) => task());
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(runScrollTasks);
    }
  }

  /* ------------------------------------------------------------------------
     Header: over the hero it sits in place. Past the hero it is fixed but
     hidden, and slides in only while scrolling up.
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = document.querySelector(".site-header");
    const hero = document.querySelector("[data-hero]");
    if (!header || !hero) return;

    let lastY = window.scrollY;

    onScroll(() => {
      const y = window.scrollY;
      const pastHero = hero.getBoundingClientRect().bottom < 80;

      if (!pastHero) {
        header.classList.remove("is-stuck", "is-ready", "is-shown");
      } else {
        if (!header.classList.contains("is-stuck")) {
          header.classList.add("is-stuck");
          // Enable the slide only after it is in place, so it never flashes
          window.requestAnimationFrame(() => header.classList.add("is-ready"));
        }
        if (y < lastY - 4 || document.body.classList.contains("menu-open")) header.classList.add("is-shown");
        else if (y > lastY + 4) header.classList.remove("is-shown");
      }
      lastY = y;
    });

    // Keep it visible while keyboard users tab through it
    header.addEventListener("focusin", () => header.classList.add("is-shown"));
  }

  /* ------------------------------------------------------------------------
     Full-screen mobile menu
     ------------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = document.querySelector("[data-menu-open]");
    const menu = document.getElementById("mobile-menu");
    if (!toggle || !menu) return;

    const closeBtn = menu.querySelector("[data-menu-close]");

    function setOpen(open, restoreFocus) {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      if (open) closeBtn.focus();
      else if (restoreFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => setOpen(true));
    closeBtn.addEventListener("click", () => setOpen(false, true));
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false, true);

      // Keep Tab inside the open menu
      if (event.key === "Tab") {
        const focusable = menu.querySelectorAll("a[href], button:not([disabled])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // The menu is mobile only: close it if the window grows to desktop width
    window.matchMedia("(min-width: 1080px)").addEventListener("change", (event) => {
      if (event.matches && !menu.hidden) setOpen(false);
    });
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  }

  /* ------------------------------------------------------------------------
     Conversion tracking for every Book a Trip / WhatsApp link.
     Pushes to Google Tag Manager's dataLayer and calls gtag() if present.
     Topic comes from data-topic, or falls back to the pre-filled message.
     ------------------------------------------------------------------------ */
  function initBookingTracking() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href*="wa.me/"]');
      if (!link) return;

      let topic = link.dataset.topic;
      if (!topic) {
        try {
          topic = new URL(link.href).searchParams.get("text") || "general";
        } catch (error) {
          topic = "general";
        }
      }

      const payload = {
        event: "book_trip_click",
        topic: topic,
        link_location: link.dataset.location || "",
        page_path: window.location.pathname
      };

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);

      if (typeof window.gtag === "function") {
        window.gtag("event", "book_trip_click", {
          topic: payload.topic,
          link_location: payload.link_location
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Split headings into words (or letters) so they can rise in on reveal.
     Keeps nested spans (e.g. coloured words) and <br> intact.
     ------------------------------------------------------------------------ */
  function splitText(el, mode) {
    if (el.classList.contains("is-split")) return;
    if (el.matches("h1, h2, h3")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());

    let index = 0;
    const piece = (text) => {
      const outer = document.createElement("span");
      const inner = document.createElement("span");
      outer.className = "split-word";
      outer.setAttribute("aria-hidden", "true");
      inner.className = "split-word__inner";
      inner.style.setProperty("--si", index++);
      inner.textContent = text;
      outer.appendChild(inner);
      return outer;
    };

    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
            } else if (mode === "chars") {
              Array.from(part).forEach((ch) => frag.appendChild(piece(ch)));
            } else {
              frag.appendChild(piece(part));
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    };

    walk(el);
    el.classList.add("is-split");
  }

  /* ------------------------------------------------------------------------
     Reveal on scroll: [data-reveal] (fade up / "clip" image wipe) and split
     headings. Siblings get a staggered delay via --i.
     ------------------------------------------------------------------------ */
  function initReveal() {
    if (!reduceMotion) {
      document.querySelectorAll(".h1, .h2, [data-split]").forEach((el) => {
        if (el.closest(".moments, .hero")) return;
        splitText(el, el.dataset.split === "chars" ? "chars" : "words");
      });
    }

    const items = Array.from(document.querySelectorAll("[data-reveal], .is-split"));
    if (!items.length) return;

    items.forEach((el) => {
      if (!el.hasAttribute("data-reveal")) return;
      const siblings = Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal"));
      el.style.setProperty("--i", siblings.indexOf(el));
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     Intro statement: words light up one by one as it scrolls through view
     ------------------------------------------------------------------------ */
  function initScrubText() {
    if (reduceMotion) return;

    document.querySelectorAll("[data-scrub]").forEach((el) => {
      splitText(el, "words");
      el.classList.add("is-scrub");
      const words = Array.from(el.querySelectorAll(".split-word__inner"));

      onScroll(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the top reaches 85% of the viewport, 1 when the bottom reaches 45%
        const progress = clamp((vh * .85 - rect.top) / (vh * .4 + rect.height));
        const lit = progress * words.length;
        words.forEach((word, i) => {
          word.style.opacity = (.16 + .84 * clamp(lit - i)).toFixed(3);
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Keep the intro statement as wide as the desktop nav pill
     ------------------------------------------------------------------------ */
  function initNavWidth() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const set = () => {
      const width = nav.offsetWidth;
      if (width) html.style.setProperty("--nav-w", `${width}px`);
      else html.style.removeProperty("--nav-w");
    };
    set();
    window.addEventListener("resize", set);
    if (document.fonts) document.fonts.ready.then(set);
  }

  /* ------------------------------------------------------------------------
     Parallax: [data-parallax="speed"] drifts relative to its parent
     ------------------------------------------------------------------------ */
  function initParallax() {
    if (reduceMotion) return;
    const items = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!items.length) return;

    onScroll(() => {
      const vh = window.innerHeight;
      items.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax);
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
    });
  }

  /* ------------------------------------------------------------------------
     Custom pointer: gold dot + trailing ring. Grows over links; becomes a
     labelled circle over [data-cursor="Label"] areas.
     ------------------------------------------------------------------------ */
  function initCursor() {
    const cursor = document.querySelector(".cursor");
    if (!cursor || !finePointer || reduceMotion) return;

    html.classList.add("has-cursor");
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    const label = cursor.querySelector(".cursor__label");

    let mx = -100;
    let my = -100;
    let rx = mx;
    let ry = my;

    let following = false;

    function follow() {
      rx = lerp(rx, mx, .18);
      ry = lerp(ry, my, .18);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      // Stop the loop once the ring has caught up; the next move restarts it
      following = Math.abs(mx - rx) > .1 || Math.abs(my - ry) > .1;
      if (following) window.requestAnimationFrame(follow);
    }

    window.addEventListener("pointermove", (event) => {
      mx = event.clientX;
      my = event.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      cursor.classList.add("is-active");
      if (!following) {
        following = true;
        window.requestAnimationFrame(follow);
      }
    }, { passive: true });

    document.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));

    document.addEventListener("pointerover", (event) => {
      const zone = event.target.closest("[data-cursor]");
      const link = event.target.closest("a, button, label, input, select, textarea");
      cursor.classList.toggle("is-label", Boolean(zone));
      cursor.classList.toggle("is-link", Boolean(link) && !zone);
      if (zone) label.textContent = zone.dataset.cursor;
    });

    document.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
  }

  /* ------------------------------------------------------------------------
     Magnetic buttons: lean gently towards the pointer
     ------------------------------------------------------------------------ */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;

    document.querySelectorAll(".btn").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.translate = `${(dx * .22).toFixed(1)}px ${(dy * .32).toFixed(1)}px`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.translate = "";
      });
    });
  }

  /* ------------------------------------------------------------------------
     Testimonials: pick a traveller to show their quote; auto-advances every
     6s, paused while hovered, focused, off-screen or in a background tab,
     and off for reduced motion. Screen readers hear only quotes they pick.
     ------------------------------------------------------------------------ */
  function initTestimonials() {
    const root = document.querySelector("[data-testimonials]");
    if (!root) return;

    const quotes = Array.from(root.querySelectorAll(".quote"));
    const pickers = Array.from(root.querySelectorAll(".quote-picker"));
    const live = root.querySelector("[aria-live]");
    let current = 0;
    let timer = null;
    let onScreen = true;
    let paused = false;

    function show(index) {
      current = index;
      quotes.forEach((quote, i) => quote.classList.toggle("is-active", i === index));
      pickers.forEach((picker, i) => picker.setAttribute("aria-pressed", String(i === index)));
    }

    function start() {
      if (reduceMotion || timer || paused || !onScreen || document.hidden) return;
      if (live) live.setAttribute("aria-live", "off");
      timer = window.setInterval(() => show((current + 1) % quotes.length), 6000);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    pickers.forEach((picker, i) => {
      picker.addEventListener("click", () => {
        stop();
        if (live) live.setAttribute("aria-live", "polite");
        show(i);
      });
    });

    const pause = () => { paused = true; stop(); };
    const resume = () => { paused = false; start(); };

    root.addEventListener("pointerenter", pause);
    root.addEventListener("pointerleave", resume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget)) resume();
    });

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      }).observe(root);
    }

    show(0);
    start();
  }

  /* ------------------------------------------------------------------------
     Moments: the word rises in letter by letter as the section arrives,
     holds in the centre, then photos drift in and out around it.
     Timings are shares of the pinned scroll (0 = stage pins, 1 = unpins).
     ------------------------------------------------------------------------ */
  function initMoments() {
    const section = document.querySelector(".moments");
    if (!section || reduceMotion) return;

    const word = section.querySelector(".moments__word");
    const extras = Array.from(section.querySelectorAll(".moments__extra"));
    const photos = Array.from(section.querySelectorAll(".moments__photo"));

    splitText(word, "chars");
    const letters = Array.from(word.querySelectorAll(".split-word__inner"));
    section.classList.add("is-animated");

    const PHOTO_START = .16;
    const PHOTO_STEP = .1;
    const PHOTO_LENGTH = .3;

    function photoFrame(t) {
      // 0–30% rise in, hold, 70–100% drift out
      if (t <= 0) return { o: 0, y: 140, s: .82 };
      if (t >= 1) return { o: 0, y: -140, s: 1.06 };
      if (t < .3) {
        const k = easeOut(t / .3);
        return { o: k, y: lerp(140, 0, k), s: lerp(.82, 1, k) };
      }
      if (t <= .7) return { o: 1, y: 0, s: 1 };
      const k = (t - .7) / .3;
      return { o: 1 - k, y: lerp(0, -140, k), s: lerp(1, 1.06, k) };
    }

    onScroll(() => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = -rect.top / (rect.height - vh);
      if (p < -1.2 || p > 1.2) return;

      // Word: letters rise in just before the stage pins (p -0.25 → 0.08)
      letters.forEach((letter, i) => {
        const t = easeOut(clamp((p + .25 - i * .025) / .14));
        letter.style.transform = `translateY(${lerp(110, 0, t)}%) rotate(${lerp(12, 0, t)}deg)`;
        letter.style.opacity = t.toFixed(3);
      });
      const settle = easeOut(clamp((p + .2) / .3));
      const drift = clamp((p - PHOTO_START) / (1 - PHOTO_START));
      word.style.transform = `scale(${(lerp(1.25, 1, settle) - drift * .08).toFixed(4)})`;

      // Tagline + button
      const extraT = easeOut(clamp((p - .02) / .1));
      extras.forEach((el) => {
        el.style.opacity = extraT.toFixed(3);
        el.style.transform = `translateY(${lerp(30, 0, extraT)}px)`;
      });

      // Photos: staggered so 2–4 are on screen at once
      photos.forEach((photo, i) => {
        const t = (p - (PHOTO_START + i * PHOTO_STEP)) / PHOTO_LENGTH;
        const f = photoFrame(t);
        photo.style.opacity = f.o.toFixed(3);
        photo.style.transform = `translateY(${f.y.toFixed(1)}px) scale(${f.s.toFixed(3)}) rotate(var(--rot, 0deg))`;
      });
    });
  }

  /* ------------------------------------------------------------------------
     Destinations explorer: on desktop the list and photo stay pinned while
     scrolling steps through the destinations. Hover/focus also picks one.
     ------------------------------------------------------------------------ */
  function initDestExplorer() {
    const root = document.querySelector("[data-dest-explorer]");
    if (!root) return;

    const pin = root.closest("[data-dest-pin]");
    const space = pin && pin.querySelector(".dest-pin__space");
    const rows = Array.from(root.querySelectorAll("[data-dest]"));
    const photos = Array.from(root.querySelectorAll(".dest-stage__item"));
    const desktop = window.matchMedia("(min-width: 1080px)");
    let current = 0;

    function activate(index) {
      if (index === current) return;
      current = index;
      rows.forEach((row, i) => row.classList.toggle("is-active", i === index));
      photos.forEach((photo, i) => photo.classList.toggle("is-active", i === index));
    }

    rows.forEach((row, i) => {
      row.addEventListener("pointerenter", () => activate(i));
      row.addEventListener("focus", () => activate(i));
    });

    if (!pin || !space) return;

    // Pin the explorer in the vertical centre of the screen
    function setPinTop() {
      const top = Math.max(24, (window.innerHeight - root.offsetHeight) / 2);
      pin.style.setProperty("--pin-top", `${Math.round(top)}px`);
    }
    setPinTop();
    window.addEventListener("resize", setPinTop);

    onScroll(() => {
      if (!desktop.matches) return;
      const rect = pin.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      // 0 when the explorer first pins, 1 when it lets go
      const pinTop = parseFloat(pin.style.getPropertyValue("--pin-top")) || 24;
      const progress = clamp((pinTop - rect.top) / space.offsetHeight);
      activate(Math.min(rows.length - 1, Math.floor(progress * rows.length)));
    });
  }

  /* ------------------------------------------------------------------------
     Hero video: plays a little slower than real time, stays on its poster
     for reduced motion, and pauses while the hero is off-screen
     ------------------------------------------------------------------------ */
  const HERO_VIDEO_SPEED = 0.7; // 1 = normal speed, lower = slower

  function initHeroVideo() {
    const video = document.querySelector("[data-hero-video]");
    if (!video) return;

    video.defaultPlaybackRate = HERO_VIDEO_SPEED;
    video.playbackRate = HERO_VIDEO_SPEED;

    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }).observe(video);
    }
  }

  /* ------------------------------------------------------------------------
     Stacking panels: a panel taller than the screen pins at its bottom edge
     (top = screen height - panel height) so all of it is seen first
     ------------------------------------------------------------------------ */
  function initStack() {
    const panels = Array.from(document.querySelectorAll("[data-stack]"));
    if (!panels.length) return;

    const set = () => {
      panels.forEach((panel) => {
        panel.style.setProperty("--stack-top", `${Math.min(0, window.innerHeight - panel.offsetHeight)}px`);
      });
    };
    set();
    window.addEventListener("resize", set);
    window.addEventListener("load", set);
  }

  /* ------------------------------------------------------------------------
     Keep the footer year current
     ------------------------------------------------------------------------ */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  initHeader();
  initMobileMenu();
  initBookingTracking();
  initNavWidth();
  initScrubText();
  initReveal();
  initParallax();
  initCursor();
  initMagnetic();
  initTestimonials();
  initDestExplorer();
  initHeroVideo();
  initStack();
  initMoments();
  initYear();

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  runScrollTasks();
})();
