/* =========================================================================
   HELPERS-PAGE.JS — helper roster + helper detail (timeline, churn 'why',
   simulate-event and call actions).
   ========================================================================= */

function pageHelpers(){
  recalcAll();
  const rows = S.helpers.map(h=>{
    const sc = SCORES[h.id];
    return `<div class="rowitem" onclick="nav('helperDetail','${h.id}')">
      <div class="avatar" style="background:${h.color}">${initials(h.name)}</div>
      <div class="meta"><div class="name">${h.name}</div><div class="sub">${h.location} · ${h.exp} yrs · ${h.skills.map(roleLabel).join(', ')}</div></div>
      <div class="scores">
        <div class="scorepill"><div class="v">${sc.trust}</div><div class="l">Trust</div></div>
        <div class="scorepill"><div class="v">${sc.churn}</div><div class="l">Churn</div></div>
      </div>
      <span class="badge ${trustBadgeClass(sc.trust)}">${trustBand(sc.trust)}</span>
    </div>`;
  }).join('');
  return `<div class="pagehead"><div class="eyebrow">Helpers</div><h1>Helper roster</h1><div class="lede">Every profile carries a full memory timeline, not just a static record.</div></div>
    <div class="card"><div class="rowlist">${rows}</div></div>`;
}

/* ---------- Helper detail ---------- */
function pageHelperDetail(id){
  recalcAll();
  const h = S.helpers.find(x=>x.id===id);
  if(!h) return emptyState('Helper not found','');
  const sc = SCORES[h.id];
  const evs = helperEvents(id).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  const why = churnWhy(h.id, sc.churn);
  return `
  <button class="btn sm" style="margin-bottom:16px;" onclick="nav('helpers')">← Helpers</button>
  <div class="detail-head">
    <div class="avatar" style="background:${h.color}">${initials(h.name)}</div>
    <div>
      <h1>${h.name}</h1>
      <div class="tags">
        <span class="badge neutral">${h.location}</span>
        <span class="badge neutral">${h.exp} yrs experience</span>
        <span class="badge neutral">${h.availability}</span>
        ${h.skills.map(s=>`<span class="badge neutral">${roleLabel(s)}</span>`).join('')}
      </div>
    </div>
  </div>
  <div class="grid g3" style="margin-bottom:24px;">
    <div class="metric"><div class="label">Trust signal</div><div class="num ${sc.trust<60?'warn':'ok'}">${sc.trust}</div><span class="badge ${trustBadgeClass(sc.trust)}" style="margin-top:8px;">${trustBand(sc.trust)}</span></div>
    <div class="metric"><div class="label">Churn risk</div><div class="num ${sc.churn>=55?'warn':'ok'}">${sc.churn}</div><span class="badge ${churnBadgeClass(sc.churn)}" style="margin-top:8px;">${sc.churn>=65?'Critical':sc.churn>=40?'Elevated':'Low'}</span></div>
    <div class="metric"><div class="label">Role-specific fit</div><div style="margin-top:8px; font-size:12px;">${Object.entries(h.roleScores).map(([k,v])=>`<div class="kv"><span class="k">${roleLabel(k)}</span><span>${v}/100</span></div>`).join('')}</div></div>
  </div>
  <div class="grid g2">
    <div class="section" style="margin:0;">
      <h2>Memory timeline</h2>
      <div class="card"><div class="timeline">
        ${evs.map(e=>`<div class="tl-item ${eventTone(e.type)}"><div class="date">${fmtDate(e.date)}</div><div class="txt">${e.description}</div><div class="tag">${e.type.replace('_',' ')}${e.severity? ' · '+e.severity:''}</div></div>`).join('')}
      </div></div>
    </div>
    <div class="section" style="margin:0;">
      <h2>Why this score?</h2>
      <div class="why">
        <h4>Why is churn risk ${sc.churn}?</h4>
        <ul>${why.map(w=>`<li>${w}</li>`).join('')}</ul>
        <div class="action">Recommended action: <b>${sc.churn>=75?'Escalate to coordinator.':sc.churn>=55?'Schedule coaching call.':'Continue routine monitoring.'}</b></div>
      </div>
      <div class="hr"></div>
      <h2>Simulate an event</h2>
      <div class="card">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <select id="evType">
            <option value="late_arrival">Late arrival</option>
            <option value="complaint">Complaint</option>
            <option value="positive_feedback">Positive feedback</option>
            <option value="placement_failure">Placement failure</option>
            <option value="successful_placement">Successful placement</option>
          </select>
          <button class="btn brass sm" id="simBtn">Simulate new event</button>
        </div>
        <div style="font-size:11.5px; color:var(--ink-soft); margin-top:8px;">Watch the Agent Activity ticker above as this propagates through Memory → Decision → Reflection → Action.</div>
      </div>
      <div class="hr"></div>
      <h2>Actions</h2>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn primary sm" id="coachBtn">Start coaching call</button>
        ${sc.churn>=75? `<button class="btn sm" style="border-color:var(--rust); color:var(--rust);" id="escalateBtn">Escalate to coordinator</button>` : ''}
        <button class="btn sm" onclick="nav('memory','${h.id}')">View in Hindsight Core</button>
      </div>
    </div>
  </div>`;
}
function eventTone(type){
  if(['complaint','negative_feedback','placement_failure','escalation_logged'].includes(type)) return type==='placement_failure'?'bad':(type==='escalation_logged'?'bad':'warn');
  if(type==='positive_feedback'||type==='successful_placement'||type==='coaching_completed') return 'ok';
  return '';
}
function churnWhy(helperId, churnScore){
  const evs = helperEvents(helperId).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  const reasons = [];
  const lateCount = evs.filter(e=>e.type==='late_arrival').length;
  const complaintCount = evs.filter(e=>e.type==='complaint').length;
  const unresolved = evs.filter(e=>e.type==='complaint').length - evs.filter(e=>e.type==='coaching_completed').length;
  if(lateCount) reasons.push(`${lateCount} late arrival${lateCount>1?'s':''} on record.`);
  if(complaintCount) reasons.push(`${complaintCount} complaint${complaintCount>1?'s':''} on record.`);
  if(unresolved>0) reasons.push(`${unresolved} concern${unresolved>1?'s':''} without a logged follow-up.`);
  if(evs.length && evs[0] && (evs[0].type==='late_arrival'||evs[0].type==='complaint')) reasons.push('Attendance trend is recent, not historical.');
  if(!reasons.length) reasons.push('No adverse signals in the recent window; risk reflects baseline variance.');
  return reasons;
}
function wireHelperDetail(id){
  const btn = document.getElementById('simBtn');
  if(btn) btn.onclick = ()=>{
    const type = document.getElementById('evType').value;
    const h = S.helpers.find(x=>x.id===id);
    const placement = S.placements.find(p=>p.helperId===id && p.status==='active');
    triggerEvent(type, id, placement?placement.householdId:null);
  };
  const coach = document.getElementById('coachBtn');
  if(coach) coach.onclick = ()=>{
    const placement = S.placements.find(p=>p.helperId===id && p.status==='active');
    startCall('coaching', id, placement?placement.householdId:null, 'Manually initiated from profile.');
  };
  const esc = document.getElementById('escalateBtn');
  if(esc) esc.onclick = ()=>{
    const placement = S.placements.find(p=>p.helperId===id && p.status==='active');
    startCall('escalation', id, placement?placement.householdId:null, 'Manually escalated from profile — critical churn risk.');
  };
}

