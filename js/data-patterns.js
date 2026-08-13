/* ============================================================
   data-patterns.js — Context engineering pattern catalog
   Each pattern: problem → mechanism → cost → failure mode inherited.
   op: one of select | compress | isolate | order
   ============================================================ */
window.PATTERNS = [

/* ---------- SELECT ---------- */
{
  id: 'metadata-index',
  name: 'Metadata Index',
  op: 'select',
  problem: 'You do not know which of 400 documents or files matter before the model has looked at anything.',
  mechanism: 'Pre-load a compact table of identifiers — names, sizes, timestamps, one-line descriptions — plus tools to expand any row. A few hundred tokens replaces tens of thousands.',
  cost: 'Extra round trips when the model expands. Requires well-shaped fetch tools.',
  failure: 'If the index descriptions are poor, the model expands the wrong rows and burns iterations. Invest in the one-line summaries.',
  use: 'Codebases, document libraries, ticket queues, any corpus over ~20 items.'
},
{
  id: 'route-scoped-tools',
  name: 'Route-Scoped Tool Set',
  op: 'select',
  problem: 'Thirty tool schemas sit in every request, taxing tokens and degrading selection accuracy.',
  mechanism: 'Choose the tool set server-side from the route, the user role and the conversation state. Five tools per request instead of thirty.',
  cost: 'You must classify the route before the call — usually a cheap classifier or explicit UI intent.',
  failure: 'A misrouted request lacks the tool it needs. Always include a generic escalate or clarify tool as an escape hatch.',
  use: 'Any agent with more than ~8 tools. Doubles as a security control.'
},
{
  id: 'hybrid-retrieval',
  name: 'Hybrid Retrieval + RRF',
  op: 'select',
  problem: 'Vector search misses exact identifiers; lexical search misses paraphrase.',
  mechanism: 'Run BM25 and vector search in parallel over the same chunks, fuse with Reciprocal Rank Fusion using ranks rather than scores.',
  cost: 'A second index to build and keep in sync. Roughly 15 lines of fusion code.',
  failure: 'Indexes drifting out of sync produce inconsistent results. Write both from one ingestion path.',
  use: 'Effectively every production retrieval system.'
},
{
  id: 'rerank-cut',
  name: 'Retrieve Wide, Rerank, Cut Hard',
  op: 'select',
  problem: 'High recall requires many candidates; high answer quality requires few documents in context.',
  mechanism: 'Retrieve 100 for recall, score with a cross-encoder, send the top 3–8. Recall unchanged, precision at generation roughly doubles.',
  cost: 'One reranker call, typically small relative to the generation call it protects.',
  failure: 'Reranking a shortlist of 10 gives the reranker nothing to do. Retrieve at least 50.',
  use: 'Any RAG system where answer quality matters more than a few hundred milliseconds.'
},
{
  id: 'freshness-authority',
  name: 'Freshness and Authority Stamps',
  op: 'select',
  problem: 'Two retrieved documents contradict each other and the model picks one at random.',
  mechanism: 'Stamp every chunk with updated-at, status (current / superseded / draft) and source authority. Let the model see the conflict and resolve it by rule.',
  cost: 'Metadata discipline at ingestion time.',
  failure: 'Stamps that are wrong are worse than no stamps. The pipeline must keep them accurate.',
  use: 'Policy documents, contracts, versioned documentation, anything with a revision history.'
},
{
  id: 'question-router',
  name: 'Question Router',
  op: 'select',
  problem: 'One pipeline tries to serve lookups, aggregations, live-state questions and out-of-scope requests, and does all four adequately.',
  mechanism: 'A cheap classifier dispatches to specialised handlers: SQL for aggregates, retrieval for documents, a direct tool for live state, a refusal for out-of-scope.',
  cost: 'One extra small-model call, typically under 200ms.',
  failure: 'Misclassification sends a question down the wrong path. Include a fallback route and log classifier confidence.',
  use: 'Any assistant facing a heterogeneous question distribution — which is most of them.'
},
{
  id: 'parent-document',
  name: 'Parent Document Retrieval',
  op: 'select',
  problem: 'Small chunks retrieve precisely but lack surrounding context; large chunks carry context but embed poorly.',
  mechanism: 'Embed small chunks for targeting; after reranking, fetch and send the enclosing parent section for generation.',
  cost: 'A parentId on every chunk and one extra fetch after ranking.',
  failure: 'Parents that are too large reintroduce dilution. Cap parent size and fall back to the chunk.',
  use: 'Structured documents — contracts, manuals, specifications, long-form documentation.'
},

/* ---------- COMPRESS ---------- */
{
  id: 'structured-compaction',
  name: 'Structured Compaction',
  op: 'compress',
  problem: 'Conversation history grows without bound and eventually dominates the context.',
  mechanism: 'At ~70–80% of the soft budget, summarise resolved history into a fixed schema: objective, constraints, established facts, decisions, rejected approaches, open questions, next step.',
  cost: 'One model call per compaction, plus the risk that the summariser drops something.',
  failure: 'Omitting the rejected-approaches field causes the agent to re-propose ideas already ruled out. Test recall after compaction.',
  use: 'Any conversation or agent run expected to exceed ~20 turns.'
},
{
  id: 'tool-result-eviction',
  name: 'Tool Result Eviction',
  op: 'compress',
  problem: 'A file read at turn 3 and already acted on at turn 5 is still consuming 6,000 tokens at turn 30.',
  mechanism: 'Once a tool result has been used, replace it in context with a one-line note recording what was learned and what was done.',
  cost: 'You must track which results have been consumed — usually inferable from subsequent actions.',
  failure: 'Evicting something still needed forces a re-fetch. Keep the most recent result verbatim always.',
  use: 'Every agentic loop. The single most effective control on context growth.'
},
{
  id: 'shrink-by-type',
  name: 'Type-Aware Shrinking',
  op: 'compress',
  problem: 'Character-offset truncation produces broken code, half JSON objects and severed table rows.',
  mechanism: 'Per content type: code keeps the target symbol and replaces other bodies with signatures; logs keep head, tail and error lines with repeats collapsed; documents drop whole chunks by score.',
  cost: 'A shrink function per content type.',
  failure: 'A shrinker that removes the thing that mattered. Log what was dropped so you can audit it.',
  use: 'Anywhere a context section can exceed its cap.'
},
{
  id: 'extract-dont-include',
  name: 'Extract, Do Not Include',
  op: 'compress',
  problem: 'A 40-page document is attached so the model can use three facts from it.',
  mechanism: 'Run a cheap extraction pass first, producing a structured record of the fields that matter, and pass only that to the expensive call.',
  cost: 'An extra small-model call. Usually pays for itself immediately in reduced input tokens.',
  failure: 'The extraction schema misses a field the downstream task needs. Keep a pointer so the full document can be re-fetched.',
  use: 'Document-heavy workflows, invoice and form processing, long email threads.'
},
{
  id: 'external-scratchpad',
  name: 'External Scratchpad',
  op: 'compress',
  problem: 'Multi-session or multi-hour work needs continuity that no context window can hold.',
  mechanism: 'The agent writes findings, decisions and open questions to a file. Context holds a pointer; the agent reads the file when it needs detail.',
  cost: 'A file store and read/write tools. Requires discipline in what gets written.',
  failure: 'A scratchpad that grows unbounded is just a slower context problem. Structure it and prune it.',
  use: 'Long-running agents, multi-day tasks, anything a human may also want to read.'
},
{
  id: 'bounded-tool-results',
  name: 'Bounded Tool Results',
  op: 'compress',
  problem: 'One list call returns 200 full records and consumes the entire budget.',
  mechanism: 'Every tool has a default limit, a hard maximum, a truncation flag, a cursor, and a hint on how to narrow the query.',
  cost: 'Occasionally requires a second call to get more.',
  failure: 'A limit set too low makes the agent paginate repeatedly. Tune from real trajectories.',
  use: 'Every list, search or query tool without exception.'
},
{
  id: 'progressive-summarization',
  name: 'Progressive Summarization',
  op: 'compress',
  problem: 'Compacting the whole history at once loses fine detail from the recent past.',
  mechanism: 'Tiered retention: the last 3 turns verbatim, turns 4–10 lightly summarised, everything older in the structured compaction record.',
  cost: 'More bookkeeping than single-shot compaction.',
  failure: 'Boundary effects — a fact summarised away just before it becomes relevant. Keep identifiers verbatim at every tier.',
  use: 'Long conversational products where recent nuance matters.'
},

/* ---------- ISOLATE ---------- */
{
  id: 'worker-isolation',
  name: 'Worker Context Isolation',
  op: 'isolate',
  problem: 'Exploration is token-expensive and most of what it reads is discarded, but it all lands in the main context.',
  mechanism: 'Spawn a worker with a clean window and a narrow task. It burns 40k tokens exploring and returns 700 tokens of structured findings.',
  cost: 'Several times the tokens of a single call; one extra round trip minimum.',
  failure: 'Under-specified worker tasks — the worker cannot see the orchestrator context and will guess. Write the task standalone.',
  use: 'Broad search, parallel investigation, deep reading. Justified above roughly a 10:1 compression ratio.'
},
{
  id: 'untrusted-quarantine',
  name: 'Untrusted Content Quarantine',
  op: 'isolate',
  problem: 'An agent that reads attacker-controlled content and also holds dangerous tools is one injection away from an incident.',
  mechanism: 'A read-only worker with zero write tools processes the untrusted content and returns a structured summary. The privileged orchestrator never sees the raw text.',
  cost: 'One extra call and a schema for the hand-off.',
  failure: 'Passing raw excerpts through the summary reintroduces the injection. Return structured fields, not quoted prose.',
  use: 'Web fetching, email processing, user uploads, shared document corpora.'
},
{
  id: 'separate-validation-call',
  name: 'Separate Validation Call',
  op: 'isolate',
  problem: 'Asking one call to both produce and self-check tends to produce a confident self-endorsement.',
  mechanism: 'A second call, with a different prompt and only the output plus the source context, checks groundedness and policy compliance.',
  cost: 'A second call, though usually a small model with a short prompt.',
  failure: 'Using the same model and prompt as the generator, which reproduces the same blind spots.',
  use: 'High-stakes outputs — anything shown as fact, sent externally, or used to make a decision.'
},
{
  id: 'plan-then-execute',
  name: 'Plan Then Execute',
  op: 'isolate',
  problem: 'An agent that plans while executing revises its plan as noise accumulates and drifts off task.',
  mechanism: 'One call produces an explicit plan against a clean context. Execution steps run separately, each seeing the plan and only its own inputs.',
  cost: 'A planning call, and reduced adaptivity mid-run.',
  failure: 'A plan made without enough information. Allow one re-plan on a defined trigger, not continuous replanning.',
  use: 'Multi-step tasks where the steps are knowable up front, and anywhere you want a human to approve the plan.'
},

/* ---------- ORDER ---------- */
{
  id: 'cache-stable-prefix',
  name: 'Cache-Stable Prefix',
  op: 'order',
  problem: 'Every request reprocesses the same 4,000 tokens of system prompt and tool schemas.',
  mechanism: 'Order strictly stable-to-volatile: system, tools, static examples, then a cache breakpoint, then retrieved content, history, and the user turn.',
  cost: 'Cache writes cost more than plain input, so a prefix used once is a net loss.',
  failure: 'One timestamp, unsorted map or per-user string above the breakpoint drops the hit rate to near zero. Diff consecutive prefixes.',
  use: 'Any product with repeated calls sharing a substantial fixed prefix.'
},
{
  id: 'task-last',
  name: 'Task Last',
  op: 'order',
  problem: 'On long contexts the concrete instruction stated first gets diluted by everything after it.',
  mechanism: 'Place reference material first and the specific current task, with its output contract, in the final position.',
  cost: 'None.',
  failure: 'None meaningful. This is close to a free improvement on long-context calls.',
  use: 'Every call with more than a few thousand tokens of reference material.'
},
{
  id: 'evidence-adjacency',
  name: 'Evidence Adjacency',
  op: 'order',
  problem: 'Content in the middle of a long context is used less reliably than content at the edges.',
  mechanism: 'Rank retrieved evidence and place the highest-scoring items immediately before the question, so the best evidence occupies the strongest position.',
  cost: 'None beyond having reranker scores available.',
  failure: 'Ordering by document id or retrieval order instead of relevance wastes the effect.',
  use: 'Any RAG call packing more than two or three documents.'
},
{
  id: 'delimited-untrusted',
  name: 'Delimited Untrusted Blocks',
  op: 'order',
  problem: 'Retrieved text and user text run together, so instructions inside data read as instructions to follow.',
  mechanism: 'Wrap third-party content in tagged blocks with source attribution, followed by an explicit statement that the contents are data and never commands.',
  cost: 'A handful of tokens per block.',
  failure: 'Treating this as sufficient security. It reduces injection success rates; it does not eliminate them. Pair with capability limits.',
  use: 'Every piece of content your system did not author.'
},
{
  id: 'budget-table',
  name: 'Explicit Budget Table',
  op: 'order',
  problem: 'Under pressure, something gets dropped and nobody decided what.',
  mechanism: 'Every section has a cap, a priority and a named shrink function. Eviction proceeds from lowest priority upward, and the assembler throws if it still does not fit.',
  cost: 'An hour of design and roughly fifty lines of assembly code.',
  failure: 'Caps set once and never revisited as content grows. Alert on eviction rate.',
  use: 'Every non-trivial AI feature. This is the foundational pattern of the discipline.'
}
];
