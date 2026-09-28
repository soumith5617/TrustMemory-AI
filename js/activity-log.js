/* =========================================================================
   ACTIVITY-LOG.JS — shared "Agent Activity" log + header ticker.
   Every agent below calls log() to announce what it just did.
   ========================================================================= */

/* ---------------------------------------------------------------------
   ACTIVITY LOG
--------------------------------------------------------------------- */
function log(agentClass, agentLabel, text){
  const row = {t:nowStamp(), agentClass, agentLabel, text};
  S.activity.unshift(row);
  if(S.activity.length>400) S.activity.length = 400;
  updateTicker(row);
  if(route.page==='activity') renderActivityList();
}
function updateTicker(row){
  document.getElementById('tickerText').innerHTML = `<b>${row.agentLabel}</b> — ${escapeHtml(row.text)}`;
}

