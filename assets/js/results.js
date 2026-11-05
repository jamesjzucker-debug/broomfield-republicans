// Election night results board. Reads assets/data/results.json (same origin) and polls it every 60 seconds.
// The JSON is built from the official Clarity feeds (CO SOS 127407, Broomfield 127416) by tools/election-night/build_results_json.py.
(function () {
  var URL_JSON = 'assets/data/results.json';
  var URL_TURNOUT = 'assets/data/turnout.json'; // Broomfield ballots cast + registered voters, kept separate from results.json
  var turnout = null;
  var POLLS_CLOSE = Date.parse('2026-11-03T19:00:00-07:00');
  var board = document.getElementById('er-board');
  var headline = document.getElementById('er-headline');
  var updated = document.getElementById('er-updated');
  var turnoutBox = document.getElementById('er-turnout');
  var scope = 'state';
  var last = null;
  var SECTIONS = ['Federal', 'Statewide', 'Colorado Legislature', 'Statewide Ballot Measures', 'Broomfield and Local Measures'];
  var PARTY = { REP: 'Republican', DEM: 'Democrat', LBR: 'Libertarian', UAF: 'Unaffiliated', UNI: 'Unity', APV: 'Approval Voting', ACN: 'American Constitution', FWD: 'Forward' };

  try { var saved = localStorage.getItem('bcrResultsScope'); if (saved === 'county' || saved === 'state') scope = saved; } catch (e) {}

  function esc(s) { return String(s).replace(/''/g, '"').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('en-US'); }
  function pct(n) { return (n || 0).toFixed(1) + '%'; }

  function pickData(c) {
    // County-only measures (1A, 1B, 1C) have no statewide feed.
    if (scope === 'county') return { d: c.county || c.state, local: true };
    return { d: c.state || c.county, local: !c.state };
  }

  function raceCard(c) {
    var p = pickData(c), d = p.d;
    if (!d) return '';
    var counted = d.total > 0;
    var ch = d.choices.slice();
    if (counted) ch.sort(function (a, b) { return b.votes - a.votes; });
    else ch.sort(function (a, b) { return rank(a) - rank(b); });
    // Show the top three, and always keep our nominee on the card.
    var top = ch.slice(0, 3);
    var nomRow = ch.filter(function (x) { return x.name === c.nominee; })[0];
    if (nomRow && top.indexOf(nomRow) === -1) top[2] = nomRow;
    var rest = ch.filter(function (x) { return top.indexOf(x) === -1; });
    var rows = top.map(function (x, i) {
      var nom = x.name === c.nominee;
      var lead = counted && i === 0;
      var tag = x.winner ? '<span class="er-tag er-tag--win">Winner</span>' : (lead ? '<span class="er-tag">Leading</span>' : '');
      return '<div class="er-row' + (nom ? ' er-row--gop' : '') + '">' +
        '<div class="er-row__top"><span class="er-name">' + esc(x.name) + (nom ? ' <span class="er-nom">Our nominee</span>' : '') + '</span>' + tag +
        '<span class="er-num"><b>' + pct(x.pct) + '</b> ' + fmt(x.votes) + '</span></div>' +
        '<div class="er-bar"><i style="width:' + Math.min(100, x.pct) + '%"></i></div>' +
        '<div class="er-party">' + esc(PARTY[x.party] || x.party || '') + '</div></div>';
    }).join('');
    if (rest.length) {
      var rv = rest.reduce(function (s, x) { return s + x.votes; }, 0);
      var rp = d.total ? 100 * rv / d.total : 0;
      rows += '<div class="er-row er-row--rest"><div class="er-row__top"><span class="er-name">' + rest.length + ' other candidate' + (rest.length > 1 ? 's' : '') + '</span><span class="er-num"><b>' + pct(rp) + '</b> ' + fmt(rv) + '</span></div></div>';
    }
    return '<article class="er-card">' +
      '<header><h3>' + esc(c.label) + '</h3>' + scopeLabel(p) + '</header>' + rows +
      '<footer><span>' + (counted ? fmt(d.total) + ' votes counted' : 'No votes reported yet') + '</span>' + voterBase(c, p) + '</footer></article>';
  }

  // Registered voters in Broomfield who can vote in this contest (Broomfield view only).
  function voterBase(c, p) {
    var t = p.local && turnout && turnout.county && turnout.county.contests && turnout.county.contests[c.key];
    if (!t || !t[1]) return '';
    return '<span>' + fmt(t[0]) + ' of ' + fmt(t[1]) + ' registered voters returned a ballot (' + pct(100 * t[0] / t[1]) + ')</span>';
  }

  function renderTurnout() {
    if (!turnoutBox) return;
    var t = turnout && turnout.county;
    if (!t || !t.registered_voters || !t.ballots_cast) { turnoutBox.hidden = true; return; }
    var when = t.last_modified ? new Date(t.last_modified) : null;
    var asof = when && !isNaN(when) ? ' As of the ' + when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' }) + ' MT Broomfield count.' : '';
    turnoutBox.innerHTML = '<span class="er-turnout__label">Broomfield turnout</span>' +
      '<span class="er-turnout__big">' + pct(100 * t.ballots_cast / t.registered_voters) + '</span>' +
      '<span class="er-turnout__text"><b>' + fmt(t.ballots_cast) + '</b> ballots counted out of <b>' + fmt(t.registered_voters) + '</b> registered voters.' + asof + '</span>';
    turnoutBox.hidden = false;
  }

  function rank(x) { return x.party === 'REP' ? 0 : x.party === 'DEM' ? 1 : 2; }

  function measureCard(c) {
    var p = pickData(c), d = p.d;
    if (!d) return '';
    var yes = d.choices.filter(function (x) { return /^yes/i.test(x.name); })[0] || { votes: 0, pct: 0 };
    var no = d.choices.filter(function (x) { return /^no/i.test(x.name); })[0] || { votes: 0, pct: 0 };
    var counted = d.total > 0;
    var status = '', cls = '';
    if (counted) {
      var passing = yes.votes > no.votes;
      var decided = yes.winner || no.winner;
      status = decided ? (yes.winner ? 'Passed' : 'Failed') : (yes.votes === no.votes ? 'Tied' : (passing ? 'Passing' : 'Failing'));
      if (c.pick) {
        var good = (c.pick === 'Yes') === passing;
        if (yes.votes !== no.votes) cls = good ? ' er-status--good' : ' er-status--bad';
      }
    }
    var pick = c.pick ? '<span class="er-pick er-pick--' + c.pick.toLowerCase() + '">We said: Vote ' + c.pick + '</span>' : '<span class="er-pick">No position</span>';
    return '<article class="er-card er-card--measure">' +
      '<header><h3>' + esc(c.label) + '</h3>' + scopeLabel(p) + '</header>' +
      '<p class="er-blurb">' + esc(c.blurb) + '</p>' +
      '<div class="er-yn"><i class="er-yn__yes" style="width:' + (counted ? yes.pct : 50) + '%"></i><i class="er-yn__no" style="width:' + (counted ? no.pct : 50) + '%"></i></div>' +
      '<div class="er-yn__labels"><span>Yes <b>' + pct(yes.pct) + '</b> ' + fmt(yes.votes) + '</span><span>No <b>' + pct(no.pct) + '</b> ' + fmt(no.votes) + '</span></div>' +
      '<footer>' + pick + (status ? '<span class="er-result' + cls + '">' + status + '</span>' : '<span class="er-result">No votes reported yet</span>') + '</footer></article>';
  }

  function scopeLabel(p) { return p.local ? '<span class="er-scope-tag">Broomfield votes</span>' : (scope === 'state' ? '' : ''); }

  function render() {
    renderTurnout();
    if (!last) return;
    var html = '';
    SECTIONS.forEach(function (sec) {
      var cs = last.contests.filter(function (c) { return c.section === sec; });
      if (!cs.length) return;
      html += '<h2 class="er-section">' + esc(sec) + '</h2><div class="er-grid">' +
        cs.map(function (c) { return c.type === 'race' ? raceCard(c) : measureCard(c); }).join('') + '</div>';
    });
    board.innerHTML = html;

    var any = last.contests.some(function (c) { return (c.state && c.state.total) || (c.county && c.county.total); });
    if (!any) {
      headline.textContent = Date.now() < POLLS_CLOSE ? 'Polls close at 7:00 PM. Still in line? Stay in line, you can still vote.' : 'Polls are closed. Waiting on the first official results.';
    } else {
      headline.textContent = 'Results are coming in';
    }
    var lm = any && last.sources && last.sources[scope === 'county' ? 'county' : 'state'];
    var when = lm && lm.last_modified ? new Date(lm.last_modified) : null;
    updated.textContent = when && !isNaN(when) ? ' Official count last updated ' + when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' }) + ' MT.' : '';
  }

  function load() {
    fetch(URL_JSON + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { last = j; render(); })
      .catch(function () {
        if (!last) { headline.textContent = 'Live numbers are not loading right now. Use the official results links below.'; }
      });
    fetch(URL_TURNOUT + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { turnout = j; render(); renderTurnout(); })
      .catch(function () {});
  }

  document.querySelectorAll('.er-scope button').forEach(function (b) {
    b.addEventListener('click', function () {
      scope = b.getAttribute('data-scope');
      try { localStorage.setItem('bcrResultsScope', scope); } catch (e) {}
      document.querySelectorAll('.er-scope button').forEach(function (o) {
        var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
    if (b.getAttribute('data-scope') === scope) b.click();
  });

  load();
  setInterval(load, 60000);
})();
