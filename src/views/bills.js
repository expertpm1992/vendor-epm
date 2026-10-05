/* Bills tab: submit a bill to ExpertPM and see every bill's status (the CRM
   portal's "Submit a bill" and "Your bills" cards). Browser code inside
   String.raw: no backticks, no dollar-brace. */
export const BILLS_VIEW_JS = String.raw`
(function(){
  function pill(b){
    if (b.status === 'approved') return '<span class="pill ok">Approved</span>';
    if (b.status === 'rejected') return '<span class="pill bad">Rejected</span>' + (b.reject_reason ? '<div class="reason">' + esc(b.reject_reason) + '</div>' : '');
    return '<span class="pill wait">Under review</span>';
  }
  function list(){
    api('/api/vendor/bills').then(function(d){
      var box = document.getElementById('bList'); if (!box) return;
      var bills = d.bills || [];
      if (!bills.length) { box.innerHTML = '<div class="empty">Nothing submitted yet. Your first bill will show up here.</div>'; return; }
      box.innerHTML = '<div class="card">' + bills.map(function(b){
        var dt = new Date(String(b.created_at).replace(' ', 'T') + 'Z');
        var when = isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month:'short', day:'numeric' });
        return '<div class="item"><div class="main"><b>' + esc(b.property_name || 'No property') + '</b>' +
          '<span class="sub">Sent ' + esc(when) + (b.invoice_no ? ' &middot; Invoice ' + esc(b.invoice_no) : '') + (b.work_date ? ' &middot; work ' + esc(b.work_date) : '') + '</span>' +
          (b.description ? '<span class="sub">' + esc(String(b.description).slice(0, 120)) + '</span>' : '') +
          (b.file_name ? '<span class="sub"><a href="/api/vendor/file/' + Number(b.id) + '" target="_blank" rel="noopener" style="color:var(--gold-text); font-weight:800;">' + esc(b.file_name) + '</a></span>' : '') +
          '<div style="margin-top:6px;">' + pill(b) + '</div></div>' +
          '<div class="side"><span class="money">' + money(b.amount) + '</span></div></div>';
      }).join('') + '</div>';
    });
  }
  VIEWS.bills = function(el){
    el.innerHTML = '<h1>Bills</h1><p class="lead">Attach your invoice and fill in what you can. The ExpertPM team reviews every submission and you’ll see the status below. One property per bill: billing several properties? Submit one per property so each gets paid right.</p>' +
      '<form class="card" id="bf" novalidate><h2>Submit a bill</h2>' +
      '<div class="row2"><div><label class="f" for="bInv">Invoice #</label><input type="text" id="bInv" placeholder="e.g. 2026-081"></div>' +
      '<div><label class="f" for="bAmt">Amount ($)</label><input type="text" inputmode="decimal" id="bAmt" placeholder="450.00" required></div></div>' +
      '<div class="row2"><div><label class="f" for="bDate">Work date</label><input type="date" id="bDate"></div>' +
      '<div><label class="f" for="bProp">Property <small>(optional)</small></label><select id="bProp"><option value="">Pick if it applies</option></select></div></div>' +
      '<label class="f" for="bDesc">What was the work?</label><textarea id="bDesc" placeholder="Monthly mowing, all ExpertPM properties, July"></textarea>' +
      '<label class="f" for="bFile">Invoice file <small>(PDF or photo, up to 8 MB)</small></label>' +
      '<input type="file" id="bFile" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/*">' +
      '<button type="submit" class="btn wide" id="bGo">Submit bill</button><div class="msg" id="bMsg"></div></form>' +
      '<h2 style="font-size:16px; font-weight:900; color:var(--navy-900); margin:18px 0 4px;">Your bills</h2><p class="hint" style="margin-bottom:10px;">Approved bills are in ExpertPM’s accounting queue for payment. If something’s rejected, the reason is right under it: fix and resubmit.</p>' +
      '<div id="bList"><div class="empty">Loading...</div></div>';
    api('/api/vendor/properties').then(function(d){
      var sel = document.getElementById('bProp'); if (!sel) return;
      sel.innerHTML = '<option value="">Pick if it applies</option>' + (d.properties || []).map(function(p){ return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('');
    });
    document.getElementById('bf').addEventListener('submit', function(e){
      e.preventDefault();
      var m = document.getElementById('bMsg'), go = document.getElementById('bGo');
      var f = document.getElementById('bFile').files[0];
      if (f && f.size > 8 * 1024 * 1024) { flash(m, false, 'That file is over 8 MB. Export a smaller PDF or photo.'); return; }
      var fd = new FormData();
      fd.append('invoice_no', document.getElementById('bInv').value);
      fd.append('amount', String(document.getElementById('bAmt').value).replace(/[$,\s]/g, ''));
      fd.append('work_date', document.getElementById('bDate').value);
      fd.append('property', document.getElementById('bProp').value);
      fd.append('description', document.getElementById('bDesc').value);
      if (f) fd.append('file', f);
      flash(m, true, 'Sending...'); go.disabled = true;
      api('/api/vendor/bills', { method:'POST', body: fd }).then(function(d){
        go.disabled = false;
        if (d.ok) { flash(m, true, 'Sent. ExpertPM will review it shortly.'); document.getElementById('bf').reset(); list(); }
        else flash(m, false, d.error || 'Could not submit. Try again.');
      }).catch(function(err){ go.disabled = false; if (err.message !== 'auth') flash(m, false, 'Network problem. Try again.'); });
    });
    list();
  };
})();
`;
