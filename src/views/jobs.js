/* Jobs tab: every work order ExpertPM sent this vendor (the CRM portal's
   "Work requests from ExpertPM" card). Each row opens the same /work/<token>
   page the text links to, where pricing, accepting, declining and marking
   done happen. Browser code inside String.raw: no backticks, no dollar-brace. */
export const JOBS_VIEW_JS = String.raw`
(function(){
  function wpill(w){
    if (w.status === 'sent') return '<span class="pill wait">' + (w.bill_after ? 'Needs a finish date' : 'Needs your price') + '</span>';
    if (w.status === 'quoted') return '<span class="pill wait">Price sent, office reviewing</span>';
    if (w.status === 'done_review') return '<span class="pill wait">Charge sent, office reviewing</span>';
    if (w.status === 'active') return '<span class="pill ok">' + (w.bill_after ? 'Yours: bill when done' : (w.recurring ? 'Yours: recurring' : 'Approved: go ahead')) + '</span>';
    if (w.status === 'completed') return '<span class="pill ok">Completed</span>';
    if (w.status === 'declined') return '<span class="pill bad">You passed</span>';
    if (w.status === 'ended') return '<span class="pill bad">Service ended</span>';
    if (w.status === 'canceled') return '<span class="pill bad">Withdrawn</span>';
    return '<span class="pill wait">' + esc(w.status) + '</span>';
  }
  function act(w){
    var href = '/work/' + encodeURIComponent(w.token);
    if (w.status === 'sent') return '<a class="btn gold sm" href="' + href + '">' + (w.bill_after ? 'Accept &rarr;' : 'Price it &rarr;') + '</a>';
    if (w.status === 'active' && w.bill_after) return '<a class="btn gold sm" href="' + href + '">Finish &amp; bill</a>';
    if (w.status === 'active' && !w.recurring) return '<a class="btn ghost sm" href="' + href + '">Mark done</a>';
    return '<a class="btn ghost sm" href="' + href + '">View</a>';
  }
  VIEWS.jobs = function(el){
    el.innerHTML = '<h1>Jobs</h1><p class="lead">New work lands here the moment ExpertPM sends it. Anything marked <b>needs your price</b> is waiting on you: tap it, put your price on each property, and the office reviews before any work starts.</p><div id="wList"><div class="empty">Loading...</div></div>';
    api('/api/vendor/work').then(function(d){
      var rows = d.rows || [];
      setCount('jobs', rows.filter(function(w){ return w.status === 'sent'; }).length);
      var box = document.getElementById('wList'); if (!box) return;
      if (!rows.length) { box.innerHTML = '<div class="empty">No work from ExpertPM yet. When we send you a job, it shows up here and you get a text.</div>'; return; }
      box.innerHTML = '<div class="card">' + rows.map(function(w){
        var svc = esc(w.service || '') + (w.recurring ? ' &middot; recurring' + (w.frequency ? ' &middot; ' + esc(String(w.frequency).toLowerCase()) : '') : ' &middot; one-time') +
          (w.earliest_start ? ' &middot; start ' + esc(w.earliest_start) + ' or later' : '') + (w.target_date ? ' &middot; by ' + esc(w.target_date) : '') + (w.promised_by ? ' &middot; promised ' + esc(w.promised_by) : '');
        var price = w.cost != null ? '<span class="money">' + money(w.cost) + '</span>' + (w.recurring ? '<span class="hint">/visit</span>' : '') : '';
        return '<div class="item"><div class="main"><b>' + esc(w.property || '') + '</b><span class="sub">' + svc + '</span>' +
          (w.office_note && w.status === 'sent' ? '<div class="reason">Office: ' + esc(w.office_note) + '</div>' : '') +
          '<div style="margin-top:6px;">' + wpill(w) + '</div></div>' +
          '<div class="side">' + price + act(w) + '</div></div>';
      }).join('') + '</div>';
    });
  };
})();
`;
