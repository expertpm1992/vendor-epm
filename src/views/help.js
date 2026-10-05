/* Help tab: how the portal works, who to call, and what's still coming.
   Browser code inside String.raw: no backticks, no dollar-brace. */
export const HELP_VIEW_JS = String.raw`
VIEWS.help = function(el){
  var soon = [
    ['Change your password any time', 'For now, call or text the office and we will reset it for you.'],
    ['Forgot-password link', 'Same as above: the office resets it.'],
    ['Update your phone, email or trade', 'Tell the office and we will update your account.']
  ];
  el.innerHTML = '<h1>Help</h1><p class="lead">How the ExpertPM vendor portal works.</p>' +
    '<div class="card"><h2>Jobs</h2><p class="hint">When ExpertPM sends you work, you get a text with a private link, and the job shows up under Jobs. Open it to send your price, accept, decline, or mark it done. The office reviews every price before any work starts.</p></div>' +
    '<div class="card"><h2>Quotes</h2><p class="hint">When we ask you to price a service across several properties, put a price on each one (or tick can’t service) and send it back. You’ll see accepted, rejected, or revision notes right there.</p></div>' +
    '<div class="card"><h2>Bills</h2><p class="hint">Submit one bill per property with your invoice attached (PDF or photo, up to 8 MB). Invoice by the 5th, paid on the 10th. If a bill is rejected, the reason shows under it: fix it and resubmit.</p></div>' +
    '<div class="card"><h2>Coming soon</h2>' + soon.map(function(s){ return '<div class="item"><div class="main"><b>' + esc(s[0]) + '</b><span class="sub">' + esc(s[1]) + '</span></div><span class="pill">Coming soon</span></div>'; }).join('') + '</div>' +
    '<div class="card"><h2>Questions? Talk to a real person.</h2><p class="hint">Call or text <a href="tel:+12722035550" style="color:var(--gold-text); font-weight:800;">(272) 203-5550</a> or email <a href="mailto:office@expertpm.com" style="color:var(--gold-text); font-weight:800;">office@expertpm.com</a>.</p></div>';
};
`;
