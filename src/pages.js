/* The portal's pages: sign-in and the app shell. Brand matches the CRM
   (navy + gold, Inter, the ExpertPM logo). Built for phones first: vendors
   open this from a text, standing in a driveway.
   Each tab's screen lives in src/views/ and registers itself on VIEWS. */

import { HELP_VIEW_JS } from "./views/help.js";
import { JOBS_VIEW_JS } from "./views/jobs.js";
import { QUOTES_VIEW_JS } from "./views/quotes.js";
import { BILLS_VIEW_JS } from "./views/bills.js";

export const ASSET_BASE = "https://epmwebsite.up.railway.app";
export const LOGO = ASSET_BASE + "/lovable-uploads/9d675ac9-4658-4cc9-ac38-b78f7e3c7c2e.png";
export const OFFICE_FOOT = 'ExpertPM, Bloomsburg Office<br>36 West Main Street, Bloomsburg PA 17815<br><a href="tel:+12722035550">(272) 203-5550</a> &middot; <a href="mailto:office@expertpm.com">office@expertpm.com</a>';

const HEAD = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#061147">
<link rel="icon" href="${LOGO}" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{ --navy-900:hsl(230 85% 15%); --navy-800:hsl(230 70% 22%); --gold:hsl(45 95% 55%); --gold-dark:hsl(42 90% 45%); --gold-text:hsl(38 90% 34%); --ink:#1a1f36; --muted:#5b6478; --line:#e3e6ee; --bg:#f4f5f8; --card:#fff; --bad:hsl(0 65% 42%); --good:hsl(140 55% 28%); }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ font-family:'Inter',system-ui,sans-serif; color:var(--ink); background:var(--bg); min-height:100svh; -webkit-text-size-adjust:100%; }
  button, input, select, textarea{ font:inherit; }
  [hidden]{ display:none !important; }
</style>`;

export const LOGIN_HTML = HEAD("ExpertPM Vendor Portal | Sign In") + `
<style>
  body{ display:grid; place-items:center; background:var(--navy-900); padding:24px 16px; }
  .card{ width:min(400px,100%); background:var(--card); border-radius:20px; padding:32px 24px 24px; box-shadow:0 30px 60px -30px hsl(230 80% 5% / .6); }
  .logo{ display:block; height:52px; margin:0 auto 10px; }
  h1{ text-align:center; font-size:1.35rem; font-weight:900; letter-spacing:-.02em; color:var(--navy-900); }
  .sub{ text-align:center; color:var(--muted); font-size:14px; margin:6px 0 22px; line-height:1.5; }
  .fld{ margin-bottom:14px; }
  .fld label{ display:block; font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .fld input{ width:100%; padding:13px 14px; border:1.5px solid var(--line); border-radius:12px; font-size:16px; background:#fff; }
  .fld input:focus{ outline:none; border-color:var(--gold); box-shadow:0 0 0 4px hsl(45 95% 55% / .18); }
  .go{ width:100%; padding:14px; border:0; border-radius:999px; background:var(--navy-900); color:#fff; font-weight:800; font-size:16px; cursor:pointer; margin-top:4px; }
  .go:disabled{ opacity:.6; cursor:default; }
  .err{ display:none; margin-top:14px; padding:10px 12px; border-radius:10px; background:hsl(0 80% 96%); color:var(--bad); font-size:14px; font-weight:600; }
  .help{ text-align:center; color:var(--muted); font-size:13px; margin-top:16px; line-height:1.6; }
  .foot{ margin-top:18px; padding-top:14px; border-top:1px solid var(--line); text-align:center; font-size:12px; color:var(--muted); line-height:1.8; }
  .foot a, .help a{ color:var(--gold-text); font-weight:800; text-decoration:none; }
  .banner{ background:hsl(45 95% 92%); border:1px solid hsl(45 85% 70%); color:hsl(38 80% 25%); border-radius:12px; padding:10px 12px; font-size:13px; margin-bottom:16px; line-height:1.45; }
</style>
</head>
<body>
  <form class="card" id="f" novalidate>
    <img class="logo" src="${LOGO}" alt="ExpertPM">
    <h1>Vendor Portal</h1>
    <p class="sub">Sign in to see your jobs, price quote requests, and submit bills to ExpertPM.</p>
    <!--PREVIEW-->
    <div class="fld"><label for="em">Email</label><input id="em" type="email" autocomplete="username" inputmode="email" required></div>
    <div class="fld"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required></div>
    <button class="go" id="go" type="submit">Sign in</button>
    <div class="err" id="err" role="alert"></div>
    <p class="help">Forgot your password, or don't have an account yet? Call or text the office at <a href="tel:+12722035550">(272) 203-5550</a>. Want to work with us? <a href="/vendors/">Apply here</a>.</p>
    <div class="foot">${OFFICE_FOOT}</div>
  </form>
<script>
  var f = document.getElementById('f'), err = document.getElementById('err'), go = document.getElementById('go');
  f.addEventListener('submit', function(e){
    e.preventDefault();
    err.style.display = 'none'; go.disabled = true; go.textContent = 'Signing in...';
    fetch('/api/vendor/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({
      email: document.getElementById('em').value, password: document.getElementById('pw').value
    }) }).then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })
      .then(function(x){
        if (x.ok && x.d.ok) { location.href = '/app'; return; }
        err.textContent = x.d.error || 'Sign-in failed'; err.style.display = 'block';
        go.disabled = false; go.textContent = 'Sign in';
      })
      .catch(function(){ err.textContent = 'Network problem. Try again.'; err.style.display = 'block'; go.disabled = false; go.textContent = 'Sign in'; });
  });
</script>
</body>
</html>`;

export const PREVIEW_LOGIN_NOTE = '<div class="banner">Preview: this portal is still being built. Keep using the vendor portal and links ExpertPM texts you for real work.</div>';

/* Shared look for every tab (cards, pills, forms), so views stay small. */
const APP_CSS = `
  .top{ background:var(--navy-900); color:#fff; padding:12px 16px; display:flex; align-items:center; gap:12px; }
  .top img{ height:32px; width:32px; background:#fff; border-radius:9px; padding:3px; }
  .top .t{ flex:1; min-width:0; }
  .top .t b{ display:block; font-size:15px; font-weight:900; letter-spacing:-.01em; }
  .top .t span{ display:block; font-size:12px; color:hsl(220 30% 80%); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .top button{ border:1.5px solid hsl(0 0% 100% / .3); background:none; color:#fff; font-weight:700; font-size:12.5px; padding:8px 14px; border-radius:999px; cursor:pointer; }
  .tabs{ position:sticky; top:0; z-index:5; background:var(--navy-900); display:flex; gap:4px; padding:0 10px 10px; overflow-x:auto; }
  .tabs button{ flex:1 0 auto; border:0; background:hsl(230 60% 25%); color:hsl(220 30% 85%); font-weight:800; font-size:14px; padding:10px 14px; border-radius:999px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
  .tabs button.on{ background:var(--gold); color:var(--navy-900); }
  .tabs .n{ background:hsl(0 70% 50%); color:#fff; font-size:11px; border-radius:999px; padding:1px 7px; }
  main{ max-width:860px; margin:0 auto; padding:16px 14px 40px; }
  .banner{ background:hsl(45 95% 92%); border:1px solid hsl(45 85% 70%); color:hsl(38 80% 25%); border-radius:12px; padding:10px 14px; font-size:13.5px; margin-bottom:14px; line-height:1.45; }
  h1{ font-size:1.3rem; font-weight:900; letter-spacing:-.02em; color:var(--navy-900); margin:4px 0 4px; }
  .lead{ color:var(--muted); font-size:14px; line-height:1.5; margin-bottom:14px; }
  .card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; margin-bottom:12px; min-width:0; }
  .card h2{ font-size:16px; font-weight:900; color:var(--navy-900); margin-bottom:4px; }
  .hint{ font-size:13px; color:var(--muted); line-height:1.5; }
  .empty{ background:var(--card); border:1px dashed var(--line); border-radius:14px; padding:22px; color:var(--muted); text-align:center; font-size:14px; }
  label.f{ display:block; font-size:11px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--muted); margin:12px 0 5px; }
  label.f small{ text-transform:none; letter-spacing:0; font-weight:600; }
  .card input:not([type=checkbox]):not([type=file]), .card select, .card textarea{ width:100%; padding:12px; border:1.5px solid var(--line); border-radius:11px; font-size:16px; background:#fff; color:var(--ink); }
  .card textarea{ resize:vertical; min-height:72px; line-height:1.45; }
  .card input:focus, .card select:focus, .card textarea:focus{ outline:none; border-color:var(--gold); box-shadow:0 0 0 4px hsl(45 95% 55% / .16); }
  .row2{ display:grid; grid-template-columns:1fr 1fr; gap:0 10px; }
  @media (max-width:520px){ .row2{ grid-template-columns:1fr; } }
  .btn{ display:inline-flex; align-items:center; justify-content:center; border:0; border-radius:999px; font-weight:800; font-size:15px; padding:13px 20px; cursor:pointer; text-decoration:none; background:var(--navy-900); color:#fff; }
  .btn.gold{ background:linear-gradient(135deg,var(--gold),var(--gold-dark)); color:var(--navy-900); }
  .btn.ghost{ background:#fff; border:1.5px solid var(--line); color:var(--navy-900); }
  .btn.wide{ width:100%; margin-top:14px; }
  .btn.sm{ font-size:13px; padding:9px 14px; }
  button:disabled{ opacity:.6; cursor:default; }
  .msg{ font-size:13.5px; font-weight:700; margin-top:10px; min-height:1em; }
  .msg.ok{ color:var(--good); } .msg.bad{ color:var(--bad); }
  .pill{ display:inline-block; font-size:11.5px; font-weight:800; padding:4px 10px; border-radius:999px; white-space:nowrap; background:var(--line); color:var(--muted); }
  .pill.wait{ background:hsl(42 90% 92%); color:hsl(35 80% 28%); }
  .pill.ok{ background:hsl(140 45% 92%); color:hsl(140 55% 26%); }
  .pill.bad{ background:hsl(0 70% 95%); color:hsl(0 60% 38%); }
  .reason{ font-size:12.5px; color:hsl(0 60% 38%); margin-top:4px; }
  .item{ display:flex; gap:12px; align-items:flex-start; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--line); }
  .item:last-child{ border-bottom:0; }
  .item .main{ flex:1; min-width:0; }
  .item b{ color:var(--navy-900); font-size:14.5px; }
  .item .sub{ display:block; font-size:12.5px; color:var(--muted); margin-top:3px; line-height:1.45; }
  .item .side{ text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .money{ font-weight:900; color:var(--navy-900); font-variant-numeric:tabular-nums; }
  .modal{ position:fixed; inset:0; z-index:50; background:hsl(230 60% 10% / .65); display:flex; align-items:center; justify-content:center; padding:16px; }
  .modal .card{ max-width:400px; width:100%; }
  .contact{ text-align:center; font-size:12.5px; color:var(--muted); line-height:1.8; margin-top:18px; }
  .contact a{ color:var(--gold-text); font-weight:800; text-decoration:none; }
`;

export const APP_HTML = HEAD("ExpertPM Vendor Portal") + `
<style>${APP_CSS}</style>
</head>
<body>
  <div class="top">
    <img src="${LOGO}" alt="ExpertPM">
    <div class="t"><b>Vendor Portal</b><span id="who">&nbsp;</span></div>
    <button type="button" id="out">Sign out</button>
  </div>
  <nav class="tabs" id="tabs" aria-label="Sections"></nav>
  <main>
    <div class="banner" id="banner" hidden>Preview: this portal is still being built. For real work, keep using the links ExpertPM texts you and the current vendor portal. Nothing you do here is texted to anyone.</div>
    <div id="view"></div>
    <div class="contact">${OFFICE_FOOT}</div>
  </main>
  <div class="modal" id="fpWrap" hidden>
    <form class="card" id="fpF">
      <h2>Set your own password</h2>
      <p class="hint">You signed in with the temporary password. Pick your own (10+ characters) to continue.</p>
      <label class="f" for="fp1">New password</label><input type="password" id="fp1" autocomplete="new-password" required>
      <label class="f" for="fp2">Type it again</label><input type="password" id="fp2" autocomplete="new-password" required>
      <button type="submit" class="btn wide">Save password</button>
      <div class="msg" id="fpM"></div>
    </form>
  </div>
<script>
  var ME = null, VIEWS = {}, TABS = [], CUR = 'jobs', COUNTS = {};
  function api(path, opts){
    return fetch(path, opts).then(function(r){
      if (r.status === 401) { location.href = '/'; throw new Error('auth'); }
      return r.json().catch(function(){ return { error: 'Unexpected response (' + r.status + ')' }; });
    });
  }
  function post(path, body){ return api(path, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) }); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function money(n){ return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
  function flash(el, ok, t){ el.className = 'msg ' + (ok ? 'ok' : 'bad'); el.textContent = t; }
  function setCount(key, n){ COUNTS[key] = n; renderTabs(); }
  function renderTabs(){
    document.getElementById('tabs').innerHTML = TABS.map(function(t){
      var n = COUNTS[t.key];
      return '<button type="button" data-tab="' + t.key + '" class="' + (t.key === CUR ? 'on' : '') + '"' + (t.key === CUR ? ' aria-current="page"' : '') + '>' + esc(t.label) + (n ? '<span class="n">' + n + '</span>' : '') + '</button>';
    }).join('');
  }
  function fromHash(){ var h = (location.hash || '').slice(1); CUR = TABS.some(function(t){ return t.key === h; }) ? h : (TABS[0] && TABS[0].key) || 'help'; }
  function render(){
    renderTabs();
    var v = document.getElementById('view'); v.onclick = null; v.onchange = null; v.onsubmit = null;
    if (VIEWS[CUR]) VIEWS[CUR](v); else v.innerHTML = '<div class="empty">Coming soon.</div>';
  }
  document.getElementById('tabs').addEventListener('click', function(e){
    var b = e.target.closest('button[data-tab]'); if (!b) return;
    CUR = b.dataset.tab; history.replaceState(null, '', '/app#' + CUR); render(); window.scrollTo(0, 0);
  });
  window.addEventListener('hashchange', function(){ if (ME) { fromHash(); render(); } });
  document.getElementById('out').addEventListener('click', function(){
    fetch('/api/vendor/logout', { method:'POST' }).then(function(){ location.href = '/'; }, function(){ location.href = '/'; });
  });
  document.getElementById('fpF').addEventListener('submit', function(e){
    e.preventDefault();
    var a = document.getElementById('fp1').value, b = document.getElementById('fp2').value, m = document.getElementById('fpM');
    if (a !== b) { flash(m, false, 'Those don\\u2019t match. Try again.'); return; }
    if (a.length < 10) { flash(m, false, 'Use at least 10 characters.'); return; }
    post('/api/vendor/password/first', { next: a }).then(function(d){
      if (d.ok) document.getElementById('fpWrap').hidden = true;
      else flash(m, false, d.error || 'Could not save. Try again.');
    });
  });
  api('/api/vendor/me').then(function(d){
    ME = d.vendor; TABS = d.tabs || []; COUNTS = d.counts || {};
    document.getElementById('who').textContent = ME.name + (d.via === 'staff' ? ' (signed in with your staff account)' : '');
    if (d.preview) document.getElementById('banner').hidden = false;
    if (d.mustChange) document.getElementById('fpWrap').hidden = false;
    fromHash(); render();
  }).catch(function(e){ if (e.message !== 'auth') document.getElementById('view').innerHTML = '<div class="empty">Could not load your account. Refresh to try again.</div>'; });
</script>
<script>${JOBS_VIEW_JS}</script>
<script>${QUOTES_VIEW_JS}</script>
<script>${BILLS_VIEW_JS}</script>
<script>${HELP_VIEW_JS}</script>
</body>
</html>`;
