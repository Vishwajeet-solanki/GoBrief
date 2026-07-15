/* GoBrief — procedural book covers.
   No external images: every cover is generated from the book's id/title,
   themed with its category gradient. */
(function () {
  "use strict";

  var FALLBACK = [
    ["#2563EB", "#7C3AED"],
    ["#F59E0B", "#EF4444"],
    ["#10B981", "#0EA5E9"],
    ["#EC4899", "#8B5CF6"],
    ["#F97316", "#DB2777"],
    ["#14B8A6", "#6366F1"],
  ];

  var sectionGradients = {};
  function ensureGradients() {
    if (Object.keys(sectionGradients).length) return;
    var data = window.GOBRIEF_DATA;
    if (data && data.sections) {
      data.sections.forEach(function (s) {
        sectionGradients[s.id] = s.gradient;
      });
    }
  }

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
  }

  /**
   * Build a cover element for a book record ({id, t, a, s}) or any
   * {id, title, author, sectionId}-ish object.
   */
  function coverEl(book, opts) {
    ensureGradients();
    opts = opts || {};
    var id = book.id || book.t || book.title || "book";
    var title = book.t || book.title || "";
    var author = book.a || book.author || "";
    var h = hash(id);
    var grad = sectionGradients[book.s || book.sectionId] || FALLBACK[h % FALLBACK.length];
    var variant = h % 4;
    var angle = 115 + (h % 5) * 25;

    var el = document.createElement(opts.href ? "a" : "div");
    if (opts.href) el.href = opts.href;
    el.className = "gb-cover v" + variant + (opts.className ? " " + opts.className : "");
    el.style.background =
      "linear-gradient(" + angle + "deg," + grad[0] + " 0%," + grad[1] + " 100%)";
    el.setAttribute("aria-label", title + (author ? " by " + author : ""));

    var deco = document.createElement("span");
    deco.className = "gb-cover__deco";
    deco.setAttribute("aria-hidden", "true");
    el.appendChild(deco);

    var body = document.createElement("span");
    body.className = "gb-cover__body";

    var t = document.createElement("span");
    t.className = "gb-cover__title";
    t.textContent = title;
    body.appendChild(t);

    if (author && !opts.hideAuthor) {
      var a = document.createElement("span");
      a.className = "gb-cover__author";
      a.textContent = author;
      body.appendChild(a);
    }
    el.appendChild(body);

    var brand = document.createElement("span");
    brand.className = "gb-cover__brand";
    brand.setAttribute("aria-hidden", "true");
    brand.textContent = "GoBrief";
    el.appendChild(brand);

    return el;
  }

  /* Category artwork, keyed by section id (stable across data regen). */
  var SECTION_IMAGES = {
    "2": "self_growth.png",
    "3": "business-and-career.png",
    "4": "fiction.png",
    "5": "productivity.png",
    "6": "home-and-environment.png",
    "7": "society-and-tech.png",
    "8": "Health.png",
    "9": "Family.png",
    "10": "sports-and-fitness.png",
    "11": "Personalities.png",
    "12": "Happiness.png",
    "13": "spirituality.png",
    "14": "leadership.png",
    "15": "money-and-investment.png",
    "16": "negotiation.png",
  };
  function sectionImage(id) {
    var f = SECTION_IMAGES[String(id)];
    return f ? "assets/images/" + f : "";
  }

  window.GBCovers = { coverEl: coverEl, hash: hash, sectionImage: sectionImage };
})();
