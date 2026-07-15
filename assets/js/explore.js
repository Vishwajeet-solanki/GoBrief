/* GoBrief — explore page: searchable catalog of books, tracks and plans. */
(function () {
  "use strict";

  var DATA = window.GOBRIEF_DATA || { stats: {}, sections: [], books: [], tracks: [], plans: [] };
  var DETAILS = (window.GOBRIEF_DETAILS && window.GOBRIEF_DETAILS.books) || {};
  var Covers = window.GBCovers;

  var sectionById = {};
  DATA.sections.forEach(function (s) { sectionById[s.id] = s; });

  var state = { tab: "books", query: "", section: "all" };
  var CHUNK = 60;
  var rendered = 0;
  var currentList = [];

  var els = {
    search: document.querySelector("[data-search]"),
    tabs: document.querySelectorAll("[data-tab]"),
    filters: document.querySelector("[data-filters]"),
    meta: document.querySelector("[data-results-meta]"),
    booksGrid: document.querySelector("[data-books-grid]"),
    tracksGrid: document.querySelector("[data-tracks-grid]"),
    plansGrid: document.querySelector("[data-plans-grid]"),
    sentinel: document.querySelector("[data-sentinel]"),
    empty: document.querySelector("[data-empty]"),
    count: document.querySelector("[data-x-count]"),
    modal: document.querySelector("[data-modal]"),
    modalContent: document.querySelector("[data-modal-content]"),
  };

  if (els.count) els.count.textContent = String(DATA.stats.books || DATA.books.length);

  /* ---------- modal ---------- */
  function openModal(html) {
    els.modalContent.innerHTML = html;
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    els.modal.querySelector(".modal__panel").scrollTop = 0;
  }
  function closeModal() {
    if (els.modal.hidden) return;
    els.modal.hidden = true;
    document.body.style.overflow = "";
  }
  els.modal.querySelectorAll("[data-modal-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function openBookModal(b) {
    var d = DETAILS[b.id] || {};
    var sec = sectionById[b.s];
    var badge = b.p ? '<span class="chip chip--premium">Premium</span>' : '<span class="chip chip--free">Free</span>';
    var html = '<div class="book-detail"><div class="book-detail__head">' +
      '<div data-bd-cover></div>' +
      '<div class="book-detail__head-info"><h3>' + esc(b.t) + '</h3>' +
      '<p class="book-detail__author">by ' + esc(b.a) + "</p>" +
      '<div class="book-detail__chips">' + badge +
      '<span class="chip">⏱ ' + b.m + " min</span>" +
      (sec ? '<span class="chip">' + esc(sec.title) + "</span>" : "") +
      "</div>" +
      '<div class="book-detail__actions">' +
      '<a class="btn btn--primary btn--sm" href="index.html#get">Read in the app</a>' +
      (d.z ? '<a class="btn btn--ghost btn--sm" href="' + esc(d.z) + '" target="_blank" rel="noopener">Get the full book ↗</a>' : "") +
      "</div></div></div>";
    if (d.d) html += "<h4>The idea</h4><p>" + esc(d.d) + "</p>";
    if (d.j) html += "<h4>About this journey</h4><p>" + esc(d.j) + "</p>";
    if (d.w && d.w.length) {
      html += "<h4>Who should read this</h4><ul class=\"book-detail__who\">" +
        d.w.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>";
    }
    html += "</div>";
    openModal(html);
    var slot = els.modalContent.querySelector("[data-bd-cover]");
    slot.replaceWith(Covers.coverEl(b));
  }

  function openTrackModal(t) {
    var html = '<div class="plan-detail"><h3>' + esc(t.title) + "</h3>" +
      '<p class="plan-detail__meta">' + esc(t.subtitle) + " · " + t.bookCount + " books · " + t.totalMinutes + " min</p>" +
      "<p style=\"color:var(--muted)\">" + esc(t.description) + "</p>" +
      "<h4>Books in this track</h4><div class=\"plan-steps\">" +
      t.books.map(function (b) {
        return '<div class="plan-step"><p class="plan-step__title" data-track-book="' + esc(b.id) + '" style="cursor:pointer">' + esc(b.title) + "</p></div>";
      }).join("") +
      "</div><p style=\"margin-top:26px\"><a class=\"btn btn--primary\" href=\"index.html#get\">Follow this track in the app</a></p></div>";
    openModal(html);
    els.modalContent.querySelectorAll("[data-track-book]").forEach(function (el) {
      el.addEventListener("click", function () {
        var book = DATA.books.find(function (b) { return b.id === el.getAttribute("data-track-book"); });
        if (book) openBookModal(book);
      });
    });
  }

  function openPlanModal(p) {
    var html = '<div class="plan-detail"><h3>' + esc(p.title) + "</h3>" +
      '<p class="plan-detail__meta">' + p.totalDays + " days · " + p.totalSteps + " steps · " + esc(p.category || "Challenge") + "</p>";
    if (p.masteryPoints.length) {
      html += "<h4>What you'll master</h4><div class=\"plan-detail__mastery\">" +
        p.masteryPoints.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</div>";
    }
    html += "<h4>The journey</h4><div class=\"plan-steps\">";
    p.sections.forEach(function (s) {
      html += '<div class="plan-step plan-step--section"><p class="plan-step__sec">' + esc(s.title) + '</p><p class="plan-step__sec-sub">' + esc(s.description) + "</p></div>";
      s.steps.forEach(function (st) {
        var kind = st.type === "quiz" ? '<span class="q">✦ Quiz checkpoint</span>' : "📖 Summary · " + st.duration + " min";
        html += '<div class="plan-step"><p class="plan-step__title">' + esc(st.title) + '</p><p class="plan-step__kind">' + kind + "</p></div>";
      });
    });
    html += "</div><p style=\"margin-top:26px\"><a class=\"btn btn--primary\" href=\"index.html#get\">Start this plan in the app</a></p></div>";
    openModal(html);
  }

  /* ---------- filters ---------- */
  function renderFilters() {
    els.filters.innerHTML = "";
    if (state.tab !== "books") { els.filters.hidden = true; return; }
    els.filters.hidden = false;
    var all = document.createElement("button");
    all.className = "filter-chip" + (state.section === "all" ? " is-active" : "");
    all.textContent = "All categories";
    all.addEventListener("click", function () { state.section = "all"; refresh(); });
    els.filters.appendChild(all);
    DATA.sections.forEach(function (s) {
      var chip = document.createElement("button");
      chip.className = "filter-chip" + (state.section === s.id ? " is-active" : "");
      chip.innerHTML = '<i style="background:linear-gradient(135deg,' + s.gradient[0] + "," + s.gradient[1] + ')"></i>' + esc(s.title);
      chip.addEventListener("click", function () {
        state.section = state.section === s.id ? "all" : s.id;
        refresh();
      });
      els.filters.appendChild(chip);
    });
  }

  /* ---------- books grid (chunked) ---------- */
  function bookCard(b, i) {
    var card = document.createElement("button");
    card.className = "book-card";
    card.type = "button";
    card.style.animationDelay = Math.min(i % CHUNK, 20) * 0.03 + "s";
    card.appendChild(Covers.coverEl(b));
    var title = document.createElement("span");
    title.className = "book-card__title";
    title.textContent = b.t;
    card.appendChild(title);
    var meta = document.createElement("span");
    meta.className = "book-card__meta";
    meta.innerHTML = "⏱ " + b.m + " min " +
      (b.p ? '<span class="book-card__badge">Premium</span>' : '<span class="book-card__badge is-free">Free</span>');
    card.appendChild(meta);
    card.addEventListener("click", function () { openBookModal(b); });
    return card;
  }

  function appendChunk() {
    var frag = document.createDocumentFragment();
    var end = Math.min(rendered + CHUNK, currentList.length);
    for (var i = rendered; i < end; i++) frag.appendChild(bookCard(currentList[i], i));
    rendered = end;
    els.booksGrid.appendChild(frag);
  }

  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && rendered < currentList.length) appendChunk();
  }, { rootMargin: "800px" });
  io.observe(els.sentinel);

  /* ---------- tracks & plans ---------- */
  function renderTracks(list) {
    els.tracksGrid.innerHTML = "";
    list.forEach(function (t, i) {
      var card = document.createElement("button");
      card.className = "track-card";
      card.type = "button";
      card.style.animationDelay = i * 0.04 + "s";
      var booksHtml = t.books.slice(0, 4).map(function (b) { return "<span>" + esc(b.title) + "</span>"; }).join("");
      var more = t.bookCount > 4 ? '<span class="track-card__more">+ ' + (t.bookCount - 4) + " more</span>" : "";
      card.innerHTML =
        '<div class="track-card__head" style="background:linear-gradient(120deg,' + t.gradient[0] + "," + t.gradient[1] + ')"><h3>' + esc(t.title) + "</h3><p>" + esc(t.subtitle) + "</p></div>" +
        '<div class="track-card__body">' +
        '<p class="track-card__desc">' + esc(t.description) + "</p>" +
        '<div class="track-card__meta"><span>📚 ' + t.bookCount + " books</span><span>⏱ " + t.totalMinutes + " min</span></div>" +
        '<div class="track-card__books">' + booksHtml + more + "</div></div>";
      card.addEventListener("click", function () { openTrackModal(t); });
      els.tracksGrid.appendChild(card);
    });
  }

  function renderPlans(list) {
    els.plansGrid.innerHTML = "";
    list.forEach(function (p, i) {
      var card = document.createElement("button");
      card.className = "plan-card";
      card.type = "button";
      card.style.animationDelay = i * 0.04 + "s";
      var badge = p.badge ? '<span class="plan-card__badge">' + esc(p.badge) + "</span>" : "";
      var points = p.masteryPoints.slice(0, 3).map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("");
      card.innerHTML =
        '<div class="plan-card__top"><span class="plan-card__days">' + p.totalDays + "-day plan</span>" + badge + "</div>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<div class="plan-card__points">' + points + "</div>" +
        '<div class="plan-card__foot"><span>' + p.totalSteps + " steps · " + p.totalSections + ' sections</span><span class="plan-card__cta">See the plan</span></div>';
      card.addEventListener("click", function () { openPlanModal(p); });
      els.plansGrid.appendChild(card);
    });
  }

  /* ---------- filtering / refresh ---------- */
  function match(text) {
    return text.toLowerCase().indexOf(state.query) !== -1;
  }

  function refresh() {
    renderFilters();
    document.querySelectorAll("[data-panel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel") !== state.tab;
    });
    els.tabs.forEach(function (t) {
      var active = t.getAttribute("data-tab") === state.tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });

    var total = 0;
    if (state.tab === "books") {
      currentList = DATA.books.filter(function (b) {
        if (state.section !== "all" && b.s !== state.section) return false;
        return !state.query || match(b.t) || match(b.a);
      });
      total = currentList.length;
      rendered = 0;
      els.booksGrid.innerHTML = "";
      appendChunk();
      var secName = state.section !== "all" && sectionById[state.section] ? " in " + sectionById[state.section].title : "";
      els.meta.innerHTML = "<strong>" + total + "</strong> " + (total === 1 ? "title" : "titles") + secName +
        (state.query ? ' matching "' + esc(state.query) + '"' : "");
    } else if (state.tab === "tracks") {
      var tl = DATA.tracks.filter(function (t) { return !state.query || match(t.title) || match(t.subtitle) || match(t.description); });
      total = tl.length;
      renderTracks(tl);
      els.meta.innerHTML = "<strong>" + total + "</strong> curated " + (total === 1 ? "track" : "tracks");
    } else {
      var pl = DATA.plans.filter(function (p) { return !state.query || match(p.title) || match(p.category); });
      total = pl.length;
      renderPlans(pl);
      els.meta.innerHTML = "<strong>" + total + "</strong> guided " + (total === 1 ? "plan" : "plans");
    }
    els.empty.hidden = total !== 0;
  }

  /* ---------- events ---------- */
  var debounce;
  els.search.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      state.query = els.search.value.trim().toLowerCase();
      refresh();
    }, 120);
  });
  els.tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      state.tab = t.getAttribute("data-tab");
      refresh();
    });
  });

  // Header + mobile menu (same behavior as home)
  var header = document.querySelector("[data-header]");
  var lastY = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    header.classList.toggle("is-hidden", y > 500 && y > lastY);
    lastY = y;
  }, { passive: true });
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
  }
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- deep links ---------- */
  var params = new URLSearchParams(window.location.search);
  if (params.get("tab") && ["books", "tracks", "plans"].indexOf(params.get("tab")) !== -1) state.tab = params.get("tab");
  if (params.get("section") && sectionById[params.get("section")]) state.section = params.get("section");

  refresh();

  if (params.get("book")) {
    var b = DATA.books.find(function (x) { return x.id === params.get("book"); });
    if (b) openBookModal(b);
  }
  if (params.get("track")) {
    var t = DATA.tracks.find(function (x) { return x.id === params.get("track"); });
    if (t) openTrackModal(t);
  }
  if (params.get("plan")) {
    var p = DATA.plans.find(function (x) { return x.id === params.get("plan"); });
    if (p) openPlanModal(p);
  }
})();
