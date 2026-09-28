/* =========================================================================
   VOICE-AGENT.JS
   Coaching / check-in / escalation calls, run in "voice simulation mode"
   (a stand-in for a live Vapi/Bland call — no network call is made).

   This module implements the full pre-call / during-call / post-call
   contract the spec requires of a voice agent:

     RECALL relevant context (real recent events + open commitments)
       -> CONDUCT a transcript whose content is grounded in that evidence
       -> CAPTURE a structured outcome (summary, sentiment, commitments,
          evidence, follow-up)
       -> RETAIN the outcome back into memory
       -> feed the outcome into a real domain event so Trust/Churn/
          Difficulty actually move in response to what the call found —
          not just narrative text.

   It is also idempotent: placing the same type of call for the same
   helper twice on the same simulated day will not double-count the
   resulting event (see DEDUPE WINDOW below).
--------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   PRE-CALL: gather real evidence to recall, instead of a static script
--------------------------------------------------------------------- */
function gatherCallContext(helperId, householdId){
  const helper = helperId ? S.helpers.find(x=>x.id===helperId) : null;
  const household = householdId ? S.households.find(x=>x.id===householdId) : null;

  const evs = (helperId ? helperEvents(helperId) : []).slice().sort((a,b)=> new Date(b.date)-new Date(a.date));
  const hhEvs = (householdId ? householdEvents(householdId) : []).slice().sort((a,b)=> new Date(b.date)-new Date(a.date));

  const recentLate = evs.filter(e=>e.type==='late_arrival');
  const recentComplaints = evs.filter(e=>e.type==='complaint');
  const recentNegative = evs.filter(e=>e.type==='negative_feedback');
  const hhComplaints = hhEvs.filter(e=>e.type==='complaint' || e.type==='household_complaint');

  // open commitments: things promised on a *previous* call to this helper
  // that haven't since been marked resolved.
  const openCommitments = [];
  S.calls.filter(c=>c.helperId===helperId).forEach(c=>{
    (c.commitments||[]).forEach(cm=>{ if(!cm.resolved) openCommitments.push(cm); });
  });

  return {
    helper, household, evs, hhEvs, recentLate, recentComplaints, recentNegative, hhComplaints, openCommitments,
    trust: helperId && SCORES[helperId] ? SCORES[helperId].trust : null,
    churn: helperId && SCORES[helperId] ? SCORES[helperId].churn : null,
    difficulty: householdId && SCORES[householdId] ? SCORES[householdId].difficulty : null,
  };
}

/* ---------------------------------------------------------------------
   TRANSCRIPT BUILDERS — content is derived from gatherCallContext(),
   not a fixed script. Two calls for two different helpers on the same
   "type" will read differently if their evidence differs.
--------------------------------------------------------------------- */
function buildCoachingCall(ctx){
  const h = ctx.helper || {name:'the helper'};
  const fn = firstName(h.name);
  const issues = [...ctx.recentLate, ...ctx.recentComplaints].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const evidence = [];
  if(ctx.recentLate.length){ evidence.push(`${ctx.recentLate.length} late arrival${ctx.recentLate.length>1?'s':''} on record, most recently ${fmtDate(ctx.recentLate[0].date)}.`); }
  if(ctx.recentComplaints.length){ evidence.push(`${ctx.recentComplaints.length} complaint${ctx.recentComplaints.length>1?'s':''} on record, most recently: "${ctx.recentComplaints[0].description}"`); }
  if(ctx.openCommitments.length){ evidence.push(`Previous commitment still open: "${ctx.openCommitments[0].text}" (from ${fmtDate(ctx.openCommitments[0].createdAt)}).`); }
  if(!evidence.length){ evidence.push(`No adverse events on file — this is a preventive check-in given current churn risk (${ctx.churn ?? '—'}/100).`); }

  const mostRecent = issues[0];
  const transcript = [];
  if(mostRecent && mostRecent.type==='late_arrival'){
    transcript.push({who:'Voice Agent', text:`Hi ${fn}, this is a check-in from the agency. We've logged ${ctx.recentLate.length} late arrival${ctx.recentLate.length>1?'s':''}, most recently on ${fmtDate(mostRecent.date)}. Is everything alright?`});
    transcript.push({who:fn, text:`Sorry about that — there's been a transport issue on my usual route. I can switch to an earlier bus.`});
    transcript.push({who:'Voice Agent', text:`That would help. Can we agree you'll message the household directly if you expect to be more than 10 minutes late?`});
    transcript.push({who:fn, text:`Yes, I'll do that going forward.`});
  } else if(mostRecent && mostRecent.type==='complaint'){
    transcript.push({who:'Voice Agent', text:`Hi ${fn}, calling about a complaint logged on ${fmtDate(mostRecent.date)}: "${mostRecent.description}" Can you walk me through what happened?`});
    transcript.push({who:fn, text:`I understand the concern — I think there was a misunderstanding about expectations. I'd like the chance to correct it.`});
    transcript.push({who:'Voice Agent', text:`Understood. Let's agree a specific step you'll take so this doesn't recur.`});
    transcript.push({who:fn, text:`I'll confirm the schedule with the household directly each week.`});
  } else {
    transcript.push({who:'Voice Agent', text:`Hi ${fn}, this is a routine check-in — nothing adverse on file, just confirming things are going well on your side.`});
    transcript.push({who:fn, text:`All good from my end, thank you for checking in.`});
  }
  transcript.push({who:'Voice Agent', text:`Thank you — I've logged that. We'll check in again ${ctx.churn!=null && ctx.churn>=55 ? 'in one week' : 'in two weeks'}.`});

  const commitmentText = mostRecent
    ? (mostRecent.type==='late_arrival' ? `${fn} will message the household if running more than 10 minutes late.` : `${fn} will confirm schedule expectations with the household weekly.`)
    : null;

  return {
    transcript, evidence,
    sentiment: mostRecent ? 'cooperative' : 'positive',
    summary: mostRecent
      ? `${fn} acknowledged ${mostRecent.type==='late_arrival'?'attendance concerns':'the complaint'} and committed to a specific corrective step.`
      : `${fn} confirmed no issues; call held as a preventive check given current churn risk.`,
    commitments: commitmentText ? [{text:commitmentText, resolved:false, createdAt: todayIso()}] : [],
    followUp: ctx.churn!=null && ctx.churn>=55 ? 'In 1 week' : 'In 2 weeks',
    outcomeEventType: 'coaching_completed',
    outcomeDescription: commitmentText ? `Coaching call completed. ${commitmentText}` : 'Coaching call completed; no issues found, preventive check-in.',
  };
}

function buildCheckinCall(ctx){
  const friction = ctx.hhComplaints[0];
  const evidence = [];
  const transcript = [];
  if(friction){
    evidence.push(`Prior friction on file: "${friction.description}" (${fmtDate(friction.date)}).`);
    transcript.push({who:'Voice Agent', text:`Hello, this is a routine check-in on the current placement. Last time we noted: "${friction.description}" — has that improved?`});
    transcript.push({who:'Household', text:`It's a bit better, but scheduling flexibility is still a recurring friction point for us.`});
    transcript.push({who:'Voice Agent', text:`Understood — could you tell me more about the scheduling expectations on your side?`});
    transcript.push({who:'Household', text:`We often need evening flexibility that wasn't clearly discussed at the start.`});
    transcript.push({who:'Voice Agent', text:`Thank you, I'll log that as an ongoing expectation-setting gap.`});
  } else {
    evidence.push('No complaints on file for this household — call confirms current satisfaction.');
    transcript.push({who:'Voice Agent', text:`Hello, this is a routine check-in on the current placement. How has the last month been?`});
    transcript.push({who:'Household', text:`Genuinely no complaints — things have been going smoothly.`});
    transcript.push({who:'Voice Agent', text:`Great to hear, thank you. I've logged that on the household record.`});
  }
  return {
    transcript, evidence,
    sentiment: friction ? 'mixed' : 'positive',
    summary: friction
      ? `Household reiterated a scheduling expectation gap; logged as an ongoing household-side pattern.`
      : `Household reports no issues; logged as a positive check-in.`,
    commitments: [],
    followUp: ctx.difficulty!=null && ctx.difficulty>=55 ? 'In 1 week' : 'In 3 weeks',
    // A check-in call is genuinely an event source: it either confirms an
    // existing friction pattern (household-side, feeds computeDifficulty)
    // or produces fresh positive evidence — it never invents a *new* issue
    // that wasn't already on file.
    outcomeEventType: friction ? 'household_complaint' : 'positive_feedback',
    outcomeDescription: friction
      ? `Check-in call confirmed ongoing scheduling friction: "${friction.description}"`
      : `Check-in call confirmed no issues on record.`,
  };
}

function buildEscalationCall(ctx){
  const h = ctx.helper || {name:'the helper'};
  const fn = firstName(h.name);
  const driver = [...ctx.recentComplaints, ...ctx.recentNegative].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const evidence = [];
  evidence.push(`Churn risk at ${ctx.churn ?? '—'}/100 — above the escalation threshold.`);
  if(driver) evidence.push(`Most recent driving event: "${driver.description}" (${fmtDate(driver.date)}).`);
  if(ctx.openCommitments.length) evidence.push(`Unresolved prior commitment: "${ctx.openCommitments[0].text}".`);

  const transcript = [
    {who:'Voice Agent', text: driver
      ? `This is an escalation call regarding "${driver.description}" logged on ${fmtDate(driver.date)}. Can you walk me through what happened?`
      : `This is an escalation call — churn risk has crossed the critical threshold. Can you walk me through the recent history from your side?`},
    {who:fn, text:`I understand the concern. I believe schedule expectations shifted without much notice.`},
    {who:'Voice Agent', text:`Noted. This is being flagged for coordinator review alongside the full household record, and a backup helper is being pre-staged as a precaution.`},
  ];
  return {
    transcript, evidence,
    sentiment: 'concerned',
    summary: `${fn} acknowledged the situation; case flagged for coordinator review. No commitment logged — this call documents, it does not resolve.`,
    commitments: [],
    followUp: 'Immediate — coordinator review',
    outcomeEventType: 'escalation_logged',
    outcomeDescription: driver
      ? `Escalation call held. Driving issue: "${driver.description}". Flagged for coordinator review.`
      : `Escalation call held on churn risk alone. Flagged for coordinator review.`,
  };
}

/* ---------------------------------------------------------------------
   startCall — the public entry point. Same signature as before so
   every existing caller (Helper Detail, Household Detail, Voice
   Center, Demo Mode) keeps working unchanged.
--------------------------------------------------------------------- */
function startCall(type, helperId, householdId, reason){
  const ctx = gatherCallContext(helperId, householdId);
  recall(helperId || householdId, 'preparing call context');
  log('voice','VOICE AGENT', `Initiated ${type} call${ctx.helper? ' with '+ctx.helper.name:''}. Voice simulation mode — no live Vapi/Bland call is placed in this browser prototype.`);

  const built = type==='checkin' ? buildCheckinCall(ctx)
              : type==='escalation' ? buildEscalationCall(ctx)
              : buildCoachingCall(ctx);

  // IDEMPOTENCY: keyed on the *evidence* the call addressed, not the
  // simulated wall-clock date (todayIso() cycles every few ticks and
  // isn't a stable "same day" signal). If the exact same source events
  // already produced a call of this type for this helper, treat it as
  // already-addressed — a second identical call shouldn't double the
  // scoring effect. Preventive calls with no adverse evidence are always
  // safe to repeat (nothing to double-count) so they skip the guard.
  const today = todayIso();
  const sourceEventIds = [...ctx.recentLate, ...ctx.recentComplaints, ...ctx.recentNegative, ...ctx.hhComplaints].slice(0,5).map(e=>e.id);
  const dedupeKey = sourceEventIds.length ? `${type}:${helperId||''}:${householdId||''}:${sourceEventIds.slice().sort().join(',')}` : null;
  const duplicate = dedupeKey ? S.calls.find(c=>c._dedupeKey===dedupeKey) : null;

  const call = {
    id:uid(), type, helperId, householdId, reason, status:'completed',
    transcript: built.transcript, summary: built.summary, sentiment: built.sentiment,
    evidence: built.evidence, commitments: built.commitments, followUp: built.followUp,
    sourceEventIds,
    duplicateOf: duplicate ? duplicate.id : null,
    createdAt: nowStamp(), date: today, _dedupeKey: dedupeKey,
  };
  S.calls.unshift(call);

  // POST-CALL: retain the outcome back into memory regardless of dedupe
  // status — the *conversation* happened even if we suppress a second
  // scoring effect for the same day.
  retain(helperId || householdId, 'experience', `${type} call completed. ${built.summary}`, {callId:call.id});
  if(built.commitments.length){
    retain(helperId, 'opinion', `Helper made a specific commitment during coaching: "${built.commitments[0].text}"`, {callId:call.id});
  }
  if(householdId && helperId) retain(householdId, 'experience', `${type} call completed regarding this placement. ${built.summary}`, {callId:call.id});
  log('mem','MEMORY AGENT', `Call outcome stored for ${ctx.helper?ctx.helper.name:ctx.household?ctx.household.name:'record'}.`);

  if(duplicate){
    log('dec','DECISION AGENT', `Same evidence already addressed by a previous ${type} call (idempotency guard) — outcome retained, but no additional score effect applied.`);
    renderCurrentPage();
    return call;
  }

  // The call outcome becomes a real domain event, so it actually moves
  // Trust/Churn/Difficulty rather than just narrating that it should.
  if(built.outcomeEventType){
    S.events.push({
      id:uid(), helperId, householdId, placementId:null,
      type: built.outcomeEventType, description: built.outcomeDescription,
      severity: classifySeverity(built.outcomeEventType).severity,
      date: today, source:'live',
    });
    recalcAll();
    if(helperId && SCORES[helperId]){
      log('dec','DECISION AGENT', `Recalculated Trust/Churn for ${labelFor(helperId)} following the call outcome. Churn now ${SCORES[helperId].churn}.`);
    }
    if(householdId){
      SCORES[householdId] = SCORES[householdId]||{};
      SCORES[householdId].difficulty = computeDifficulty(householdId);
      log('dec','DECISION AGENT', `Recalculated household difficulty for ${labelFor(householdId)}. Now ${SCORES[householdId].difficulty}.`);
    }
  }

  // Escalation calls independently ensure a backup is staged (safety net
  // for the case where this call was triggered manually rather than via
  // the automatic churn-threshold path in event-workflow.js).
  if(type==='escalation' && helperId && householdId){
    ensureBackupStaged(helperId, householdId);
  }

  renderCurrentPage();
  return call;
}
