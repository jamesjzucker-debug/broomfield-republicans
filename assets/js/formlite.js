/* ============================================================
   Formlite form handler for BroomfieldRepublicans.org
   ------------------------------------------------------------
   Self-hosted form backend running on the homelab at
   https://forms.bcrserver.org  (Formlite -> n8n -> Discord/email).

   HOW TO TURN A FORM ON:
   Each form on the site carries a data-formlite="KEY" attribute.
   When the homelab creates that form, paste its ID below next to
   the matching KEY. That one line flips the page from FormSubmit
   over to Formlite. Leave a KEY blank ("") and that form keeps
   posting to its existing action (FormSubmit) untouched.

   Nothing else needs to change on the page.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "https://forms.bcrserver.org";

  // page KEY  ->  Formlite form ID (paste each ID as its form is created)
  var FORMS = {
    "contact": "",
    "get-involved": "",
    "precinct-captains": "",
    "run-for-office": "",
    "school-board": "",
    "young-republicans": "",
    "range-night": "66c47b22-4725-4b0a-9d42-3ddef687643b",
    // Meet & Greet Happy Hour, Aug 13 2026 (events.html #campaign-stop).
    // Remove this line when that featured section comes off the events page.
    "campaign-stop": "f32a93fc-2985-40cf-b7c5-8e31cb86b30d"
  };

  function endpointFor(id) {
    return BASE + "/s/" + id;
  }

  function addHoneypot(form) {
    if (form.querySelector('input[name="_gotcha"]')) return;
    var hp = document.createElement("input");
    hp.type = "text";
    hp.name = "_gotcha";
    hp.tabIndex = -1;
    hp.autocomplete = "off";
    hp.setAttribute("aria-hidden", "true");
    hp.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;";
    form.appendChild(hp);
  }

  function showSuccess(form) {
    var msg = document.createElement("div");
    msg.setAttribute("role", "status");
    msg.style.cssText =
      "padding:18px 20px;border-radius:8px;background:#eef6ee;" +
      "border:1px solid #bcdcbc;color:#1e4620;font-weight:700;" +
      "font-size:1rem;line-height:1.4;";
    msg.textContent =
      "Thank you. Your message has been received and we will be in touch soon.";
    form.parentNode.replaceChild(msg, form);
    if (msg.scrollIntoView) {
      msg.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function showError(form, btn, originalLabel) {
    if (btn) {
      btn.disabled = false;
      if (originalLabel != null) btn.innerHTML = originalLabel;
    }
    if (form.querySelector(".formlite-error")) return;
    var err = document.createElement("p");
    err.className = "formlite-error";
    err.setAttribute("role", "alert");
    err.style.cssText =
      "margin:12px 0 0;color:#a11020;font-weight:600;font-size:.9rem;";
    err.textContent =
      "Sorry, something went wrong sending your message. Please try again, " +
      "or email chairman@broomfieldrepublicans.org.";
    form.appendChild(err);
  }

  function enhance(form) {
    var key = form.getAttribute("data-formlite");
    var id = FORMS.hasOwnProperty(key) ? FORMS[key] : "";
    if (!id) return; // not live yet: leave the existing action in place

    var url = endpointFor(id);
    // Rewrite the native action too, so a JS-off browser still reaches Formlite.
    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    addHoneypot(form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"], button:not([type])');
      var originalLabel = btn ? btn.innerHTML : null;
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = "Sending…";
      }

      fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (r) {
          return r
            .json()
            .catch(function () {
              return { ok: r.ok };
            });
        })
        .then(function (res) {
          if (res && res.ok) {
            showSuccess(form);
          } else {
            showError(form, btn, originalLabel);
          }
        })
        .catch(function () {
          showError(form, btn, originalLabel);
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var forms = document.querySelectorAll("form[data-formlite]");
    for (var i = 0; i < forms.length; i++) enhance(forms[i]);
  });
})();
