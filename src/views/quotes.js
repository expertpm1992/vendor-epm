/* Quotes tab: quote requests from ExpertPM (the CRM portal's "Quote requests"
   card). Price each property or tick can't service, then send. Decided lines
   are locked. Browser code inside String.raw: no backticks, no dollar-brace. */
export const QUOTES_VIEW_JS = String.raw`
(function(){
  function stat(l){
    if (l.price_status === 'accepted') return '<span class="pill ok">Accepted</span>';
    if (l.price_status === 'rejected') return '<span class="pill bad">Rejected</span>';
    if (l.price_status === 'revise') return '<span class="pill wait">Please revise</span>' + (l.revise_note ? '<div class="reason">' + esc(l.revise_note) + '</div>' : '');
    if (l.price_status === 'submitted') return '<span class="pill wait">Under review</span>';
    return '';
  }
  function load(el){
    api('/api/vendor/quotes').then(function(d){
      var quotes = d.quotes || [];
      setCount('quotes', quotes.filter(function(q){ return q.my_status === 'sent'; }).length);
      var box = document.getElementById('qList'); if (!box) return;
      if (!quotes.length) { box.innerHTML = '<div class="empty">No open quote requests. When ExpertPM asks you to price something, it shows up here and you get a text.</div>'; return; }
      box.innerHTML = quotes.map(function(q){
        var open = q.lines.some(function(l){ return !l.price_status || l.price_status === 'revise'; });
        var h = '<div class="card qbox" data-q="' + q.id + '"><h2>' + esc(q.service) + '</h2><p class="hint">Priced ' + esc(q.price_basis) + (q.due_date ? ' &middot; respond by ' + esc(q.due_date) : '') + '</p>' +
          (q.notes ? '<p class="hint" style="margin-top:6px; white-space:pre-line;">' + esc(q.notes) + '</p>' : '');
        q.lines.forEach(function(l){
          var editable = !l.price_status || l.price_status === 'revise';
          var extras = '';
          if (l.note) extras += '<span class="sub">' + esc(l.note) + '</span>';
          if ((l.photo_keys || []).length) extras += '<span class="sub">' + l.photo_keys.map(function(k, i){ return '<a href="/api/vendor/qphoto?key=' + encodeURIComponent(k) + '" target="_blank" rel="noopener" style="color:var(--gold-text); font-weight:800; margin-right:10px;">photo ' + (i + 1) + '</a>'; }).join('') + '</span>';
          var right;
          if (editable) right = '<label style="display:flex; align-items:center; gap:4px; font-weight:800;">$<input type="text" inputmode="decimal" class="qPrice" placeholder="0.00" value="' + (l.price != null ? esc(l.price) : '') + '" style="width:104px; padding:10px;"></label>' +
            '<label style="display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); font-weight:700;"><input type="checkbox" class="qCant"' + (l.cant_service ? ' checked' : '') + '> can’t service</label>';
          else right = l.cant_service ? '<span class="hint">can’t service</span>' : '<span class="money">' + money(l.price) + '</span>';
          h += '<div class="item" data-line="' + l.id + '"><div class="main"><b>' + esc(l.property_name) + '</b>' + extras + '<div style="margin-top:6px;">' + stat(l) + '</div></div><div class="side">' + right + '</div></div>';
        });
        if (open) h += '<button type="button" class="btn wide qSend">Send prices to ExpertPM</button><div class="msg qMsg"></div>';
        return h + '</div>';
      }).join('');
    });
  }
  VIEWS.quotes = function(el){
    el.innerHTML = '<h1>Quotes</h1><p class="lead">ExpertPM asked you to price these. Enter a price for each property, or tick <b>can’t service</b> on ones you don’t cover, and send it back. You’ll see accepted, rejected, or revision notes right here.</p><div id="qList"><div class="empty">Loading...</div></div>';
    el.onclick = function(e){
      var btn = e.target.closest('.qSend'); if (!btn) return;
      var box = btn.closest('.qbox'), prices = [];
      box.querySelectorAll('.item[data-line]').forEach(function(it){
        var pi = it.querySelector('.qPrice'); if (!pi) return;
        prices.push({ line_id: Number(it.dataset.line), price: Number(String(pi.value).replace(/[$,\s]/g, '')), cant_service: it.querySelector('.qCant').checked });
      });
      var m = box.querySelector('.qMsg');
      btn.disabled = true; btn.textContent = 'Sending...';
      post('/api/vendor/quotes/submit', { request_id: Number(box.dataset.q), prices: prices }).then(function(d){
        if (d.ok) load(el);
        else { btn.disabled = false; btn.textContent = 'Send prices to ExpertPM'; flash(m, false, d.error || 'Could not submit. Try again.'); }
      }).catch(function(err){ if (err.message !== 'auth') { btn.disabled = false; btn.textContent = 'Send prices to ExpertPM'; flash(m, false, 'Network problem. Try again.'); } });
    };
    load(el);
  };
})();
`;
