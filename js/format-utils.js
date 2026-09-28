/* =========================================================================
   FORMAT-UTILS.JS — small formatting/label helpers used across agents & UI
   ========================================================================= */

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
function labelFor(id){
  const h = S.helpers.find(x=>x.id===id); if(h) return h.name;
  const hh = S.households.find(x=>x.id===id); if(hh) return hh.name;
  return id;
}
function labelForShort(id){ return labelFor(id).split(' ')[0]; }
function firstName(n){ return n.split(' ')[0]; }
function initials(n){ return n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDate(d){ if(!d) return '—'; const dt=new Date(d); return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}); }

