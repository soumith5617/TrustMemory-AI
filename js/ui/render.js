/* =========================================================================
   RENDER.JS — router: nav(), renderCurrentPage(), highlightNav()
   ========================================================================= */

function nav(page, param){ route = {page, param}; renderCurrentPage(); window.scrollTo(0,0); highlightNav(); }
function renderCurrentPage(){
  const c = document.getElementById('content');
  switch(route.page){
    case 'dashboard': c.innerHTML = pageDashboard(); wireDashboard(); break;
    case 'helpers': c.innerHTML = pageHelpers(); break;
    case 'helperDetail': c.innerHTML = pageHelperDetail(route.param); wireHelperDetail(route.param); break;
    case 'households': c.innerHTML = pageHouseholds(); break;
    case 'householdDetail': c.innerHTML = pageHouseholdDetail(route.param); wireHouseholdDetail(route.param); break;
    case 'placements': c.innerHTML = pagePlacements(); break;
    case 'memory': c.innerHTML = pageMemory(); wireMemory(); break;
    case 'matching': c.innerHTML = pageMatching(); wireMatching(); break;
    case 'insights': c.innerHTML = pageInsights(); break;
    case 'voice': c.innerHTML = pageVoice(); wireVoice(); break;
    case 'activity': c.innerHTML = pageActivity(); break;
    case 'demo': c.innerHTML = pageDemo(); wireDemo(); break;
    case 'architecture': c.innerHTML = pageArchitecture(); break;
    case 'settings': c.innerHTML = pageSettings(); break;
    default: c.innerHTML = '<div class="empty">Not found.</div>';
  }
}
function highlightNav(){
  document.querySelectorAll('#navlist button').forEach(b=>{
    b.classList.toggle('active', b.dataset.id===route.page || (route.page==='helperDetail'&&b.dataset.id==='helpers') || (route.page==='householdDetail'&&b.dataset.id==='households'));
  });
}

