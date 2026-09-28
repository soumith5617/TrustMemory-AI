# TrustMemory AI — modular build

The same interactive prototype as the original single-file `trustmemory.html`,
split into one file per module. No build step, no bundler — every file is a
plain `<script src="...">` tag loaded in dependency order and sharing one
global scope, so it still just opens straight in a browser (or via GitHub
Pages) with no `npm install`.

## How to run it

Open `index.html` in a modern browser. Everything else is a relative path
next to it.

## File map

```
index.html                 shell markup, loads every script below in order
styles.css                 all CSS (unchanged from the original)

js/
  state.js                 NAV config, seed data, global state (S, MEM, SCORES, route)
  format-utils.js          labelFor / initials / fmtDate / escapeHtml etc.
  activity-log.js          the shared Agent Activity log + header ticker

  agents/
    memory-agent.js         Retain / Recall against the simulated Hindsight core
    decision-agent.js       Trust Score, Churn Risk, Household Difficulty, severity classification
    reflection-agent.js     cross-placement pattern detection (FACT / OBSERVATION / HYPOTHESIS)
    matching-agent.js       role-fit-aware candidate ranking
    voice-agent.js          coaching / check-in / escalation calls (voice simulation mode)

  event-workflow.js        orchestrates one incoming event across all five agents

  ui/
    render.js                router: nav(), renderCurrentPage(), highlightNav()
    dashboard.js             Coordinator Dashboard
    helpers-page.js          Helper roster + helper detail
    households-page.js       Household roster + household detail
    placements-page.js       All placements
    memory-page.js           Hindsight Core explorer
    matching-page.js         Matching UI
    insights-page.js         Reflection Agent output
    voice-page.js             Voice Agent center
    activity-page.js         Full Agent Activity log
    architecture-page.js     In-app architecture documentation
    settings-page.js         Environment / integrations page

  demo.js                  the three scripted Demo Mode scenarios
  main.js                  boot sequence — loaded last
```

## Why plain scripts instead of ES modules / a bundler

The original was a zero-build, open-the-file prototype. Splitting it into
`type="module"` files would break that (`file://` pages can't `import`
across files in most browsers due to CORS). Loading plain scripts in
dependency order keeps the "just open it" property while still giving you
one file per concern to read and edit independently.

## Verified

- Every one of the 82 top-level functions in the original file exists in
  exactly one module here (diffed against the original — none missing,
  none duplicated).
- All 23 JS files pass `node --check` syntax validation individually.
- The full concatenated app was run in a stubbed DOM: boot, all 12 pages,
  a live event through the full Memory → Decision → Reflection → Matching
  → Voice chain, and all three Demo Mode scenarios — all completed
  without errors.
