/* GoBrief — Amazon "Get the full book" links, routed to the visitor's store.
 * Web twin of the app's src/config/amazon.ts + src/utils/amazonLink.ts
 * (see EXTRA/Phase_2_Notes/Amazon.md §8.1 in the app repo). */
(function () {
  "use strict";

  // Website tracking IDs. A tag only earns on its own marketplace, so each one
  // pairs with DOMAINS below. Empty until Amazon.in Associates approves the site.
  var TAGS = { IN: "", US: "" };
  var DOMAINS = { IN: "www.amazon.in", US: "www.amazon.com" };
  var DISCLOSURE = "As an Amazon Associate, GoBrief earns from qualifying purchases.";

  // India by time zone, not language: many Indian browsers report en-US.
  function detectMarketplace() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "IN" : "US";
    } catch (e) {
      return "US";
    }
  }

  var marketplace = detectMarketplace();
  var tag = TAGS[marketplace];

  /* Pull the `k=` search keyword out of a stored link (handles `+` and `%20`). */
  function searchKeyword(link) {
    var m = /[?&]k=([^&#]*)/.exec(link || "");
    if (!m) return null;
    try {
      return decodeURIComponent(m[1].replace(/\+/g, " ")).trim() || null;
    } catch (e) {
      return null;
    }
  }

  /* Only the keyword is kept from the stored link, so any old `tag=` is dropped. */
  function href(link, title, author) {
    var keyword = searchKeyword(link) || (title + " " + author).trim();
    return "https://" + DOMAINS[marketplace] + "/s?k=" + encodeURIComponent(keyword) +
      "&i=stripbooks" + (tag ? "&tag=" + encodeURIComponent(tag) : "");
  }

  // The footer statement appears once any web tag is live.
  var anyTag = Object.keys(TAGS).some(function (k) { return !!TAGS[k]; });
  if (anyTag) {
    document.querySelectorAll("[data-amazon-disclosure]").forEach(function (el) {
      el.textContent = DISCLOSURE;
      el.hidden = false;
    });
  }

  window.GBAmazon = { href: href, tagged: !!tag, disclosure: DISCLOSURE, marketplace: marketplace };
})();
