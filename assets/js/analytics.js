/* ============================================================
   Site analytics for BroomfieldRepublicans.org (Google Analytics 4)
   ------------------------------------------------------------
   Every page loads this one file. The measurement ID lives here
   and nowhere else.

   HOW TO TURN IT ON:
   Paste the GA4 measurement ID (looks like G-ABC123XYZ) into GA_ID
   below, commit, push. Until then this file does nothing at all.

   It only reports from the live domain, so opening pages on your
   own computer or in a preview never counts as a visit.

   WHAT IT RECORDS, on top of GA's automatic page views, scrolls,
   outbound clicks and PDF downloads:
     donate_click   any click to the Anedot donation page
     form_submit    any form sent, labeled with its data-formlite key
     cta_click      any link or button with data-track="name"
   ============================================================ */
(function () {
  "use strict";

  var GA_ID = "G-C85SF4RSCT"; // GA4 property broomfieldrepublicans.org, owned by chairman@

  var LIVE_HOSTS = ["broomfieldrepublicans.org", "www.broomfieldrepublicans.org"];

  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) return;
  if (LIVE_HOSTS.indexOf(location.hostname) === -1) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);

  function pagePath() {
    return location.pathname.replace(/\.html$/, "") || "/";
  }

  // Clicks: data-track labels and donation links
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("a, button") : null;
    if (!el) return;

    var label = el.getAttribute("data-track");
    if (label) {
      gtag("event", "cta_click", {
        cta_name: label,
        page_path: pagePath(),
        link_url: el.href || ""
      });
    }

    if (el.href && el.href.indexOf("anedot.com") !== -1) {
      var amt = (el.href.match(/[?&]amount=(\d+)/) || [])[1];
      gtag("event", "donate_click", {
        page_path: pagePath(),
        amount: amt ? Number(amt) : undefined,
        recurring: /[?&]recurring=true/.test(el.href)
      });
    }
  }, true);

  // Form sends, labeled by the form's data-formlite key
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || f.tagName !== "FORM") return;
    gtag("event", "form_submit", {
      form_name: f.getAttribute("data-formlite") || f.id || "form",
      page_path: pagePath()
    });
  }, true);
})();
