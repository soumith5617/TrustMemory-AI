/* =========================================================================
   HOUSEHOLDS-PAGE.JS — household roster + household detail (staged
   backups, reflection cards).
   ========================================================================= */

function pageHouseholds(){
  recalcAll();
  const rows = S.households.map(h=>{
    const sc = SCORES[h.id];
    const placementCount = S.placements.filter(p=>p.householdId===h.id).length;
    return `<div class="rowitem" onclick="nav('householdDetail','${h.id}')">
      <div class="avatar" style="background:#31507A">${initials(h.name)}</div>
      <div class="meta"><div class="name">${h.name}</div><div class="sub">${h.location} · needs ${roleLabel(h.requirement)} · ${placementCount} placement(s) on record</div></div>
      <div class="scores"><div class="scorepill"><div class="v">${sc.difficulty}</div><div class="l">Difficulty</div></div></div>
      <span class="badge ${diffBadgeClass(sc.difficulty)}">${sc.difficulty>=65?'High difficulty':sc.difficulty>=40?'Watch':'Stable'}</span>
    </div>`;
  }).join('');
  return `<div class="pagehead"><div class="eyebrow">Households</div><h1>Household roster</h1><div class="lede">The system evaluates both sides of every placement relationship.</div></div>
    <div class="card"><div class="rowlist">${rows}</div></div>`;
}

/* ---------- Household detail ---------- */
function pageHouseholdDetail(id){
  recalcAll();
  const hh = S.households.find(x=>x.id===id);
  if(!hh) return emptyState('Household not found','');
  const sc = SCORES[hh.id];
  const placements = S.placements.filter(p=>p.householdId===id);
  const evs = householdEvents(id).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  const reflections = S.reflections.filter(r=>r.entityId===id);
  const replacements = placements.filter(p=>p.status==='failed'||p.status==='ended_poor_fit').length;
  return `
  <button class="btn sm" style="margin-bottom:16px;" onclick="nav('households')">← Households</button>
  <div class="detail-head">
    <div class="avatar" style="background:#31507A">${initials(hh.name)}</div>
    <div><h1>${hh.name}</h1>
      <div class="tags">
        <span class="badge neutral">${hh.location}</span>
        <span class="badge neutral">Needs ${roleLabel(hh.requirement)}</span>
        <span class="badge neutral">${hh.schedule}</span>
      </div>
    </div>
  </div>
  <div class="grid g3" style="margin-bottom:24px;">
    <div class="metric"><div class="label">Household difficulty</div><div class="num ${sc.difficulty>=55?'warn':'ok'}">${sc.difficulty}</div><span class="badge ${diffBadgeClass(sc.difficulty)}" style="margin-top:8px;">${sc.difficulty>=65?'High':sc.difficulty>=40?'Watch':'Stable'}</span></div>
    <div class="metric"><div class="label">Placements on record</div><div class="num">${placements.length}</div></div>
    <div class="metric"><div class="label">Replacements requested</div><div class="num ${replacements>=2?'warn':''}">${replacements}</div></div>
  </div>
  <div class="grid g2">
    <div class="section" style="margin:0;">
      <h2>Placement history</h2>
      <div class="card"><div class="rowlist">
        ${placements.map(p=>{
          const helper = S.helpers.find(x=>x.id===p.helperId);
          return `<div class="rowitem" style="cursor:pointer;" onclick="nav('helperDetail','${p.helperId}')">
            <div class="avatar" style="background:${helper?helper.color:'#888'}">${helper?initials(helper.name):'?'}</div>
            <div class="meta"><div class="name">${helper?helper.name:p.helperId}</div><div class="sub">${roleLabel(p.role)} · ${fmtDate(p.start)} – ${p.end?fmtDate(p.end):'ongoing'}</div></div>
            <span class="badge ${p.status==='active'?'ok':(p.status==='failed'||p.status==='ended_poor_fit')?'bad':'neutral'}">${p.status.replace('_',' ')}</span>
          </div>`;
        }).join('')}
      </div></div>
      <div class="hr"></div>
      <h2>Memory timeline</h2>
      <div class="card"><div class="timeline">
        ${evs.map(e=>`<div class="tl-item ${eventTone(e.type)}"><div class="date">${fmtDate(e.date)}</div><div class="txt">${e.description}</div></div>`).join('')}
      </div></div>
    </div>
    <div class="section" style="margin:0;">
      <h2>Reflection insights</h2>
      ${reflections.length? reflections.map(reflCard).join('') : `<div class="card">${emptyState('No reflections yet.','')}<div style="text-align:center;"><button class="btn brass sm" id="runReflectBtn">Run reflection agent</button></div></div>`}
      ${reflections.length? `<div style="margin-top:10px;"><button class="btn sm" id="runReflectBtn2">Re-run reflection</button></div>`:''}
      <div class="hr"></div>
      <h2>Voice Agent</h2>
      <div class="card">
        <div style="font-size:12px; color:var(--ink-soft); margin-bottom:10px;">Household check-in calls are an event source in their own right — the outcome is retained into memory the same as an app or WhatsApp event.</div>
        <button class="btn sm" id="checkinBtn">Simulate household check-in call</button>
      </div>
      ${stagedBackupCard(id)}
    </div>
  </div>`;
}
function stagedBackupCard(householdId){
  const b = S.stagedBackups.find(x=>x.householdId===householdId && x.status==='staged');
  if(!b) return '';
  const backup = S.helpers.find(h=>h.id===b.backupHelperId);
  const atRisk = S.helpers.find(h=>h.id===b.atRiskHelperId);
  return `<div class="hr"></div><h2>Matching Agent</h2>
    <div class="card" style="border-left:3px solid var(--brass);">
      <div style="font-weight:600; font-size:13px;">Backup helper pre-staged</div>
      <div style="font-size:12.5px; color:var(--ink-soft); margin-top:4px;">${backup?backup.name:'—'} (match score ${b.score}/100) staged as backup, in case ${atRisk?atRisk.name:'the current helper'}'s placement needs replacement.</div>
    </div>`;
}
function reflCard(r){
  const cls = r.classification==='FACT'?'ok':r.classification==='OBSERVATION'?'warn':'neutral';
  return `<div class="card" style="margin-bottom:10px;">
    <span class="badge ${cls}">${r.classification}</span>
    <p style="margin-top:8px; font-size:13px;">${r.insight}</p>
    ${r.evidence && r.evidence.length? `<div class="hr"></div><div style="font-size:11.5px; color:var(--ink-soft);"><b>Evidence</b><ul style="margin:6px 0 0; padding-left:16px;">${r.evidence.map(e=>`<li>${e}</li>`).join('')}</ul></div>`:''}
  </div>`;
}
function wireHouseholdDetail(id){
  const b1 = document.getElementById('runReflectBtn');
  const b2 = document.getElementById('runReflectBtn2');
  [b1,b2].forEach(b=>{ if(b) b.onclick = ()=> reflectOnHousehold(id); });
  const ci = document.getElementById('checkinBtn');
  if(ci) ci.onclick = ()=>{
    const placement = S.placements.find(p=>p.householdId===id && p.status==='active');
    startCall('checkin', placement?placement.helperId:null, id, 'Voice check-in call — event source.');
  };
}

