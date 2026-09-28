/* =========================================================================
   MATCHING-AGENT.JS
   Role-fit-aware candidate ranking. Reads the Observation Network so a
   helper's role-specific track record (not just a static skill tag)
   drives the ranking.
   ========================================================================= */

function findMatches(role, householdId, opts){
  opts = opts||{};
  const naive = opts.naive; // ignore memory/role-fit, mimic "generic ranking"
  const hh = S.households.find(h=>h.id===householdId);
  recall(householdId, 'retrieving household memory');
  log('match','MATCHING AGENT', `Evaluating candidates for ${hh?hh.name:householdId} — requirement: ${roleLabel(role)}.`);
  const scored = S.helpers.map(h=>{
    recall(h.id);
    const roleFit = h.roleScores[role]||40;
    const trust = SCORES[h.id]?SCORES[h.id].trust:computeTrust(h.id);
    const churn = SCORES[h.id]?SCORES[h.id].churn:computeChurn(h.id);
    let score;
    if(naive){
      score = Math.round(50 + h.exp*2 - (h.location.includes('Hyderabad')?0:5)); // generic, ignores memory
    } else {
      score = Math.round(roleFit*0.5 + trust*0.3 + (100-churn)*0.2);
    }
    return {helper:h, score:clamp(score,0,100), roleFit, trust, churn};
  }).sort((a,b)=>b.score-a.score);

  if(!naive){
    log('match','MATCHING AGENT', `Ranked ${scored.length} candidates using role-specific history, trust signal and churn risk.`);
  } else {
    log('match','MATCHING AGENT', `Ranked ${scored.length} candidates using generic profile fields only (no memory).`);
  }
  return scored;
}
function roleLabel(r){ return {elder_care:'elder care', child_care:'child care', cleaning:'cleaning', cooking:'cooking'}[r]||r; }

/* ---------------------------------------------------------------------
   BACKUP MATCHING — single source of truth for "pre-stage a backup
   helper" so the event workflow and the Voice Agent's escalation path
   can't independently duplicate a staged backup for the same household.
--------------------------------------------------------------------- */
function ensureBackupStaged(atRiskHelperId, householdId){
  if(!householdId) return null;
  const already = S.stagedBackups.find(b=>b.householdId===householdId && b.status==='staged');
  if(already) return already;
  const hh = S.households.find(x=>x.id===householdId);
  if(!hh) return null;
  const candidates = findMatches(hh.requirement, householdId).filter(c=>c.helper.id!==atRiskHelperId);
  if(!candidates.length) return null;
  const backup = candidates[0];
  log('match','MATCHING AGENT', `Read Observation Network for ${hh.name}. Pre-staging backup helper in case ${labelFor(atRiskHelperId)}'s placement needs replacement.`);
  const staged = {id:uid(), householdId, atRiskHelperId, backupHelperId:backup.helper.id, score:backup.score, status:'staged', createdAt:todayIso()};
  S.stagedBackups.unshift(staged);
  log('match','MATCHING AGENT', `Staged ${backup.helper.name} (match score ${backup.score}/100) as backup for ${hh.name}.`);
  return staged;
}

