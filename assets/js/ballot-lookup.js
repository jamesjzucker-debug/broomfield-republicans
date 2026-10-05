/* ============================================================
   Broomfield sample ballot lookup (Nov 3, 2026 General Election)
   ------------------------------------------------------------
   Drop <div data-ballot-lookup></div> on any page and load this file.

   How it works (no server, no API key):
   1. Autocompletes the address against Broomfield's public Address
      Points layer (ArcGIS Online, CORS-open).
   2. Looks up the parcel under that address point, which carries the
      council WARD and school DISTRICT_CODE.
   3. Ward + school district decide the ballot style, using the
      Clerk's six published styles:
        Jeffco R-1 + Ward 1  -> 101-05
        Ward 1               -> 110-02
        Jeffco R-1           -> 209-04
        Weld RE-8            -> 513-03
        everything else      -> 413-01
      (DISTRICT_CODE: A Adams 12, B Boulder Valley, J Jeffco R-1,
       S St. Vrain, W Weld RE-8, N Brighton 27J. Only J and W have
       2026 measures.)
   Sample ballot PDFs are self-hosted copies of the Clerk's files in
   assets/ballots/. Data checked 2026-10-05.
   ============================================================ */
(function () {
  "use strict";

  var GIS = "https://services1.arcgis.com/vXSRPZbyyOmH9pek/arcgis/rest/services";
  var ADDR = GIS + "/Addresses/FeatureServer/0/query";
  var PARCEL = GIS + "/Parcels/FeatureServer/0/query";
  var SOS = "https://myballot.coloradosos.gov/app/home";
  var CLERK = "https://www.broomfield.org/153/Elections";

  var STYLES = {
    "101-05": { extras: ["ward1", "jeffco"] },
    "110-02": { extras: ["ward1"] },
    "209-04": { extras: ["jeffco"] },
    "413-01": { extras: [] },
    "513-03": { extras: ["weld"] }
  };
  var EXTRAS = {
    ward1: { title: "Broomfield City Council, Ward 1", rec: "One-year term. Katie Peterson is the only candidate on the ballot.", tone: "info" },
    jeffco: { title: "Jeffco School District 5A and 5B", rec: "Vote NO on both. $73 million and $60 million tax increases.", tone: "no" },
    weld: { title: "Weld RE-8 School District 5C", rec: "Vote NO. $4.9 million tax increase, plus extending $2.7 million in expiring taxes.", tone: "no" }
  };

  function styleFor(ward, code) {
    var w1 = String(ward || "").toUpperCase() === "WARD-1";
    code = String(code || "").toUpperCase();
    if (code === "J") return w1 ? "101-05" : "209-04";
    if (code === "W") return "513-03";
    return w1 ? "110-02" : "413-01";
  }

  var ABBR = {
    WEST: "W", EAST: "E", NORTH: "N", SOUTH: "S",
    AVENUE: "AVE", AV: "AVE", STREET: "ST", DRIVE: "DR", ROAD: "RD", COURT: "CT",
    CIRCLE: "CIR", PLACE: "PL", LANE: "LN", BOULEVARD: "BLVD", PARKWAY: "PKWY",
    TRAIL: "TRL", TERRACE: "TER", HIGHWAY: "HWY", POINT: "PT", LOOP: "LOOP"
  };

  // Uppercase, strip anything that is not a letter/digit/space, drop city/zip/unit.
  function normalize(raw) {
    var s = String(raw || "").toUpperCase().replace(/[^A-Z0-9 #]/g, " ");
    s = s.replace(/\b(BROOMFIELD|COLORADO|CO|USA)\b.*$/, "");
    s = s.replace(/\s(#|APT\b|UNIT\b|STE\b|SUITE\b|BLDG\b)\s*\w*.*$/, "");
    s = s.replace(/#/g, " ").replace(/\b8\d{4}\b/g, "");
    return s.split(/\s+/).filter(Boolean).map(function (t) { return ABBR[t] || t; }).join(" ").trim();
  }

  function q(url, params) {
    var u = url + "?" + Object.keys(params).map(function (k) {
      return k + "=" + encodeURIComponent(params[k]);
    }).join("&");
    return fetch(u).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (j) {
      if (j.error) throw new Error(j.error.message || "GIS error");
      return j.features || [];
    });
  }

  function findAddresses(text) {
    var n = normalize(text);
    if (!/^\d+\s+[A-Z0-9]/.test(n)) return Promise.resolve([]);
    var base = { outFields: "FULL_ADDRESS,PARCEL_PIN,LATITUDE,LONGITUDE", returnGeometry: "false", orderByFields: "FULL_ADDRESS", resultRecordCount: "40", f: "json" };
    var exact = Object.assign({ where: "ADDRESS_TYPE='Address' AND FULL_ADDRESS LIKE '" + n + "%'" }, base);
    return q(ADDR, exact).then(function (f) {
      if (f.length) return f;
      // Loose retry: house number plus the longest word of the street name.
      var parts = n.split(" ");
      var word = parts.slice(1).sort(function (a, b) { return b.length - a.length; })[0];
      var loose = Object.assign({ where: "ADDRESS_TYPE='Address' AND FULL_ADDRESS LIKE '" + parts[0] + " %" + word + "%'" }, base);
      return q(ADDR, loose);
    }).then(function (f) {
      var seen = {}, out = [];
      f.forEach(function (x) {
        var a = x.attributes;
        if (!a.FULL_ADDRESS || seen[a.FULL_ADDRESS]) return;
        seen[a.FULL_ADDRESS] = 1;
        out.push(a);
      });
      return out.slice(0, 8);
    });
  }

  function lookupStyle(a) {
    var byPoint = (a.LONGITUDE && a.LATITUDE) ? q(PARCEL, {
      geometry: a.LONGITUDE + "," + a.LATITUDE, geometryType: "esriGeometryPoint", inSR: "4326",
      spatialRel: "esriSpatialRelIntersects", outFields: "WARD,DISTRICT_CODE", returnGeometry: "false", f: "json"
    }) : Promise.resolve([]);
    return byPoint.then(function (f) {
      if (f.length || !a.PARCEL_PIN) return f;
      return q(PARCEL, { where: "PARCELNUMBER='" + String(a.PARCEL_PIN).replace(/[^0-9A-Z]/gi, "") + "'", outFields: "WARD,DISTRICT_CODE", returnGeometry: "false", f: "json" });
    }).then(function (f) {
      if (!f.length) throw new Error("no parcel");
      var p = f[0].attributes;
      return { style: styleFor(p.WARD, p.DISTRICT_CODE), ward: p.WARD };
    });
  }

  var CSS = '' +
    '.bl{background:#fff;color:#0F1722;border-radius:6px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.18);text-align:left;font-family:Inter,system-ui,sans-serif}' +
    '.bl label{display:block;font-size:.8rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#002F61;margin:0 0 8px}' +
    '.bl__row{position:relative}' +
    '.bl input{width:100%;padding:13px 14px;font:500 1rem Inter,system-ui,sans-serif;border:2px solid #002F61;border-radius:6px;background:#fff;color:#0F1722}' +
    '.bl input:focus{outline:3px solid #D6A84A;outline-offset:1px}' +
    '.bl__list{list-style:none;margin:4px 0 0;padding:4px 0;border:1px solid #E4E0DA;border-radius:6px;background:#fff;max-height:260px;overflow:auto;position:absolute;left:0;right:0;z-index:20;box-shadow:0 12px 24px rgba(0,0,0,.12)}' +
    '.bl__list li{padding:10px 14px;cursor:pointer;font-size:.95rem;color:#0F1722}' +
    '.bl__list li[aria-selected=true],.bl__list li:hover{background:#F4F1EC}' +
    '.bl .bl__hint{font-size:.82rem;color:#44546B;margin:8px 0 0}' +
    '.bl .bl__msg{margin:14px 0 0;font-size:.95rem;color:#44546B}' +
    '.bl .bl__msg--err{color:#a11020;font-weight:600}' +
    '.bl__res{margin-top:16px;border-top:3px solid #002F61;padding-top:14px}' +
    '.bl .bl__addr{font-weight:800;font-size:1.05rem;margin:0 0 2px;color:#002F61}' +
    '.bl .bl__style{font-size:.82rem;color:#44546B;margin:0 0 12px}' +
    '.bl__res h4{font:800 .78rem/1.2 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#44546B;margin:12px 0 6px}' +
    '.bl__res ul{margin:0;padding-left:18px}.bl .bl__res li{color:#0F1722;margin:0 0 6px;font-size:.93rem;line-height:1.35}' +
    '.bl .bl__rec{display:block;font-size:.88rem;font-weight:600}.bl .bl__rec--no{color:#C22600}.bl .bl__rec--info{color:#44546B}' +
    '.bl__btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}' +
    '.bl__btn{flex:1 1 auto;text-align:center;font:800 .78rem/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:13px 14px;border-radius:4px;border:2px solid #002F61;color:#002F61;background:#fff}' +
    '.bl__btn--red{background:#C22600;border-color:#C22600;color:#fff}' +
    '.bl__btn:focus-visible{outline:3px solid #D6A84A;outline-offset:2px}' +
    '.bl .bl__fine{font-size:.78rem;color:#44546B;margin:12px 0 0;line-height:1.4}.bl .bl__fine a{color:#002F61}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function mount(root, n) {
    var id = "bl" + n;
    root.innerHTML =
      '<div class="bl">' +
        '<label for="' + id + '-in">Your Broomfield street address</label>' +
        '<div class="bl__row">' +
          '<input id="' + id + '-in" type="text" inputmode="search" autocomplete="street-address" placeholder="e.g. 1 DesCombes Dr" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '-list" />' +
          '<ul class="bl__list" id="' + id + '-list" role="listbox" hidden></ul>' +
        '</div>' +
        '<p class="bl__hint">Start with your house number, then pick your address from the list.</p>' +
        '<div class="bl__out" aria-live="polite"></div>' +
      '</div>';
    var input = root.querySelector("input"), list = root.querySelector(".bl__list"), out = root.querySelector(".bl__out");
    var items = [], active = -1, timer = null, seq = 0;

    function closeList() { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; }
    function render() {
      list.innerHTML = items.map(function (a, i) {
        return '<li role="option" id="' + id + '-o' + i + '" aria-selected="' + (i === active) + '">' + esc(a.FULL_ADDRESS) + "</li>";
      }).join("");
      list.hidden = !items.length;
      input.setAttribute("aria-expanded", items.length ? "true" : "false");
      if (active >= 0) input.setAttribute("aria-activedescendant", id + "-o" + active); else input.removeAttribute("aria-activedescendant");
    }
    function msg(text, err) { out.innerHTML = '<p class="bl__msg' + (err ? " bl__msg--err" : "") + '">' + text + "</p>"; }
    var fallback = 'Try again, or use the <a href="' + SOS + '" target="_blank" rel="noopener">official Secretary of State sample ballot lookup</a> (needs your name and birth date).';

    function search() {
      var mine = ++seq, val = input.value;
      if (normalize(val).length < 4) { items = []; render(); return; }
      findAddresses(val).then(function (r) {
        if (mine !== seq) return;
        items = r; active = -1; render();
        if (!r.length && /^\s*\d+\s+\S{2,}/.test(val)) msg("We couldn't find that address in Broomfield. Check the spelling, or leave off the apartment number. " + fallback, true);
        else out.innerHTML = "";
      }).catch(function () { if (mine === seq) msg("The address service isn't responding right now. " + fallback, true); });
    }

    function choose(a) {
      input.value = a.FULL_ADDRESS; items = []; closeList(); render();
      msg("Finding your ballot&hellip;");
      lookupStyle(a).then(function (r) { show(a, r); }).catch(function () {
        msg("We found your address but couldn't match it to a ballot. " + fallback, true);
      });
    }

    function show(a, r) {
      var st = STYLES[r.style];
      var extras = st.extras.map(function (k) {
        var e = EXTRAS[k];
        return '<li><strong>' + e.title + '</strong><span class="bl__rec bl__rec--' + e.tone + '">' + e.rec + "</span></li>";
      }).join("");
      out.innerHTML =
        '<div class="bl__res">' +
          '<p class="bl__addr">' + esc(a.FULL_ADDRESS) + "</p>" +
          '<p class="bl__style">Broomfield ballot style ' + r.style + (r.ward ? " &middot; " + esc(String(r.ward).replace("WARD-", "Ward ")) : "") + "</p>" +
          "<h4>On every Broomfield ballot</h4>" +
          "<ul><li>Federal, statewide, State Senate 25 and State House 33 races</li>" +
          "<li>Statewide Amendments 81 to 87, Propositions NN and 132 to 137</li>" +
          "<li>Broomfield 1A, 1B and 1C, Front Range Passenger Rail 7A, 17th Judicial District 7E</li>" +
          "<li>Retention of 12 judges and justices</li></ul>" +
          (extras ? "<h4>Also on your ballot</h4><ul>" + extras + "</ul>" : '<h4>Also on your ballot</h4><ul><li>No school district or council questions at your address.</li></ul>') +
          '<div class="bl__btns">' +
            '<a class="bl__btn bl__btn--red" href="assets/ballots/sample-ballot-' + r.style + '.pdf" target="_blank" rel="noopener">View My Sample Ballot (PDF)</a>' +
            '<a class="bl__btn" href="voter-guide">How We Recommend Voting</a>' +
          "</div>" +
          '<p class="bl__fine">Sample ballots are the official versions published by the <a href="' + CLERK + '" target="_blank" rel="noopener">Broomfield Clerk &amp; Recorder</a>, matched to your address using city map data. To see the exact ballot on your voter record, use the <a href="' + SOS + '" target="_blank" rel="noopener">Secretary of State lookup</a>.</p>' +
        "</div>";
    }

    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(search, 250); });
    input.addEventListener("keydown", function (e) {
      if (list.hidden || !items.length) { if (e.key === "Enter") { e.preventDefault(); search(); } return; }
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % items.length; render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % items.length; render(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(items[active >= 0 ? active : 0]); }
      else if (e.key === "Escape") { closeList(); }
    });
    list.addEventListener("mousedown", function (e) {
      var li = e.target.closest("li"); if (!li) return;
      e.preventDefault();
      choose(items[Array.prototype.indexOf.call(list.children, li)]);
    });
    input.addEventListener("blur", function () { setTimeout(closeList, 150); });
  }

  function init() {
    var roots = document.querySelectorAll("[data-ballot-lookup]");
    if (!roots.length) return;
    var s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
    for (var i = 0; i < roots.length; i++) mount(roots[i], i);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
