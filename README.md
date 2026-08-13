# AI Systems Academy

An offline, self-contained static website for learning **AI engineering, context engineering and AI system design**.

Open `index.html` directly in a browser. No server, no build step, no Node, no localhost, no API keys, no network access at any point.

---

## What's in it

| | Count | |
|---|---|---|
| **Lessons** | 46 across 7 modules | ~9 hours of reading, each with a diagram, worked example, pitfalls, a graded self-check and a hands-on lab |
| **Case studies** | 14 complete applications | Architecture, request trace, context assembly, tool surface, failure modes, cost model, eval scorecard, graded decisions, failure simulations |
| **Interactive labs** | 16 | Tokenizer, sampling, attention, embeddings, chunking, RAG pipeline, reranking, context budget, context rot, compaction, cache economics, cost model, agent loop, tool surface, injection sandbox, eval layers |
| **Pattern catalog** | 23 named patterns | Each with problem → mechanism → cost → the failure mode you inherit |
| **Decision workshop** | 30 graded judgement calls | Including why the plausible-but-wrong option is tempting |
| **Reference** | 60 glossary terms, 10 cheat sheets, 14 formulas, 18 cited sources | |
| **Diagrams** | 21 generated SVGs | Theme-aware, no image files |

### The seven modules

1. **Foundations** — what an LLM does, tokens, context windows, sampling, embeddings, model routing
2. **Prompting as Engineering** — prompt anatomy, trust levels, structured output, few-shot, versioning and regression testing
3. **Context Engineering** — budgets, context rot, JIT retrieval, compaction, memory tiers, tool economy, sub-agent isolation, cache-stable prefixes
4. **Retrieval & Knowledge Systems** — RAG stages, chunking, hybrid search + RRF, reranking, agentic search, retrieval evaluation
5. **Tools & Agents** — tool design, the agent loop, workflow vs agent, MCP, multi-agent, error recovery, human-in-the-loop
6. **Evaluation & Observability** — why vibes fail, eval datasets, LLM-as-judge calibration, tracing, CI gating
7. **Production AI System Design** — a seven-layer design method, latency, cost, reliability, prompt injection, abuse, privacy, rollout

### The 14 case studies

| # | Case | Platform |
|---|---|---|
| 01 | macOS AI Developer Workspace | SwiftUI + AppKit |
| 02 | macOS PDF Intelligence & Editor | PDFKit + SwiftUI |
| 03 | iOS AI Personal Assistant | on-device / cloud hybrid |
| 04 | Web Customer Support Copilot | Node/TS + React |
| 05 | Web Operations & Finance Analyst | Postgres + text-to-SQL |
| 06 | AI Video Generation Pipeline | queue + object storage |
| 07 | Multi-Tenant AI Chatbot SaaS | Node/TS + Firebase |
| 08 | CI Code Review Agent | GitHub Actions |
| 09 | Enterprise Search & Knowledge Assistant | multi-source connectors |
| 10 | Realtime Voice Support Agent | WebRTC + streaming STT/TTS |
| 11 | Email Triage & Draft Agent | Gmail/Graph API |
| 12 | Document Extraction Pipeline | batch + human review |
| 13 | Design-to-Code (Screenshot → SwiftUI) | multimodal |
| 14 | Multi-Agent Research System | orchestrator + workers |

Each case opens with nine tabs: Brief & contract, Architecture, Context, Tools, Failure modes, Simulator, Evals & cost, Decisions, Notes.

---

## Using it

- **Search everything** — press <kbd>/</kbd> or <kbd>⌘K</kbd> for the command palette across lessons, cases, labs, patterns and glossary terms.
- **Next / previous lesson** — <kbd>j</kbd> / <kbd>k</kbd> or arrow keys while reading.
- **Guided paths** — the home page has six entry points by problem ("my assistant degrades on long tasks", "it works but I cannot afford it") rather than by topic.
- **Session planner** — pick 10/25/45/90 minutes and it selects unfinished lessons that fit.
- **Progress** is stored in this browser's `localStorage` only. Nothing is uploaded. Use Export/Import on the Progress page to move it between machines.
- **Theme** toggles light/dark; all diagrams re-colour automatically.

---

## Files

```
index.html                 shell + page containers
styles.css                 full design system, light + dark
manifest.json              PWA manifest
js/
  diagrams.js              21 generated theme-aware SVG diagrams
  data-curriculum-a.js     modules 1–3 (20 lessons)
  data-curriculum-b.js     modules 4–5 (13 lessons)
  data-curriculum-c.js     modules 6–7 (13 lessons)
  data-patterns.js         23 context-engineering patterns
  data-cases-a.js          case studies 01–07
  data-cases-b.js          case studies 08–14
  data-reference.js        glossary, cheat sheets, formulas, sources, workshop
  labs.js                  16 interactive labs
  cases.js                 case renderer + 12 parametric simulators
  app.js                   router, markdown renderer, progress, page renderers
```

## Extending it

**Add a case study** — append an object to `window.CASES_B` in `js/data-cases-b.js`. Required keys:

```js
{
  id, num, title, platform, tags: [],
  brief,
  spec:     [[label, value], ...],          // product contract table
  pipeline: ['Stage', 'Stage', ...],        // renders as an SVG chain
  trace:    [{ t, d, code? }, ...],         // numbered request walkthrough
  context:  [{ name, tokens, note, color }, ...],   // color: acc|acc2|good|warn|bad|ink3
  tools:    [{ sig, kind, note }, ...],     // kind: read|write|gated
  failures: [{ t, d, mit }, ...],
  cost:     { lines: [[k, v], ...], notes: [] },
  evals:    [[metric, target, how], ...],
  decisions:[{ q, options: [{ t, ok, why }, ...] }, ...],
  sim:      { type, cfg },                  // see below
  sims:     [{ label, out }, ...],          // scenario buttons, `out` is preformatted text
  notes:    'markdown string'
}
```

`sim.type` is one of the 12 built-in simulators in `js/cases.js`: `budget`, `topk`, `cost`, `latency`, `escalation`, `quota`, `precision`, `acl`, `injection`, `threshold`, `refine`, `multiagent`. The navigation, search index, filters and prev/next links all pick it up automatically.

**Add a lesson** — append to a module's `lessons` array in any `data-curriculum-*.js`. Bodies use a markdown subset: `##`/`###`, `**bold**`, `` `code` ``, fenced code blocks, `-`/`1.` lists, `>` quotes, `|` tables, plus two custom tokens on their own line:

```
{{diagram:rag-pipeline}}
{{callout:warn|Text of the callout.}}
```

Diagram keys come from `DIAGRAMS.keys()`. Callout types are `` (info), `good`, `warn`, `bad`.

**Add a lab** — push an object with `{ id, name, title, desc, html(), init() }` onto `window.LABS` in `js/labs.js`.

---

## Deliberate limitations

- **No live AI.** Embedding an API key in a static site would expose it. The "Copy tutor prompt" button on each lesson generates a context-rich prompt for you to paste into Claude or another assistant instead.
- **No cloud sync.** Progress lives in `localStorage`; use Export/Import to move it.
- **Simulations are teaching models, not provider internals.** The tokenizer, attention map, sampling distribution and cost figures are simplified illustrations. Every one encodes a real engineering trade-off, but none reflects any specific model's implementation. Cost figures use illustrative placeholder rates — substitute your provider's current pricing.

## Sources

All lesson material is original prose. External sources are cited rather than copied — see the **Reference → Sources** tab for the 18 primary sources (Anthropic engineering posts and docs, the MCP specification, the OWASP LLM Top 10, Google and Hugging Face course material) with a note on what each one backs.
