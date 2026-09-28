# TrustMemory AI

The AI memory layer for safer, smarter domestic-help and caregiver placements.

## What this is

A single-file, browser-only interactive prototype of TrustMemory AI — a
memory-first, multi-agent system for domestic-help/caregiver placement
agencies. It demonstrates the full loop:

**Remember → Understand → Predict → Act → Learn**

Everything (five agents, the Hindsight-style memory model, scoring,
matching, voice calls, demo scenarios) runs client-side in plain
HTML/CSS/JavaScript — no build step, no backend, no external services.
It's meant as a demo/prototype artifact, not a production system.

## How to run it

Just open `trustmemory.html` in any modern browser. Nothing to install.

Optionally, enable GitHub Pages on this repo (Settings → Pages → source:
`main` branch, root) and it will be reachable at:

```
https://<your-username>.github.io/TrustMemory-AI/trustmemory.html
```

## What's inside

- **Five agents**, each with real logic in the JS, not just labels:
  - **Memory Agent** — Retain / Recall against a simulated Hindsight core
  - **Decision Agent** — deterministic Trust Score, Churn Risk, LLM-style
    severity classification (deterministic fallback, since there's no
    live Groq call from a static page)
  - **Reflection Agent** — cross-placement pattern detection, classified
    as FACT / OBSERVATION / HYPOTHESIS
  - **Matching Agent** — role-fit-aware candidate ranking, plus proactive
    "pre-stage backup helper" when a placement's risk goes critical
  - **Voice Agent** — coaching / check-in / escalation calls, run in
    "voice simulation mode" (Vapi/Bland stand-in)
- **Hindsight-style memory model**: World / Experience / Opinion /
  Observation networks, browsable per-entity in the "Hindsight Core" page
- **Coordinator Dashboard** with an "AI Noticed" alert feed
- **Demo Mode** with three scripted, end-to-end scenarios:
  1. *Save the Placement* — churn prevention (Anita)
  2. *Fair Blame* — household-side difficulty scoring (Household H104)
  3. *Learn the Role* — role-fit-aware matching (Priya)
- **Architecture page** inside the app, documenting the real system
  design this prototype stands in for (Hindsight, FastAPI, Supabase,
  Groq, Vapi/Bland, Next.js) and why each was chosen
- Seed data for 8 helpers and 6 households with a hand-authored,
  realistic 3-month event history (not randomly generated)

## What this is *not*

This is not the production stack described in the project's architecture
(Next.js + FastAPI + Supabase/Postgres + Hindsight + Groq + Vapi/Bland).
Those require real accounts, a backend, and deployment infrastructure
that a static single-file prototype can't provide. This repo is the
fast, zero-setup way to see and demo the product idea end-to-end; the
Architecture page inside the app documents the intended real-world stack
in full.

## License / status

Hackathon prototype. No warranty, no production guarantees.
