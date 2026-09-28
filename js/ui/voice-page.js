/* =========================================================================
   VOICE-PAGE.JS — Voice Agent center: place a call, browse call history.
   ========================================================================= */

function pageVoice(){
  return `<div class="pagehead"><div class="eyebrow">Voice Agent — Vapi / Bland</div><h1>Coaching, check-ins and escalations</h1><div class="lede">Household check-in calls are an event source that feeds Retain; coaching and escalation calls are actions triggered by the Trust + Churn-risk score. Every call recalls history first, and every outcome is retained afterward.</div></div>
  <div class="card" style="margin-bottom:20px;">
    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
      <select id="vHelper">${S.helpers.map(h=>`<option value="${h.id}">${h.name}</option>`).join('')}</select>
      <select id="vType"><option value="coaching">Coaching call</option><option value="checkin">Household check-in</option><option value="escalation">Escalation call</option></select>
      <button class="btn primary" id="callBtn">Place call</button>
    </div>
  </div>
  <div class="section"><h2>Call history</h2>
    ${S.calls.length? S.calls.map(callCard).join('') : `<div class="card">${emptyState('No calls yet.','Place a call above, or trigger a churn-risk event to have the Voice Agent recommend one.')}</div>`}
  </div>`;
}
function callCard(c){
  const helper = S.helpers.find(h=>h.id===c.helperId);
  const hh = S.households.find(h=>h.id===c.householdId);
  return `<div class="callcard">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div><b>${c.type[0].toUpperCase()+c.type.slice(1)} call</b> ${helper?'· '+helper.name:''} ${hh?'· '+hh.name:''}</div>
      <span class="simbadge">Voice simulation mode</span>
    </div>
    <div style="font-size:12px; color:var(--ink-soft); margin-top:4px;">${c.reason||''} · Sentiment: ${c.sentiment} · Follow-up: ${c.followUp}</div>
    ${c.duplicateOf? `<div class="badge warn" style="margin-top:8px;">Same evidence already addressed by a previous call — retained, no additional score effect (idempotency guard)</div>` : ''}
    ${c.evidence && c.evidence.length? `<div class="why" style="margin-top:10px;"><h4>Why this call / evidence recalled</h4><ul>${c.evidence.map(w=>`<li>${w}</li>`).join('')}</ul></div>` : ''}
    <div class="transcript">
      ${c.transcript.map(t=>`<div class="who">${t.who}</div><div>${t.text}</div>`).join('')}
    </div>
    <div class="hr"></div>
    <div style="font-size:12.5px;"><b>Outcome:</b> ${c.summary}</div>
    ${c.commitments && c.commitments.length? `<div style="font-size:12.5px; margin-top:6px;"><b>Commitment logged:</b> ${c.commitments.map(cm=>cm.text).join('; ')}</div>` : ''}
  </div>`;
}
function wireVoice(){
  document.getElementById('callBtn').onclick = ()=>{
    const helperId = document.getElementById('vHelper').value;
    const type = document.getElementById('vType').value;
    const placement = S.placements.find(p=>p.helperId===helperId && p.status==='active');
    startCall(type, helperId, placement?placement.householdId:null, 'Manually initiated from Voice Center.');
  };
}

