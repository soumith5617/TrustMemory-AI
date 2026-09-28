/* =========================================================================
   INSIGHTS-PAGE.JS — Reflection Agent output grouped by FACT /
   OBSERVATION / HYPOTHESIS.
   ========================================================================= */

function pageInsights(){
  const groups = {
    'Patterns discovered': S.reflections.filter(r=>r.classification==='OBSERVATION'),
    'Root-cause hypotheses': S.reflections.filter(r=>r.classification==='HYPOTHESIS'),
    'Confirmed facts': S.reflections.filter(r=>r.classification==='FACT'),
  };
  return `<div class="pagehead"><div class="eyebrow">Insights</div><h1>What the Reflection Agent has found</h1><div class="lede">Every insight is labelled by how strongly the evidence supports it.</div></div>
    ${Object.entries(groups).map(([title, items])=>`
      <div class="section"><h2>${title}</h2>
        ${items.length? items.map(reflCard).join('') : `<div class="card">${emptyState('Nothing here yet.','Run a reflection from a helper or household profile, or via Demo Mode.')}</div>`}
      </div>`).join('')}
  `;
}

