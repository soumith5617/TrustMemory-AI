/* =========================================================================
   MAIN.JS — boot sequence. Loaded last, after every agent/UI module above.
   ========================================================================= */

function buildNav(){
  const el = document.getElementById('navlist');
  el.innerHTML = NAV.map(n=>`<button data-id="${n.id}"><span class="dot"></span>${n.label}</button>`).join('');
  el.querySelectorAll('button').forEach((b,i)=>{
    b.onclick = ()=> nav(NAV[i].id, null);
  });
}
function resetDemo(){
  S = clone(INITIAL);
  MEM = {};
  SCORES = {};
  clockTick = 0;
  recalcAll();
  log('mem','MEMORY AGENT', 'Demo reset — all scores, events, calls and reflections restored to initial state.');
  renderCurrentPage();
}
document.getElementById('resetBtn').onclick = resetDemo;

buildNav();
recalcAll();
highlightNav();
renderCurrentPage();
log('mem','MEMORY AGENT', 'System initialized. Institutional memory loaded for 8 helpers and 6 households.');
