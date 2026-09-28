/* GoBrief — Amazon "Get the full book" links, routed to the visitor's store.
 * Web twin of the app's src/config/amazon.ts + src/utils/amazonLink.ts
 * (see EXTRA/Phase_2_Notes/Amazon.md §8.1 in the app repo). */
(function () {
  "use strict";

  // Website tracking IDs. A tag only earns on its own marketplace, so each one
  // pairs with DOMAINS below. Empty until Amazon.in Associates approves the site.
  var TAGS = { IN: "", US: "" };
  var DISCLOSURE = "As an Amazon Associate, GoBrief earns from qualifying purchases.";

  // Same stores and routing as the app's src/config/amazon.ts (ISO codes; UK is GB).
  // A store without a tag still gets its visitors, untagged (Amazon.md D-3).
  var DOMAINS = {
    IN: "www.amazon.in", US: "www.amazon.com", GB: "www.amazon.co.uk", CA: "www.amazon.ca",
    AU: "www.amazon.com.au", DE: "www.amazon.de", FR: "www.amazon.fr", IT: "www.amazon.it",
    ES: "www.amazon.es", NL: "www.amazon.nl", SE: "www.amazon.se", PL: "www.amazon.pl",
    BE: "www.amazon.com.be", TR: "www.amazon.com.tr", AE: "www.amazon.ae", SA: "www.amazon.sa",
    EG: "www.amazon.eg", JP: "www.amazon.co.jp", SG: "www.amazon.sg", MX: "www.amazon.com.mx",
    BR: "www.amazon.com.br"
  };
  // Countries without their own store, sent to the store that serves them.
  var ROUTING = {
    AT: "DE", CH: "DE", LI: "DE", LU: "DE",
    IE: "GB",
    NZ: "AU",
    KW: "AE", BH: "AE", QA: "AE", OM: "AE"
  };
  // No store and no routing entry (amazon.com ships internationally).
  var FALLBACK = "US";

  // The site has no signed-in user, so the country comes from the device time zone,
  // not the language (many Indian browsers report en-US). Zones from tzdb zone.tab
  // (2026c), plus the older names Chrome and Safari report (Asia/Calcutta, ...).
  var ZONES = {
    IN: "Asia/Kolkata Asia/Calcutta",
    US: "America/New_York America/Detroit America/Kentucky/Louisville America/Louisville " +
      "America/Kentucky/Monticello America/Indiana/Indianapolis America/Indianapolis " +
      "America/Indiana/Vincennes America/Indiana/Winamac America/Indiana/Marengo " +
      "America/Indiana/Petersburg America/Indiana/Vevay America/Chicago " +
      "America/Indiana/Tell_City America/Indiana/Knox America/Menominee " +
      "America/North_Dakota/Center America/North_Dakota/New_Salem " +
      "America/North_Dakota/Beulah America/Denver America/Boise America/Phoenix " +
      "America/Los_Angeles America/Anchorage America/Juneau America/Sitka " +
      "America/Metlakatla America/Yakutat America/Nome America/Adak Pacific/Honolulu",
    GB: "Europe/London",
    CA: "America/St_Johns America/Halifax America/Glace_Bay America/Moncton America/Goose_Bay " +
      "America/Blanc-Sablon America/Toronto America/Iqaluit America/Atikokan " +
      "America/Coral_Harbour America/Winnipeg America/Resolute America/Rankin_Inlet " +
      "America/Regina America/Swift_Current America/Edmonton America/Cambridge_Bay " +
      "America/Inuvik America/Vancouver America/Creston America/Dawson_Creek " +
      "America/Fort_Nelson America/Whitehorse America/Dawson",
    AU: "Australia/Lord_Howe Antarctica/Macquarie Australia/Hobart Australia/Melbourne " +
      "Australia/Sydney Australia/Broken_Hill Australia/Brisbane Australia/Lindeman " +
      "Australia/Adelaide Australia/Darwin Australia/Perth Australia/Eucla",
    DE: "Europe/Berlin Europe/Busingen",
    FR: "Europe/Paris",
    IT: "Europe/Rome",
    ES: "Europe/Madrid Africa/Ceuta Atlantic/Canary",
    NL: "Europe/Amsterdam",
    SE: "Europe/Stockholm",
    PL: "Europe/Warsaw",
    BE: "Europe/Brussels",
    TR: "Europe/Istanbul",
    AE: "Asia/Dubai",
    SA: "Asia/Riyadh",
    EG: "Africa/Cairo",
    JP: "Asia/Tokyo",
    SG: "Asia/Singapore",
    MX: "America/Mexico_City America/Cancun America/Merida America/Monterrey " +
      "America/Matamoros America/Chihuahua America/Ciudad_Juarez America/Ojinaga " +
      "America/Mazatlan America/Bahia_Banderas America/Hermosillo America/Tijuana",
    BR: "America/Noronha America/Belem America/Fortaleza America/Recife America/Araguaina " +
      "America/Maceio America/Bahia America/Sao_Paulo America/Campo_Grande America/Cuiaba " +
      "America/Santarem America/Porto_Velho America/Boa_Vista America/Manaus " +
      "America/Eirunepe America/Rio_Branco",
    AT: "Europe/Vienna",
    CH: "Europe/Zurich",
    LI: "Europe/Vaduz",
    LU: "Europe/Luxembourg",
    IE: "Europe/Dublin",
    NZ: "Pacific/Auckland Pacific/Chatham",
    KW: "Asia/Kuwait",
    BH: "Asia/Bahrain",
    QA: "Asia/Qatar",
    OM: "Asia/Muscat"
  };

  var countryByZone = {};
  Object.keys(ZONES).forEach(function (cc) {
    ZONES[cc].split(" ").forEach(function (tz) { countryByZone[tz] = cc; });
  });

  function detectMarketplace() {
    var country;
    try {
      country = countryByZone[Intl.DateTimeFormat().resolvedOptions().timeZone];
    } catch (e) { /* no Intl time zone: fall through */ }
    if (country && DOMAINS[country]) return country;
    return (country && ROUTING[country]) || FALLBACK;
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
