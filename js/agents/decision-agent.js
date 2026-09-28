/* =========================================================================
   DECISION-AGENT.JS
   Deterministic Trust Score, Churn Risk and Household Difficulty formulas,
   plus LLM-style severity classification (deterministic fallback, since
   there's no live Groq call from a static page).
   ========================================================================= */

function classifySeverity(eventType){
  // deterministic fallback standing in for a targeted LLM call (Groq unavailable in-browser)
  const map = {
    late_arrival:{severity:'MEDIUM', confidence:0.81, reason:'Attendance deviation; severity depends on recurrence.'},
    complaint:{severity:'MEDIUM', confidence:0.85, reason:'Household-reported dissatisfaction requires review.'},
    negative_feedback:{severity:'MEDIUM', confidence:0.78, reason:'Negative sentiment recorded in feedback.'},
    positive_feedback:{severity:'LOW', confidence:0.9, reason:'Positive sentiment, no risk signal.'},
    placement_failure:{severity:'HIGH', confidence:0.9, reason:'Placement ended in failure.'},
    successful_placement:{severity:'LOW', confidence:0.92, reason:'Placement concluded successfully.'},
    household_complaint:{severity:'HIGH', confidence:0.83, reason:'Household-side dissatisfaction pattern.'},
    coaching_completed:{severity:'LOW', confidence:0.88, reason:'Coaching resolved with commitments logged.'},
    escalation_logged:{severity:'HIGH', confidence:0.86, reason:'Case flagged for coordinator review after escalation call.'},
  };
  const r = map[eventType] || {severity:'LOW', confidence:0.6, reason:'Unclassified event type.'};
  log('dec','DECISION AGENT', `Classified severity for "${eventType}" → ${r.severity} (confidence ${r.confidence}). ${r.reason}`);
  return r;
}

/* ---------------------------------------------------------------------
   SCORING — deterministic heuristics (section 9 of the PRD)
--------------------------------------------------------------------- */
function helperEvents(id){ return S.events.filter(e=>e.helperId===id); }
function householdEvents(id){ return S.events.filter(e=>e.householdId===id); }

function computeTrust(helperId){
  const evs = helperEvents(helperId);
  let score = 68; // baseline
  evs.forEach(e=>{
    if(e.type==='positive_feedback') score += 4;
    if(e.type==='placement_start') score += 1;
    if(e.type==='late_arrival') score -= 3;
    if(e.type==='complaint') score -= 6;
    if(e.type==='negative_feedback') score -= 5;
    if(e.type==='placement_end' && !e.description.toLowerCase().includes('replacement')) score += 2;
  });
  return clamp(Math.round(score),0,100);
}

function computeChurn(helperId){
  const evs = helperEvents(helperId).slice().sort((a,b)=> new Date(a.date)-new Date(b.date));
  let score = 18; // baseline low risk
  const recentWindowDays = 30;
  const last = evs.length? new Date(evs[evs.length-1].date): new Date();
  evs.forEach(e=>{
    const days = (last - new Date(e.date))/86400000;
    const recencyWeight = days <= recentWindowDays ? 1.6 : (days <= 90 ? 1 : 0.4);
    if(e.type==='late_arrival') score += 9*recencyWeight;
    if(e.type==='complaint') score += 13*recencyWeight;
    if(e.type==='negative_feedback') score += 10*recencyWeight;
    if(e.type==='placement_end' && e.description.toLowerCase().includes('replacement')) score += 12*recencyWeight;
    if(e.type==='positive_feedback') score -= 5;
    if(e.type==='coaching_completed') score -= 14;
  });
  return clamp(Math.round(score),0,100);
}

function computeDifficulty(householdId){
  const evs = householdEvents(householdId);
  const failed = evs.filter(e=>e.type==='placement_end' && e.description.toLowerCase().includes('replacement')).length;
  const complaints = evs.filter(e=>e.type==='complaint' || e.type==='household_complaint').length;
  let score = 20 + failed*20 + complaints*8;
  return clamp(Math.round(score),0,100);
}

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

function recalcAll(){
  S.helpers.forEach(h=>{
    SCORES[h.id] = SCORES[h.id]||{};
    SCORES[h.id].trust = computeTrust(h.id);
    SCORES[h.id].churn = computeChurn(h.id);
  });
  S.households.forEach(h=>{
    SCORES[h.id] = SCORES[h.id]||{};
    SCORES[h.id].difficulty = computeDifficulty(h.id);
  });
}

function trustBand(v){ return v>=80?'Strong': v>=60?'Stable': v>=40?'Needs Attention':'Critical'; }
function trustBadgeClass(v){ return v>=80?'ok': v>=60?'ok': v>=40?'warn':'bad'; }
function churnBadgeClass(v){ return v>=65?'bad': v>=40?'warn':'ok'; }
function diffBadgeClass(v){ return v>=65?'bad': v>=40?'warn':'ok'; }

