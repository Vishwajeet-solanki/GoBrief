/* GoBrief — homepage: content rendering + scroll motion. */
(function () {
  "use strict";

  var DATA = window.GOBRIEF_DATA || { stats: {}, sections: [], books: [], tracks: [], plans: [], demoQuiz: null };
  var Covers = window.GBCovers;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var forceStatic = /[?&](noanim|static)(=|&|$)/.test(window.location.search);
  var animate = hasGsap && !reduceMotion && !forceStatic;

  var byId = {};
  DATA.books.forEach(function (b) { byId[b.id] = b; });
  function pick(ids, count) {
    var out = [];
    (ids || []).forEach(function (id) { if (byId[id]) out.push(byId[id]); });
    for (var i = 0; out.length < count && i < DATA.books.length; i++) {
      var b = DATA.books[(Covers.hash("seed" + i) + i * 37) % DATA.books.length];
      if (out.indexOf(b) === -1) out.push(b);
    }
    return out.slice(0, count);
  }

  /* ============ content rendering ============ */

  // Hero phone mockup
  var featured = pick(
    ["atomic-habits", "deep-work", "the-psychology-of-money", "sapiens-a-brief-history-of-humankind", "thinking-fast-and-slow", "cant-hurt-me-david-goggins", "the-power-of-habit", "zero-to-one"],
    8
  );
  var phoneCover = document.querySelector("[data-phone-cover]");
  if (phoneCover) phoneCover.appendChild(Covers.coverEl(featured[0], { hideAuthor: true }));
  var phoneTitle = document.querySelector("[data-phone-title]");
  if (phoneTitle) phoneTitle.textContent = featured[0].t;
  var shelf = document.querySelector("[data-phone-shelf]");
  if (shelf) featured.slice(1, 5).forEach(function (b) { shelf.appendChild(Covers.coverEl(b, { hideAuthor: true })); });
  var mini = document.querySelector("[data-phone-cover2]");
  if (mini) {
    var mc = Covers.coverEl(featured[5], { hideAuthor: true });
    mc.classList.add("app-miniplayer__cover");
    mini.replaceWith(mc);
  }
  var miniTitle = document.querySelector("[data-phone-title2]");
  if (miniTitle) miniTitle.textContent = featured[5].t;

  // Hero floating covers
  document.querySelectorAll("[data-float-cover]").forEach(function (el, i) {
    var b = featured[5 + i] || featured[i];
    el.appendChild(Covers.coverEl(b, { hideAuthor: true }));
  });

  // Bento: player cover + tracks strip
  var featCover = document.querySelector("[data-feature-cover]");
  if (featCover) {
    var pb = byId["the-psychology-of-money"] || featured[2];
    featCover.appendChild(Covers.coverEl(pb, { hideAuthor: true }));
    var ui = featCover.closest(".player-ui");
    if (ui) {
      ui.querySelector(".player-ui__title").textContent = pb.t;
      ui.querySelector(".player-ui__author").textContent = pb.a;
    }
  }
  var strip = document.querySelector("[data-bento-strip]");
  if (strip) DATA.tracks.forEach(function (t) {
    var s = document.createElement("span");
    s.className = "pill";
    s.textContent = t.title;
    strip.appendChild(s);
  });

  // Categories
  var cats = document.querySelector("[data-cats]");
  if (cats) DATA.sections.forEach(function (s) {
    var a = document.createElement("a");
    a.className = "cat";
    a.href = "explore.html?section=" + encodeURIComponent(s.id);
    a.setAttribute("data-reveal", "");
    var img = window.GBCovers.sectionImage(s.id);
    var swatch = img
      ? '<span class="cat__swatch"><img src="' + img + '" alt="" loading="lazy" /></span>'
      : '<span class="cat__swatch" style="background:linear-gradient(135deg,' + s.gradient[0] + "," + s.gradient[1] + ')"></span>';
    a.innerHTML =
      swatch +
      '<span><span class="cat__title">' + s.title + '</span><br /><span class="cat__sub">' + s.subtitle + "</span></span>" +
      '<span class="cat__count">' + s.bookCount + " books</span>";
    cats.appendChild(a);
  });

  // Marquee rows (3 rows, distinct slices, duplicated for a seamless loop)
  document.querySelectorAll("[data-marquee-track]").forEach(function (track, row) {
    var slice = [];
    for (var i = 0; i < 16; i++) {
      var idx = (row * 61 + i * 29 + 7) % DATA.books.length;
      slice.push(DATA.books[idx]);
    }
    for (var r = 0; r < 2; r++) {
      slice.forEach(function (b) {
        track.appendChild(Covers.coverEl(b, { href: "explore.html?book=" + encodeURIComponent(b.id), hideAuthor: true }));
      });
    }
  });

  // Tracks rail
  var rail = document.querySelector("[data-tracks-rail]");
  if (rail) DATA.tracks.forEach(function (t) {
    var a = document.createElement("a");
    a.className = "track-card";
    a.href = "explore.html?tab=tracks&track=" + encodeURIComponent(t.id);
    var booksHtml = t.books.slice(0, 4).map(function (b) { return "<span>" + b.title + "</span>"; }).join("");
    var more = t.bookCount > 4 ? '<span class="track-card__more">+ ' + (t.bookCount - 4) + " more</span>" : "";
    a.innerHTML =
      '<div class="track-card__head" style="background:linear-gradient(120deg,' + t.gradient[0] + "," + t.gradient[1] + ')"><h3>' + t.title + "</h3><p>" + t.subtitle + "</p></div>" +
      '<div class="track-card__body">' +
      '<p class="track-card__desc">' + t.description + "</p>" +
      '<div class="track-card__meta"><span>📚 ' + t.bookCount + " books</span><span>⏱ " + t.totalMinutes + ' min</span></div>' +
      '<div class="track-card__books">' + booksHtml + more + "</div>" +
      "</div>";
    rail.appendChild(a);
  });

  // Plans
  var plansGrid = document.querySelector("[data-plans]");
  if (plansGrid) DATA.plans.forEach(function (p) {
    var card = document.createElement("button");
    card.className = "plan-card";
    card.type = "button";
    card.setAttribute("data-reveal", "");
    var badge = p.badge ? '<span class="plan-card__badge">' + p.badge + "</span>" : "";
    var points = p.masteryPoints.slice(0, 3).map(function (m) { return "<span>" + m + "</span>"; }).join("");
    card.innerHTML =
      '<div class="plan-card__top"><span class="plan-card__days">' + p.totalDays + "-day plan</span>" + badge + "</div>" +
      "<h3>" + p.title + "</h3>" +
      '<div class="plan-card__points">' + points + "</div>" +
      '<div class="plan-card__foot"><span>' + p.totalSteps + " steps · " + p.totalSections + ' sections</span><span class="plan-card__cta">See the plan</span></div>';
    card.addEventListener("click", function () { openPlanModal(p); });
    plansGrid.appendChild(card);
  });

  /* ============ modal ============ */
  var modal = document.querySelector("[data-modal]");
  var modalContent = document.querySelector("[data-modal-content]");
  function openModal(html) {
    if (!modal) return;
    modalContent.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    modal.querySelector(".modal__panel").scrollTop = 0;
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  if (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }

  function openPlanModal(p) {
    var html = '<div class="plan-detail"><h3>' + p.title + "</h3>" +
      '<p class="plan-detail__meta">' + p.totalDays + " days · " + p.totalSteps + " steps · " + (p.category || "Challenge") + "</p>";
    if (p.masteryPoints.length) {
      html += "<h4>What you'll master</h4><div class=\"plan-detail__mastery\">" +
        p.masteryPoints.map(function (m) { return "<span>" + m + "</span>"; }).join("") + "</div>";
    }
    html += "<h4>The journey</h4><div class=\"plan-steps\">";
    p.sections.forEach(function (s) {
      html += '<div class="plan-step plan-step--section"><p class="plan-step__sec">' + s.title + '</p><p class="plan-step__sec-sub">' + s.description + "</p></div>";
      s.steps.forEach(function (st) {
        var kind = st.type === "quiz" ? '<span class="q">✦ Quiz checkpoint</span>' : "📖 Summary · " + st.duration + " min";
        html += '<div class="plan-step"><p class="plan-step__title">' + st.title + '</p><p class="plan-step__kind">' + kind + "</p></div>";
      });
    });
    html += "</div><p style=\"margin-top:26px\"><a class=\"btn btn--primary\" href=\"#get\" data-modal-close-link>Start this plan in the app</a></p></div>";
    openModal(html);
    var link = modalContent.querySelector("[data-modal-close-link]");
    if (link) link.addEventListener("click", closeModal);
  }

  /* ============ quiz demo ============ */
  (function initQuiz() {
    var root = document.querySelector("[data-quiz]");
    if (!root || !DATA.demoQuiz || !DATA.demoQuiz.questions) return;
    var questions = DATA.demoQuiz.questions.slice(0, 3);
    var qEl = root.querySelector("[data-quiz-q]");
    var optsEl = root.querySelector("[data-quiz-opts]");
    var explainEl = root.querySelector("[data-quiz-explain]");
    var progressEl = root.querySelector("[data-quiz-progress]");
    var nextBtn = root.querySelector("[data-quiz-next]");
    var restartBtn = root.querySelector("[data-quiz-restart]");
    var idx = 0, score = 0;

    function renderQ() {
      var q = questions[idx];
      progressEl.textContent = (idx + 1) + " / " + questions.length;
      qEl.textContent = q.q;
      explainEl.hidden = true;
      nextBtn.hidden = true;
      restartBtn.hidden = true;
      optsEl.innerHTML = "";
      q.o.forEach(function (opt, i) {
        var b = document.createElement("button");
        b.className = "quiz-opt";
        b.type = "button";
        b.textContent = opt;
        b.addEventListener("click", function () { answer(i, b); });
        optsEl.appendChild(b);
      });
    }
    function answer(i, btn) {
      var q = questions[idx];
      var buttons = optsEl.querySelectorAll(".quiz-opt");
      buttons.forEach(function (b) { b.disabled = true; });
      buttons[q.c].classList.add("is-correct");
      if (i === q.c) { score++; } else { btn.classList.add("is-wrong"); }
      explainEl.innerHTML = "<strong>" + (i === q.c ? "Correct. " : "Not quite. ") + "</strong>" + q.e;
      explainEl.hidden = false;
      if (idx < questions.length - 1) nextBtn.hidden = false;
      else showScore();
    }
    function showScore() {
      restartBtn.hidden = false;
      var note = document.createElement("p");
      note.className = "quiz-widget__score";
      note.textContent = "You scored " + score + " / " + questions.length + (score === questions.length ? " 🎉" : "");
      explainEl.appendChild(note);
    }
    nextBtn.addEventListener("click", function () { idx++; renderQ(); });
    restartBtn.addEventListener("click", function () { idx = 0; score = 0; renderQ(); });
    renderQ();
  })();

  /* ============ header / menu / misc ============ */
  var header = document.querySelector("[data-header]");
  var lastY = 0;
  function onScrollHeader(y) {
    header.classList.toggle("is-scrolled", y > 30);
    header.classList.toggle("is-hidden", y > 500 && y > lastY);
    lastY = y;
  }
  window.addEventListener("scroll", function () { onScrollHeader(window.scrollY); }, { passive: true });

  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.hidden = true;
        navToggle.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Bento pointer glow
  document.querySelectorAll(".bento-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  // Inline hero stats
  document.querySelectorAll("[data-stat-inline]").forEach(function (el) {
    var v = DATA.stats[el.getAttribute("data-stat-inline")];
    if (v) el.textContent = String(v);
  });

  /* ============ motion ============ */
  if (!animate) {
    // Static fallback: everything visible, counters set instantly.
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var v = DATA.stats[el.getAttribute("data-count")] || 0;
      el.textContent = v.toLocaleString("en-US");
    });
    return;
  }

  document.body.classList.add("gb-anim");
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scrolling
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    // Anchor links through Lenis — delegated so links injected later
    // (e.g. the "#get" button inside the plan modal) are covered too.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute("href");
      if (hash.length < 2) return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      if (window.history && history.pushState) history.pushState(null, "", hash);
      lenis.scrollTo(target, { offset: -70 });
    });
  }

  // Page progress bar
  gsap.to("[data-progress]", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.4 },
  });

  // Hero intro
  var intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .to(".line-mask .line", { y: 0, duration: 1.15, stagger: 0.12 }, 0.15)
    .to("[data-hero-fade]", { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.55)
    .fromTo("[data-phone]", { y: 90, opacity: 0, rotate: 6 }, { y: 0, opacity: 1, rotate: 2, duration: 1.3, ease: "power3.out" }, 0.4)
    .fromTo(".float-card, .float-chip", { opacity: 0, scale: 0.7, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "back.out(1.6)" }, 0.8);

  // Hero parallax on scroll
  document.querySelectorAll("[data-float]").forEach(function (el) {
    var speed = parseFloat(el.getAttribute("data-float")) || 0.4;
    gsap.to(el, {
      y: function () { return speed * -220; },
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
    });
  });
  gsap.to("[data-phone]", {
    y: -70,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
  });

  // Gentle mouse parallax in hero
  var stage = document.querySelector(".hero-stage");
  if (stage && window.matchMedia("(pointer: fine)").matches) {
    document.querySelector(".hero").addEventListener("pointermove", function (e) {
      var dx = (e.clientX / window.innerWidth - 0.5);
      var dy = (e.clientY / window.innerHeight - 0.5);
      gsap.to("[data-phone]", { rotateY: dx * 6, rotateX: -dy * 4, transformPerspective: 900, duration: 0.7 });
      document.querySelectorAll(".float-card").forEach(function (el, i) {
        gsap.to(el, { x: dx * (14 + i * 8), duration: 0.9 });
      });
    });
  }

  // Reveal-on-scroll
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.95, stagger: 0.08, ease: "power3.out", overwrite: true });
    },
  });
  // Landing with a hash (e.g. explore.html -> index.html#get): the browser
  // jumps before the pinned tracks section adds its extra scroll length, so
  // everything below #tracks ends up short of the target. Re-run the jump
  // once triggers exist, and again when layout is final.
  function scrollToHash() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var target;
    try { target = document.querySelector(hash); } catch (err) { return; }
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -70, immediate: true });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: "auto" });
    // The reveal batch only fires on scroll updates; after a hash jump the
    // page is static, so anything already at/above the viewport stays at
    // opacity 0 ("blank" section). Reveal it explicitly.
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", overwrite: true });
      }
    });
  }

  // Safety: anything still hidden when it's already in view (e.g. late layout)
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
    scrollToHash();
  });

  // Stat counters
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = DATA.stats[el.getAttribute("data-count")] || 0;
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString("en-US"); },
    });
  });

  // Player bar playful loop
  gsap.to("[data-player-bar]", { width: "82%", duration: 6, ease: "none", repeat: -1, yoyo: true });

  // Tracks: pinned horizontal scrub on desktop
  ScrollTrigger.matchMedia({
    "(min-width: 1081px)": function () {
      var railEl = document.querySelector("[data-tracks-rail]");
      if (!railEl) return;
      var getDist = function () { return Math.max(0, railEl.scrollWidth - window.innerWidth + 80); };
      gsap.to(railEl, {
        x: function () { return -getDist(); },
        ease: "none",
        scrollTrigger: {
          trigger: "[data-tracks-pin]",
          start: "top top",
          end: function () { return "+=" + (getDist() + 200); },
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    },
  });

  // Marquee: skew with scroll velocity
  var skewSetters = [];
  document.querySelectorAll(".marquee__track").forEach(function (t) {
    skewSetters.push(gsap.quickTo(t, "skewX", { duration: 0.4, ease: "power2.out" }));
  });
  ScrollTrigger.create({
    onUpdate: function (self) {
      var skew = gsap.utils.clamp(-6, 6, self.getVelocity() / 400);
      skewSetters.forEach(function (set) { set(skew); });
    },
  });

  // Magnetic buttons
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4 });
      });
      btn.addEventListener("pointerleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  // Big CTA title scale-in
  gsap.fromTo(".cta-title", { scale: 0.9 }, {
    scale: 1,
    ease: "none",
    scrollTrigger: { trigger: ".cta", start: "top bottom", end: "center center", scrub: 0.6 },
  });

  // All pins are registered now — correct the hash position right away so
  // the page doesn't sit mid-scroll until the load event.
  scrollToHash();
})();
