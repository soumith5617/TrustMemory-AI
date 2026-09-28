/* =========================================================================
   EVENT-WORKFLOW.JS
   Orchestrates a single incoming event across the agents: Memory Agent
   retains it, Decision Agent recalls history + classifies + rescoring,
   Reflection Agent may fire, Matching Agent may pre-stage a backup helper.
   ========================================================================= */

const EVENT_LABELS = {
  late_arrival:'Late arrival reported.',
  complaint:'Complaint received.',
  positive_feedback:'Positive feedback received.',
  placement_failure:'Placement ended — household requested replacement.',
  successful_placement:'Placement milestone reached successfully.',
  household_complaint:'Household-side complaint logged.',
  coaching_completed:'Coaching call completed.',
};

function triggerEvent(type, helperId, householdId, opts){
  opts = opts||{};
  const desc = opts.description || EVENT_LABELS[type] || type;
  const date = opts.date || todayIso();
  const placementId = opts.placementId || null;
  const e = {id:uid(), helperId, householdId, placementId, type, description:desc, severity:null, date, source:'live'};
  S.events.push(e);

  const beforeChurn = SCORES[helperId] ? SCORES[helperId].churn : null;
  const beforeTrust = SCORES[helperId] ? SCORES[helperId].trust : null;

  // 1. Memory Agent retains
  retain(helperId, 'experience', desc, {type, date});
  if(householdId) retain(householdId, 'experience', desc, {type, date});

  // 2. Decision Agent recalls context
  recall(helperId, 'evaluating new event');

  // 3. LLM/deterministic severity classification
  const cls = classifySeverity(type);
  e.severity = cls.severity;

  // 4. Score engine recalculates
  recalcAll();
  const afterChurn = SCORES[helperId] ? SCORES[helperId].churn : null;
  const afterTrust = SCORES[helperId] ? SCORES[helperId].trust : null;
  if(afterChurn!=null){
    log('dec','DECISION AGENT', `Recalculated churn risk for ${labelFor(helperId)}. ${beforeChurn} → ${afterChurn}.`);
    retain(helperId, 'opinion', `Churn risk assessed at ${afterChurn}/100 (${churnBadgeClass(afterChurn)==='bad'?'high':churnBadgeClass(afterChurn)==='warn'?'elevated':'low'}).`, {score:afterChurn});
  }

  // 5. Reflection Agent checks pattern threshold; Voice Agent branches coaching vs escalation
  let actionCreated = false;
  const crossedMedium = afterChurn!=null && beforeChurn!=null && afterChurn>=55 && beforeChurn<55;
  const crossedCritical = afterChurn!=null && beforeChurn!=null && afterChurn>=75 && beforeChurn<75;
  if(crossedMedium || crossedCritical){
    log('ref','REFLECTION AGENT', `Compared recent events against historical attendance for ${labelFor(helperId)}. Deteriorating trend confirmed.`);
    const isCritical = afterChurn>=75;
    const rec = {id:uid(), entityType:'helper', entityId:helperId, text:`${labelForShort(helperId)}'s churn risk increased from ${beforeChurn} to ${afterChurn}.`,
      action: isCritical? 'Escalate to coordinator' : 'Start coaching call', callType: isCritical?'escalation':'coaching', createdAt: e.date};
    S.recommendations.unshift(rec);
    log('voice','VOICE AGENT', `Recommended ${isCritical?'an escalation call to the coordinator':'a coaching call'} for ${labelFor(helperId)} based on risk ${isCritical?'reaching critical':'escalation'}.`);
    actionCreated = true;
  }

  // Matching Agent: once risk is critical on an active placement, proactively pre-stage a backup
  if(afterChurn!=null && afterChurn>=75 && householdId){
    ensureBackupStaged(helperId, householdId);
  }

  if(householdId){
    const diff = computeDifficulty(householdId);
    SCORES[householdId] = SCORES[householdId]||{};
    SCORES[householdId].difficulty = diff;
  }

  renderCurrentPage();
  return {event:e, beforeChurn, afterChurn, beforeTrust, afterTrust, actionCreated, classification:cls};
}

function todayIso(){ return '2026-03-'+String(8+ (clockTick%3)).padStart(2,'0'); }

