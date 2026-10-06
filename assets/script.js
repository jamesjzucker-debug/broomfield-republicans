// Mobile menu toggle + simple nav active highlighting
(function () {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Highlight current nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href === path || (path === '' && href === 'index.html'))) {
      a.classList.add('active');
    }
  });
})();

// 2026 Voter Guide popup.
// Shows once per browser session, a moment after the page loads, on every page that loads script.js.
// Turns itself off after polls close on Election Day (Nov 3 2026, 7 PM Mountain).
// To retire it early: delete this block. Assets: assets/img/voter-guide-2026-preview.jpg, voter-guide.html.
(function () {
  var END = Date.parse('2026-11-03T19:00:00-07:00');
  if (Date.now() > END) return;
  var page = location.pathname.split('/').pop().replace(/\.html$/, '');
  if (['voter-guide', 'privacy'].indexOf(page) !== -1) return;

  var KEY = 'bcrVoterGuide2026Seen';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  var css = '' +
    '.vg-pop{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,20,40,.72);opacity:0;transition:opacity .25s}' +
    '.vg-pop.is-open{opacity:1}' +
    '.vg-pop__box{position:relative;background:#fff;width:100%;max-width:560px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;border-top:6px solid #C22600;border-radius:6px;box-shadow:0 30px 80px rgba(0,0,0,.45);overflow:hidden;transform:translateY(12px);transition:transform .25s}' +
    '.vg-pop.is-open .vg-pop__box{transform:none}' +
    '.vg-pop__head{padding:18px 54px 12px 20px}' +
    '.vg-pop__eyebrow{font:800 .72rem/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#C22600;margin:0 0 6px}' +
    '.vg-pop__title{font-family:"Bebas Neue",Impact,sans-serif;font-weight:400;font-size:2.1rem;line-height:1;color:#002F61;margin:0 0 6px;letter-spacing:.02em}' +
    '.vg-pop__text{font:500 .95rem/1.4 Inter,sans-serif;color:#44546B;margin:0}' +
    '.vg-pop__img{display:block;flex:1 1 auto;min-height:0;overflow-y:auto;border-top:1px solid #E4E0DA;border-bottom:1px solid #E4E0DA;background:#F4F1EC}' +
    '.vg-pop__img img{display:block;width:100%;height:auto}' +
    '.vg-pop__actions{display:flex;flex-wrap:wrap;gap:8px;padding:14px 20px 16px}' +
    '.vg-pop__btn{flex:1 1 auto;text-align:center;font:800 .8rem/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:13px 14px;border-radius:4px;border:2px solid #002F61;color:#002F61;background:#fff;cursor:pointer}' +
    '.vg-pop__btn--red{background:#C22600;border-color:#C22600;color:#fff}' +
    '.vg-pop__later{flex-basis:100%;background:none;border:0;font:600 .85rem Inter,sans-serif;color:#44546B;text-decoration:underline;cursor:pointer;padding:4px}' +
    '.vg-pop__x{position:absolute;top:10px;right:10px;width:38px;height:38px;border:0;border-radius:50%;background:#F4F1EC;color:#0F1722;font-size:22px;line-height:1;cursor:pointer}' +
    '.vg-pop__x:focus-visible,.vg-pop__btn:focus-visible,.vg-pop__later:focus-visible{outline:3px solid #D6A84A;outline-offset:2px}' +
    '@media (max-height:640px){.vg-pop__head{padding-top:12px}.vg-pop__title{font-size:1.7rem}.vg-pop__text{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.vg-pop,.vg-pop__box{transition:none}}';

  var html = '' +
    '<div class="vg-pop__box" role="dialog" aria-modal="true" aria-labelledby="vg-pop-title">' +
      '<button class="vg-pop__x" type="button" aria-label="Close">&times;</button>' +
      '<div class="vg-pop__head">' +
        '<p class="vg-pop__eyebrow">Ballots are in the mail</p>' +
        '<h2 class="vg-pop__title" id="vg-pop-title">Your 2026 Broomfield Voter Guide</h2>' +
        '<p class="vg-pop__text">Every Republican on your ballot and how we recommend voting on every statewide and Broomfield measure. One page. Keep it next to your ballot.</p>' +
      '</div>' +
      '<a class="vg-pop__img" href="voter-guide"><img src="assets/img/voter-guide-2026-preview.jpg?v=20261005b" width="1120" height="1450" alt="Broomfield County Republicans 2026 voter guide. Click to open the full guide." /></a>' +
      '<div class="vg-pop__actions">' +
        '<a class="vg-pop__btn vg-pop__btn--red" href="voter-guide">See the Full Guide</a>' +
        '<a class="vg-pop__btn" href="assets/voter-guide-2026.pdf?v=20261005b" download>Download PDF</a>' +
        '<button class="vg-pop__later" type="button">Maybe later</button>' +
      '</div>' +
    '</div>';

  function open() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.className = 'vg-pop';
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    var lastFocus = document.activeElement;
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

    function close() {
      wrap.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      setTimeout(function () { wrap.remove(); style.remove(); }, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key === 'Tab') {
        var f = wrap.querySelectorAll('a,button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('.vg-pop__x').addEventListener('click', close);
    wrap.querySelector('.vg-pop__later').addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(function () { wrap.classList.add('is-open'); });
    wrap.querySelector('.vg-pop__x').focus();
  }

  setTimeout(open, 1200);
})();
