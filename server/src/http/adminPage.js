// Αυτόνομη σελίδα διαχείρισης (σερβίρεται στο /admin). Χωρίς εξαρτήσεις/build.
// Ζητά το ADMIN_TOKEN, το αποθηκεύει τοπικά, και καλεί τα /api/admin/* endpoints.
export const ADMIN_PAGE = `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Democratia — Διαχείριση</title>
<style>
  :root { --brand:#2563eb; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin:0; background:#f1f5f9; color:#0f172a; }
  header { background:linear-gradient(135deg,#1d4ed8,#2563eb); color:#fff; padding:18px 16px; }
  header h1 { margin:0; font-size:18px; }
  header p { margin:4px 0 0; font-size:12px; opacity:.85; }
  main { max-width:680px; margin:0 auto; padding:16px; }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin-bottom:16px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
  label { display:block; font-size:13px; font-weight:600; margin:10px 0 4px; }
  input, select, textarea { width:100%; padding:9px 10px; border:1px solid #cbd5e1; border-radius:9px; font-size:14px; font-family:inherit; }
  textarea { min-height:120px; resize:vertical; }
  .row { display:flex; gap:10px; } .row > div { flex:1; }
  button { background:var(--brand); color:#fff; border:0; border-radius:10px; padding:11px 16px; font-size:14px; font-weight:700; cursor:pointer; }
  button.sec { background:#e2e8f0; color:#0f172a; }
  button.danger { background:#ef4444; }
  .msg { padding:10px 12px; border-radius:9px; font-size:13px; margin-top:10px; display:none; }
  .msg.ok { background:#dcfce7; color:#166534; } .msg.err { background:#fee2e2; color:#991b1b; }
  .muted { color:#64748b; font-size:12px; }
  .item { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 0; border-top:1px solid #f1f5f9; }
  .item:first-child { border-top:0; }
  h2 { font-size:15px; margin:0 0 8px; }
</style>
</head>
<body>
<header>
  <h1>🗳️ Democratia — Διαχείριση</h1>
  <p>Καταχώρηση ψηφισμάτων & αποτελεσμάτων (Βουλή / Ευρωκοινοβούλιο / Δήμος)</p>
</header>
<main>
  <div class="card" id="auth">
    <h2>Σύνδεση</h2>
    <label>Κωδικός διαχειριστή (ADMIN_TOKEN)</label>
    <input id="token" type="password" placeholder="Επικόλλησε τον κωδικό" />
    <div style="margin-top:10px"><button onclick="login()">Σύνδεση</button></div>
    <div id="authMsg" class="msg"></div>
  </div>

  <div id="app" style="display:none">
    <div class="card">
      <h2>Νέο / ενημέρωση ψηφίσματος</h2>
      <div class="row">
        <div>
          <label>Επίπεδο</label>
          <select id="society">
            <option value="greece">Ελλάδα — Βουλή</option>
            <option value="eu">Ευρωπαϊκή Ένωση — Ευρωκοινοβούλιο</option>
            <option value="athens">Αθήνα — Δήμος</option>
          </select>
        </div>
        <div>
          <label>Κατηγορία</label>
          <select id="category">
            <option>Οικονομία</option><option>Περιβάλλον</option><option>Πολιτισμός</option>
            <option>Παιδεία</option><option>Υγεία</option><option>Υποδομές</option>
          </select>
        </div>
      </div>
      <label>Τίτλος *</label>
      <input id="title" placeholder="π.χ. Νομοσχέδιο για ..." />
      <label>Αναγνωριστικό (προαιρετικό — για ενημέρωση υπάρχοντος)</label>
      <input id="id" placeholder="π.χ. nomos-2024-12" />
      <div class="row">
        <div><label>Ανάρτηση</label><input id="uploadedAt" type="date" /></div>
        <div><label>Προθεσμία ψήφου</label><input id="voteDeadline" type="date" /></div>
        <div><label>Ημ. κοινοβουλίου</label><input id="parliamentDate" type="date" /></div>
      </div>
      <div class="row">
        <div>
          <label>Κατάσταση</label>
          <select id="status"><option value="open">Ανοιχτό</option><option value="closed">Κλειστό</option></select>
        </div>
        <div><label>Σύνδεσμος επίσημης πηγής</label><input id="referenceUrl" placeholder="https://www.hellenicparliament.gr/..." /></div>
      </div>
      <label>Πλήρες κείμενο (προαιρετικό)</label>
      <textarea id="fullText" placeholder="Επικόλλησε το πλήρες κείμενο ή άσε κενό και βάλε μόνο τον σύνδεσμο πηγής."></textarea>
      <label>Σύνοψη TL;DR (προαιρετικό — αλλιώς δημιουργείται αυτόματα)</label>
      <input id="tldr" placeholder="Μία-δύο προτάσεις σύνοψης" />

      <h2 style="margin-top:16px">Επίσημο αποτέλεσμα (προαιρετικό)</h2>
      <div class="row">
        <div><label>ΥΠΕΡ</label><input id="oyes" type="number" min="0" /></div>
        <div><label>ΚΑΤΑ</label><input id="ono" type="number" min="0" /></div>
        <div><label>ΑΠΟΧΗ</label><input id="oabs" type="number" min="0" /></div>
        <div>
          <label>Έκβαση</label>
          <select id="ooutcome"><option value="">—</option><option value="adopted">Υπερψηφίστηκε</option><option value="rejected">Καταψηφίστηκε</option></select>
        </div>
      </div>

      <div style="margin-top:14px"><button onclick="save()">💾 Αποθήκευση</button>
        <button class="sec" onclick="clearForm()">Καθαρισμός</button></div>
      <div id="saveMsg" class="msg"></div>
    </div>

    <div class="card">
      <h2>📊 Αναφορές / Στατιστικά</h2>
      <p class="muted">Μόνο αριθμοί συμμετοχής — ποτέ δεν εμφανίζεται «τι ψήφισε» κάποιος.</p>
      <div style="margin:8px 0"><button class="sec" onclick="loadReports()">Ανανέωση</button></div>
      <div id="reports"><p class="muted">Φόρτωση…</p></div>
    </div>

    <div class="card">
      <h2>Υπάρχοντα ψηφίσματα</h2>
      <select id="listSociety" onchange="loadList()">
        <option value="greece">Ελλάδα — Βουλή</option>
        <option value="eu">Ευρωπαϊκή Ένωση</option>
        <option value="athens">Αθήνα — Δήμος</option>
      </select>
      <div id="list" style="margin-top:8px"></div>
    </div>
  </div>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  let TOKEN = localStorage.getItem('democratia.adminToken') || '';

  function headers() { return { 'Content-Type':'application/json', 'Authorization':'Bearer '+TOKEN }; }
  function show(el, ok, text){ el.className='msg '+(ok?'ok':'err'); el.textContent=text; el.style.display='block'; }

  async function login(){
    TOKEN = $('token').value.trim();
    const r = await fetch('/api/admin/ping', { headers: headers() });
    if (r.ok){ localStorage.setItem('democratia.adminToken', TOKEN); $('auth').style.display='none'; $('app').style.display='block'; loadList(); loadReports(); }
    else { show($('authMsg'), false, 'Λάθος κωδικός ή απενεργοποιημένη διαχείριση (δες ADMIN_TOKEN).'); }
  }

  async function save(){
    const body = {
      id: $('id').value.trim() || undefined,
      society: $('society').value,
      category: $('category').value,
      title: $('title').value.trim(),
      uploadedAt: $('uploadedAt').value || null,
      voteDeadline: $('voteDeadline').value || null,
      parliamentDate: $('parliamentDate').value || null,
      status: $('status').value,
      referenceUrl: $('referenceUrl').value.trim() || null,
      fullText: $('fullText').value.trim() || null,
      summary: $('tldr').value.trim() ? { tldr: $('tldr').value.trim(), keyPoints: [], impact: '', readingTime: '' } : undefined,
      official: ($('oyes').value || $('ono').value) ? {
        yes: $('oyes').value, no: $('ono').value, abstain: $('oabs').value, outcome: $('ooutcome').value || null
      } : undefined,
    };
    if (!body.title){ show($('saveMsg'), false, 'Ο τίτλος είναι υποχρεωτικός.'); return; }
    const r = await fetch('/api/admin/votings', { method:'POST', headers: headers(), body: JSON.stringify(body) });
    const data = await r.json().catch(()=>({}));
    if (r.ok){ show($('saveMsg'), true, '✓ Αποθηκεύτηκε: '+data.title); clearForm(); loadList(); }
    else { show($('saveMsg'), false, 'Σφάλμα: '+(data.error||r.status)); }
  }

  function clearForm(){ ['id','title','uploadedAt','voteDeadline','parliamentDate','referenceUrl','fullText','tldr','oyes','ono','oabs'].forEach(i=>$(i).value=''); }

  async function loadList(){
    const soc = $('listSociety').value;
    const r = await fetch('/api/societies/'+soc+'/votings');
    const items = await r.json().catch(()=>[]);
    $('list').innerHTML = items.length ? '' : '<p class="muted">Κανένα ψήφισμα ακόμη.</p>';
    items.forEach(v=>{
      const d = document.createElement('div'); d.className='item';
      const o = v.official ? ' · ΥΠΕΡ '+v.official.yes+'/ΚΑΤΑ '+v.official.no : '';
      d.innerHTML = '<span><b>'+v.title+'</b><br><span class="muted">'+v.category+' · '+v.status+' · '+(v.source||'')+o+'</span></span>';
      const btn = document.createElement('button'); btn.className='danger'; btn.textContent='Διαγραφή';
      btn.onclick = async ()=>{ if(!confirm('Διαγραφή;'))return; const rr=await fetch('/api/admin/votings/'+encodeURIComponent(v.id),{method:'DELETE',headers:headers()}); if(rr.ok) loadList(); };
      d.appendChild(btn); $('list').appendChild(d);
    });
  }

  function stat(label, value){ return '<div class="item"><span class="muted">'+label+'</span><b>'+value+'</b></div>'; }

  async function loadReports(){
    const r = await fetch('/api/admin/reports', { headers: headers() });
    if (!r.ok){ $('reports').innerHTML = '<p class="muted">Δεν φορτώθηκαν οι αναφορές.</p>'; return; }
    const d = await r.json();
    const o = d.overview, a = d.activity;
    let html = '<h2 style="font-size:13px;margin:6px 0">Σύνοψη</h2>';
    html += stat('Εγγεγραμμένοι χρήστες', o.accounts);
    html += stat('Ενεργές συνεδρίες (συνδεδεμένοι)', o.activeSessions);
    html += stat('Διαγραμμένοι λογαριασμοί', o.accountsDeleted);
    html += stat('Ψηφίσματα (ανοιχτά / σύνολο)', o.votingsOpen+' / '+o.votings);
    html += stat('Σύνολο ψήφων', o.votesTotal);
    html += stat('Σχόλια κοινότητας', o.comments);
    html += '<h2 style="font-size:13px;margin:14px 0 6px">Δραστηριότητα</h2>';
    html += stat('Ψήφοι τελευταίο 24ωρο', a.votesLast24h);
    html += stat('Ψήφοι τελευταία 7 ημέρες', a.votesLast7d);
    html += stat('Ψήφοι τελευταίες 30 ημέρες', a.votesLast30d);
    html += stat('Ενεργοί ψηφοφόροι (7 ημ.)', a.activeVoters7d);
    html += stat('Ενεργοί ψηφοφόροι (30 ημ.)', a.activeVoters30d);
    html += stat('Νέοι λογαριασμοί (7 ημ.)', a.newAccounts7d);
    html += stat('Νέοι λογαριασμοί (30 ημ.)', a.newAccounts30d);
    if (d.perVoting && d.perVoting.length){
      html += '<h2 style="font-size:13px;margin:14px 0 6px">Συμμετοχή ανά ψήφισμα</h2>';
      d.perVoting.forEach(v=>{
        html += '<div class="item"><span><b>'+v.title+'</b><br><span class="muted">'+v.status+' · ΥΠΕΡ '+v.tally.yes+' / ΚΑΤΑ '+v.tally.no+' / ΑΠΟΧΗ '+v.tally.present+'</span></span><b>'+v.turnout+' ψήφοι</b></div>';
      });
    }
    $('reports').innerHTML = html;
  }

  if (TOKEN){ $('token').value = TOKEN; login(); }
</script>
</body>
</html>`;
