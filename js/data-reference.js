/* ============================================================
   data-reference.js — glossary, cheat sheets, formulas,
   cited sources, and the decision workshop.
   ============================================================ */

window.GLOSSARY = [
  { t: 'Agent', g: 'Agents', d: 'A system where the model decides its own next step at runtime, in a loop, using tools. Distinguished from a workflow, where you wrote the control flow.' },
  { t: 'Agentic search', g: 'Retrieval', d: 'Letting the model issue and refine searches iteratively rather than retrieving once before generation. Enables multi-hop questions at several times the cost.' },
  { t: 'Attention dilution', g: 'Context', d: 'As sequence length grows, the effective weight on any individual token falls. Adding relevant context can therefore reduce accuracy.' },
  { t: 'BM25', g: 'Retrieval', d: 'A lexical ranking function scoring documents by term frequency and inverse document frequency. Strong on exact identifiers, useless on paraphrase.' },
  { t: 'Bi-encoder', g: 'Retrieval', d: 'Embeds query and document separately so documents can be indexed in advance. Fast and approximate; the basis of vector search.' },
  { t: 'Cache breakpoint', g: 'Context', d: 'The boundary between the stable prefix a provider may cache and the volatile remainder processed fresh each call.' },
  { t: 'Chain of thought', g: 'Prompting', d: 'Reasoning emitted before the answer. Improves multi-step accuracy; must precede the conclusion to help; costs output tokens.' },
  { t: 'Chunk', g: 'Retrieval', d: 'The atomic unit of retrieval. An answer spanning two chunks cannot be retrieved whole, which makes chunking a hard ceiling on quality.' },
  { t: 'Circuit breaker', g: 'Reliability', d: 'After n consecutive failures, stop calling a dependency for a cooldown and fail fast, rather than extending its outage and yours.' },
  { t: 'Compaction', g: 'Context', d: 'Replacing resolved conversation history with a structured summary so a task can outlive its context window.' },
  { t: 'Context engineering', g: 'Context', d: 'Curating and maintaining the minimal set of high-signal tokens that maximises the likelihood of the desired outcome, across the whole lifetime of a task.' },
  { t: 'Context rot', g: 'Context', d: 'Degradation of instruction-following and retrieval accuracy as context grows, occurring well before the hard limit.' },
  { t: 'Context window', g: 'Context', d: 'The maximum token sequence one call can process. A budget rebuilt from scratch every request, not a memory.' },
  { t: 'Contextual retrieval', g: 'Retrieval', d: 'Prepending a generated placement description to each chunk before embedding, so it is retrievable by concepts its literal text never states.' },
  { t: 'Cross-encoder', g: 'Retrieval', d: 'Scores a query and document together, attending across both. Far more accurate than a bi-encoder and far too slow to index with — used for reranking a shortlist.' },
  { t: 'Distractor', g: 'Context', d: 'Near-miss content that competes with the correct evidence. More damaging than irrelevant content because it is plausible.' },
  { t: 'Egress allowlist', g: 'Security', d: 'Restricting outbound destinations — URLs, recipients, webhooks — so a compromised agent cannot exfiltrate to an arbitrary target.' },
  { t: 'Embedding', g: 'Retrieval', d: 'A fixed-length vector representation of text where semantic similarity corresponds to geometric proximity.' },
  { t: 'Episodic memory', g: 'Memory', d: 'What happened in this session or task. Lifetime of hours to days. Must not be auto-promoted to durable fact.' },
  { t: 'Escalation routing', g: 'Cost', d: 'Running a cheap model first and promoting to an expensive one on a measurable trigger, rather than defaulting to the largest model.' },
  { t: 'Eval set', g: 'Evaluation', d: 'A fixed collection of labelled real cases run before every change. The single most valuable artifact in an AI product.' },
  { t: 'Faithfulness', g: 'Evaluation', d: 'Whether every claim in an answer is supported by the provided context. Distinct from correctness — a faithful answer to wrong context is still wrong.' },
  { t: 'Few-shot', g: 'Prompting', d: 'Providing input/output examples before the real input. Excellent for format and edge-case policy; narrows range if the examples are homogeneous.' },
  { t: 'Grounding', g: 'Evaluation', d: 'Constraining generation to supplied evidence, with a checkable link from claim to source.' },
  { t: 'Guardrail', g: 'Security', d: 'A check on the input or output of a model call. A guardrail that only logs is not a guardrail — decide in advance whether it blocks, degrades or escalates.' },
  { t: 'Hybrid search', g: 'Retrieval', d: 'Running lexical and vector retrieval together and fusing the results, because their failure modes are complementary.' },
  { t: 'Idempotency key', g: 'Reliability', d: 'A client-supplied identifier making a repeated write safe. Essential in agentic systems where retries are automatic and frequent.' },
  { t: 'Indirect prompt injection', g: 'Security', d: 'An attack embedded in content the model processes on someone else\'s behalf — a page, email or document. The dangerous form, because the victim is not the attacker.' },
  { t: 'JIT retrieval', g: 'Context', d: 'Giving the model identifiers plus fetch tools rather than pre-loading everything, so it pulls only what it needs.' },
  { t: 'LLM-as-judge', g: 'Evaluation', d: 'Using a model to grade open-ended output against a rubric. Requires calibration against human labels before it can be trusted.' },
  { t: 'Logits', g: 'Foundations', d: 'The raw scores over the vocabulary produced at each generation step, before sampling parameters shape them into a distribution.' },
  { t: 'Lost in the middle', g: 'Context', d: 'Content at the start and end of a long context is used more reliably than content in the middle.' },
  { t: 'MCP', g: 'Agents', d: 'Model Context Protocol — an open standard for exposing tools, resources and prompts to any compatible client.' },
  { t: 'MMR', g: 'Retrieval', d: 'Maximal Marginal Relevance — selecting results that are relevant *and* mutually diverse, so near-duplicates do not occupy multiple slots.' },
  { t: 'MRR', g: 'Evaluation', d: 'Mean Reciprocal Rank — the average of 1/rank of the first correct result. Sensitive to whether the answer is at position 1 or 8.' },
  { t: 'Orchestrator–worker', g: 'Agents', d: 'A planner decomposes a task, workers execute in isolated contexts, the orchestrator synthesises. The controllable multi-agent topology.' },
  { t: 'Parent document retrieval', g: 'Retrieval', d: 'Embedding small chunks for precision but returning the enclosing section for generation context.' },
  { t: 'Procedural memory', g: 'Memory', d: 'How things are done here — conventions and rules, stored as versioned files in the repository rather than in a database.' },
  { t: 'Prompt caching', g: 'Cost', d: 'Provider-side reuse of a processed prompt prefix across requests. Requires a byte-exact match, so prefix stability is the whole game.' },
  { t: 'Prompt injection', g: 'Security', d: 'Content that the model treats as instructions when you intended it as data. The defining security problem of AI applications.' },
  { t: 'Pseudonymisation', g: 'Privacy', d: 'Replacing identifiers with placeholders before an external call, and restoring them locally afterwards. Reduces exposure; does not help when the value itself is sensitive.' },
  { t: 'Recall@k', g: 'Evaluation', d: 'The fraction of questions whose correct source appears in the top k results. The hard ceiling on everything downstream.' },
  { t: 'Reranking', g: 'Retrieval', d: 'Rescoring a retrieved shortlist with a more accurate model to raise precision at the point of generation. Cannot improve recall.' },
  { t: 'RRF', g: 'Retrieval', d: 'Reciprocal Rank Fusion — combining ranked lists using positions rather than scores, so no cross-retriever calibration is needed.' },
  { t: 'Self-consistency', g: 'Foundations', d: 'Sampling n times at moderate temperature and taking the majority answer. Buys accuracy with cost on low-volume, high-stakes decisions.' },
  { t: 'Semantic memory', g: 'Memory', d: 'Durable facts about the user or their data. Must be atomic, sourced, timestamped, supersedable and expirable.' },
  { t: 'Semantic layer', g: 'System design', d: 'A curated model of business concepts and agreed metric definitions sitting between natural language and a raw database schema.' },
  { t: 'Shadow mode', g: 'Operations', d: 'Running a new version alongside the current one on live traffic, serving the old and diffing offline. Real comparison at zero user risk.' },
  { t: 'Signal density', g: 'Context', d: 'The fraction of context tokens that bear on the current decision. The quantity to optimise, in place of coverage.' },
  { t: 'Structured output', g: 'Prompting', d: 'Constraining generation to a schema via tool-calling or a native JSON mode, so the result is a value your type system can defend.' },
  { t: 'Sub-agent isolation', g: 'Context', d: 'Spawning a worker with a clean context that absorbs exploratory tokens and returns only conclusions.' },
  { t: 'Temperature', g: 'Foundations', d: 'A scaling factor on the probability distribution. Controls variance, not truthfulness. Zero is not a determinism guarantee.' },
  { t: 'Tool shadowing', g: 'Security', d: 'Two servers or sources exposing similarly-named tools, creating ambiguity a malicious party can exploit to attract calls meant for a trusted tool.' },
  { t: 'Top-p', g: 'Foundations', d: 'Nucleus sampling — keep the smallest set of tokens whose cumulative probability exceeds p, then sample within it.' },
  { t: 'TTFT', g: 'Performance', d: 'Time to first token. Driven by prompt processing and therefore by input size. What users experience as responsiveness.' },
  { t: 'Token', g: 'Foundations', d: 'The subword unit a model processes. Roughly 4 characters of English prose; considerably denser for code and JSON.' },
  { t: 'Trajectory', g: 'Agents', d: 'The full sequence of model calls, tool calls and results in an agent run. The primary debugging surface and an evaluation target in its own right.' },
  { t: 'Workflow', g: 'Agents', d: 'A system with control flow you wrote. The model fills in steps; your code decides what happens next. Testable, bounded, and the right default.' },
  { t: 'Working memory', g: 'Memory', d: 'The current context window. Lifetime of exactly one call.' },
  { t: 'Zero-retention', g: 'Privacy', d: 'A provider configuration under which request content is not persisted after the response. Verify availability for your tier and record it.' }
];

window.CHEATSHEETS = [
  {
    title: 'Choosing where a decision lives',
    rows: [
      ['Has a money, safety or data consequence', 'Deterministic code. Always.'],
      ['Requires reading messy natural language', 'Model, returning structured output'],
      ['Requires real identity or permissions', 'Your auth layer, server-side'],
      ['Requires arithmetic you can verify', 'Code — extract with the model, compute in code'],
      ['Requires judgement with no verifier', 'Model, plus a human gate if consequential'],
      ['Requires the same answer every time', 'Code, or a cached deterministic mapping']
    ]
  },
  {
    title: 'Sampling settings by task shape',
    rows: [
      ['Classification, routing, extraction', 'temp 0–0.2'],
      ['Code generation and patches', 'temp 0–0.3'],
      ['Diagnosis, planning, analysis', 'temp 0.3–0.7'],
      ['Copywriting, naming, ideation', 'temp 0.8–1.1'],
      ['Generating diverse eval cases', 'temp 0.9+'],
      ['Any of the above', 'Tune temperature OR top-p, never both']
    ]
  },
  {
    title: 'Context eviction order under pressure',
    rows: [
      ['1st to go', 'Conversation history — compact the middle'],
      ['2nd', 'Lowest-scoring retrieved documents — whole chunks only'],
      ['3rd', 'Least-relevant memory entries'],
      ['4th', 'Fetched tool results already acted upon'],
      ['Never', 'System rules, the current task, the latest tool result'],
      ['If still over', 'Throw. Do not silently drop the user\'s question.']
    ]
  },
  {
    title: 'Retrieval funnel targets',
    rows: [
      ['Candidate retrieval', 'top 50–200 · recall@k > 90%'],
      ['Fusion', 'RRF over lexical + vector + filters'],
      ['Rerank', 'cross-encoder over all candidates'],
      ['Final to model', 'top 3–8 · set k from an accuracy-vs-k curve'],
      ['Dedup', 'content hash + high pairwise similarity'],
      ['Order', 'best evidence immediately before the question']
    ]
  },
  {
    title: 'Approval gates by consequence',
    rows: [
      ['Low impact, reversible', 'Auto-execute'],
      ['Low impact, irreversible', 'Auto-execute, notify'],
      ['High impact, reversible', 'Auto-execute, offer visible undo'],
      ['High impact, irreversible', 'Gate: show exact arguments, allow edit'],
      ['Bulk operations', 'One approval on a reviewable plan, not fifty dialogs'],
      ['Where to place it', 'Confirm the plan up front, gate the final write — never mid-run']
    ]
  },
  {
    title: 'Cache hit-rate killers',
    rows: [
      ['Timestamp in the system prompt', 'Use date granularity, or move it to the user turn'],
      ['Unsorted JSON serialisation', 'Sort keys before stringify'],
      ['Per-user name or tier at the top', 'Move below the breakpoint as structured data'],
      ['Conditional prompt sections', 'Each condition doubles your prefix variants'],
      ['Dynamically retrieved examples', 'Static above the breakpoint, retrieved below'],
      ['Tool list built by object iteration', 'Sort tools by name']
    ]
  },
  {
    title: 'Agent stop conditions — ship all five',
    rows: [
      ['Success', 'Model returns text; validate against the output schema'],
      ['Iteration cap', '5–15; on hit, force a labelled partial conclusion'],
      ['Token budget', 'Independent of iterations — big reads blow it first'],
      ['Wall clock', 'Interactive users will not wait five minutes'],
      ['Unrecoverable error', 'Auth or permission failure — fail fast, do not retry']
    ]
  },
  {
    title: 'Prompt injection defence stack',
    rows: [
      ['1 · Least privilege', 'Route-scoped tools. Absent beats disabled.'],
      ['2 · Trust separation', 'Tool-less worker reads untrusted content'],
      ['3 · Content tagging', 'Delimited blocks stating the content is data'],
      ['4 · Egress allowlist', 'Bounded outbound destinations and recipients'],
      ['5 · Output scanning', 'Credentials, foreign ids, unexpected URLs, image tags'],
      ['6 · Human approval', 'On anything irreversible'],
      ['7 · Provenance logging', 'Which document caused which action']
    ]
  },
  {
    title: 'Eval set composition',
    rows: [
      ['Head — common real inputs', '~40%'],
      ['Tail — rare but valid', '~20%'],
      ['Hard — known difficult', '~15%'],
      ['Regression — every past bug', '~15%'],
      ['Adversarial — injection, jailbreak', '~5%'],
      ['Unanswerable — must refuse', '~5%']
    ]
  },
  {
    title: 'Metrics worth a dashboard',
    rows: [
      ['Quality proxy', 'Retry rate and abandonment (more honest than thumbs)'],
      ['Reliability', 'Schema failure, tool error, citation-resolve failure'],
      ['Efficiency', 'Cost per successful task, cache hit rate'],
      ['Latency', 'TTFT p50/p95 and total, measured client-side'],
      ['Safety', 'Injection suite success rate, per release'],
      ['Drift', 'Nightly eval against main with no code change']
    ]
  }
];

window.FORMULAS = [
  { t: 'Token estimate', f: 'tokens ≈ characters / 4', n: 'English prose. Code and JSON are denser — roughly characters / 2.5. Use the real tokenizer for hard limits.' },
  { t: 'Reciprocal Rank Fusion', f: 'score(d) = Σ over lists of 1 / (k + rank(d))', n: 'k = 60 is a robust default. Uses ranks, so no score calibration is needed across retrievers.' },
  { t: 'Cosine similarity', f: 'cos(a,b) = (a · b) / (‖a‖ ‖b‖)', n: 'Equivalent to the dot product when vectors are L2-normalised. Not a relevance percentage.' },
  { t: 'Pipeline success rate', f: 'P(task) = Π P(stage)', n: '90% × 90% × 90% = 73%. This is why a single end-to-end score hides which layer broke.' },
  { t: 'Multi-agent joint success', f: 'P = r^n  (if all n workers must succeed)', n: 'Five workers at 90% gives 59%. Design workers to be independently useful instead.' },
  { t: 'Cost per request', f: '(in_tok × in_rate) + (cached_tok × cache_rate) + (out_tok × out_rate)', n: 'Output tokens are typically several times the input rate. Structure beats prose.' },
  { t: 'Cost per successful task', f: 'total spend / tasks completed successfully', n: 'The honest denominator. A cheap model needing three attempts is not cheap.' },
  { t: 'Effective cache saving', f: 'saving ≈ hit_rate × prefix_tokens × (1 − cache_read_rate)', n: 'Cache writes cost more than plain input, so a prefix used once is a net loss.' },
  { t: 'Context utilisation', f: 'used / (limit − output_reserve)', n: 'Trigger compaction around 0.7–0.8. Set a soft budget well below the hard limit.' },
  { t: 'Compression ratio (sub-agents)', f: 'tokens_consumed / tokens_returned', n: 'Above ~10:1, isolation is likely worth the cost multiplier. Below it, use one agent.' },
  { t: 'Precision / Recall', f: 'P = TP/(TP+FP)   R = TP/(TP+FN)', n: 'Retrieval optimises recall; generation needs precision. A reranker converts one to the other.' },
  { t: 'F1', f: 'F1 = 2PR / (P + R)', n: 'Use per-field for extraction. Report P and R separately too — the balance matters.' },
  { t: 'Exponential backoff with jitter', f: 'delay = min(base × 2^n, cap) + rand(0, 0.3 × base × 2^n)', n: 'Jitter is not optional. Without it, synchronised retries recreate the outage.' },
  { t: 'Abuse exposure ceiling', f: 'max_daily_tokens × days × rate × accounts', n: 'Compute this for your free tier before launch. If the number is unacceptable, the tier is mispriced.' }
];

window.SOURCES = [
  { t: 'Effective context engineering for AI agents', o: 'Anthropic Engineering', d: 'The primary reference for this course\'s context module: budgets, compaction, just-in-time retrieval, sub-agent isolation and the minimal-high-signal-tokens framing.', u: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' },
  { t: 'Building effective agents', o: 'Anthropic Engineering', d: 'Workflow versus agent, the composable workflow patterns (chain, router, parallel, evaluator-optimizer, orchestrator-worker), and the argument for the least dynamic thing that works.', u: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { t: 'How we built our multi-agent research system', o: 'Anthropic Engineering', d: 'Real cost multipliers, orchestrator-worker design, prompt engineering for workers, and the failure modes of fan-out at scale.', u: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
  { t: 'Introducing contextual retrieval', o: 'Anthropic News', d: 'Contextual chunk enrichment and hybrid retrieval with reranking, with measured reductions in retrieval failure rate.', u: 'https://www.anthropic.com/news/contextual-retrieval' },
  { t: 'Prompt caching', o: 'Anthropic Docs', d: 'Cache breakpoints, prefix matching semantics, minimum cacheable lengths, and write-versus-read pricing.', u: 'https://docs.claude.com/en/docs/build-with-claude/prompt-caching' },
  { t: 'Tool use overview', o: 'Anthropic Docs', d: 'Tool definition, schema design, parallel tool calls, and the request/response cycle underlying every agent loop.', u: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview' },
  { t: 'Context windows', o: 'Anthropic Docs', d: 'How the window is consumed, what counts toward it, and interaction with extended thinking and tool use.', u: 'https://docs.claude.com/en/docs/build-with-claude/context-windows' },
  { t: 'Prompt engineering overview', o: 'Anthropic Docs', d: 'System prompts, multishot examples, chain of thought, prefill, and the ordering guidance used throughout the prompting module.', u: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview' },
  { t: 'Create strong empirical evaluations', o: 'Anthropic Docs', d: 'Eval design, grading methods, and the discipline behind the evaluation module.', u: 'https://docs.claude.com/en/docs/test-and-evaluate/develop-tests' },
  { t: 'Reduce hallucinations', o: 'Anthropic Docs', d: 'Grounding techniques, citation requirements and verification strategies.', u: 'https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
  { t: 'Mitigate jailbreaks and prompt injections', o: 'Anthropic Docs', d: 'Layered defences and their limits — the source for treating capability restriction as the control and wording as defence in depth.', u: 'https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks' },
  { t: 'Model Context Protocol', o: 'modelcontextprotocol.io', d: 'The specification for tools, resources, prompts and transports referenced in the MCP lesson.', u: 'https://modelcontextprotocol.io' },
  { t: 'OWASP Top 10 for LLM Applications', o: 'OWASP', d: 'The standard threat taxonomy: prompt injection, insecure output handling, excessive agency, data leakage and supply chain risk.', u: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
  { t: 'Claude API — Messages', o: 'Anthropic Docs', d: 'Request shape, sampling parameters, stop reasons, streaming events and usage fields including cache token counts.', u: 'https://docs.claude.com/en/api/messages' },
  { t: 'Rate limits', o: 'Anthropic Docs', d: 'Limit tiers and headers — the basis for the backoff and quota design in the reliability and abuse lessons.', u: 'https://docs.claude.com/en/api/rate-limits' },
  { t: 'Model deprecations', o: 'Anthropic Docs', d: 'Version pinning and deprecation timelines, relevant to the drift discussion in the rollout lesson.', u: 'https://docs.claude.com/en/docs/about-claude/model-deprecations' },
  { t: 'Google Machine Learning Crash Course', o: 'Google', d: 'Background on embeddings, evaluation metrics and the general ML concepts assumed by the foundations module.', u: 'https://developers.google.com/machine-learning/crash-course' },
  { t: 'Hugging Face NLP Course', o: 'Hugging Face', d: 'Tokenizers, transformer mechanics and attention — useful depth behind the foundations lessons.', u: 'https://huggingface.co/learn/nlp-course' }
];

/* ============================================================
   Decision workshop — graded engineering judgement
   ============================================================ */
window.WORKSHOP = [
  { cat: 'Context', q: 'Your agent degrades after 15 turns. What do you change first?',
    o: [ { t: 'Move to a model with a larger context window.', ok: false, why: 'Buys a few more turns at higher cost and converts a loud failure into a quiet one. The mechanism is accumulation, not capacity.' },
         { t: 'Add compaction and evict tool results that have already been acted on.', ok: true, why: 'Attacks the actual cause: resolved history and consumed tool output now dominate the window and dilute the current task.' },
         { t: 'Lower the temperature.', ok: false, why: 'A per-call parameter. It does not change what is in the context or how much of it there is.' } ] },

  { cat: 'Context', q: 'You must cut 10k tokens from an over-budget request. What goes?',
    o: [ { t: 'Half the system prompt.', ok: false, why: 'Without the rules the model does not know what to do with anything else. System content is priority one — never evict it.' },
         { t: 'Compact the middle of history, keeping the first turn and the last three verbatim.', ok: true, why: 'History is lowest priority and grows without bound; the original task and recent turns carry most of the value.' },
         { t: 'Truncate the largest retrieved document at the character level.', ok: false, why: 'A half-chunk has broken provenance and misleads. Drop whole chunks by score instead.' } ] },

  { cat: 'Caching', q: 'Cache hit rate is 3% with a fixed system prompt. Diagnosis?',
    o: [ { t: 'Traffic is too low to keep entries warm.', ok: false, why: 'A real cause on bursty traffic, but check for prefix variation first — it is more common and fully within your control.' },
         { t: 'Something above the breakpoint varies per request. Diff two consecutive prefixes byte for byte.', ok: true, why: 'Near-zero hit rate with caching enabled almost always means the prefix is not byte-identical. Usually a timestamp, an unsorted map, or a user name.' },
         { t: 'The prefix is too short to be cacheable.', ok: false, why: 'Worth confirming once against the minimum length, but it would give 0%, not 3%.' } ] },

  { cat: 'Retrieval', q: 'Users search error codes like "E_1042" and get unrelated results. Fix?',
    o: [ { t: 'Raise top-k.', ok: false, why: 'The right document is not ranking at all. More depth returns more unrelated documents.' },
         { t: 'Add a lexical leg and fuse with RRF.', ok: true, why: 'Exact identifiers are BM25\'s strength and embeddings\' weakness. Fusion gives concept recall and symbol precision together.' },
         { t: 'Fine-tune the embedding model on error codes.', ok: false, why: 'Expensive and fragile, fighting the representation\'s nature to solve something lexical search already handles.' } ] },

  { cat: 'Retrieval', q: 'recall@50 is 95%, recall@5 is 44%, answers are poor. Next step?',
    o: [ { t: 'Improve chunking.', ok: false, why: 'Chunking affects recall@50, which is already excellent. The loss is happening between 50 and 5.' },
         { t: 'Add a cross-encoder reranker over the 50 candidates.', ok: true, why: 'The evidence is being found and then failing to surface. That gap is exactly what reranking closes.' },
         { t: 'Send all 50 documents to the model.', ok: false, why: 'Forty-nine distractors around one answer. Accuracy typically falls despite the higher recall.' } ] },

  { cat: 'Agents', q: 'A task is always: fetch logs, classify, notify. Architecture?',
    o: [ { t: 'An agent with three tools.', ok: false, why: 'You can draw the flowchart, so write the flowchart. Agency here buys unpredictability and cost with no adaptivity benefit.' },
         { t: 'A deterministic three-step chain with model calls at the classify step.', ok: true, why: 'Testable, bounded cost, reproducible failures. The model does the one thing that needs judgement.' },
         { t: 'Three agents in sequence.', ok: false, why: 'Maximum overhead and coordination complexity for steps that need no runtime planning.' } ] },

  { cat: 'Agents', q: 'Your agent has 22 tools and picks wrong ones. Best first move?',
    o: [ { t: 'Write longer descriptions for all 22.', ok: false, why: 'Adds thousands of tokens and usually increases descriptive overlap, making selection worse.' },
         { t: 'Scope the tool set per route to 5–7, merge near-duplicates, rename by intent.', ok: true, why: 'Fewer clearly distinct choices raises selection accuracy far more than better prose about a crowded surface.' },
         { t: 'Add a router model that picks the tool first.', ok: false, why: 'Adds a call and a failure mode to work around a surface you could simplify directly.' } ] },

  { cat: 'Agents', q: 'A tool call fails twice with the same argument error. What should the runtime do?',
    o: [ { t: 'Keep retrying — it may succeed.', ok: false, why: 'Identical inputs produce identical failures. Each retry is a full model call spent on nothing.' },
         { t: 'Inject explicit guidance: do not retry this tool, ask the user or proceed with what you have.', ok: true, why: 'Breaks the loop and gives the model a legal alternative, converting thrashing into a useful outcome.' },
         { t: 'Terminate the run.', ok: false, why: 'Discards progress. The agent may be able to complete the task without that tool.' } ] },

  { cat: 'Security', q: 'Your agent summarises user-uploaded PDFs and can send email. Primary control?',
    o: [ { t: 'A strong instruction to ignore instructions inside documents.', ok: false, why: 'Worthwhile and measurable, but advisory against an unbounded attack surface. Not a control.' },
         { t: 'Split it: a tool-less worker reads the PDF and returns structured findings; email composition happens in a separate step with allowlisted recipients and a human gate.', ok: true, why: 'The injection has no capability to reach. Trust separation plus egress control plus a gate on the irreversible action.' },
         { t: 'Scan PDFs for injection patterns before processing.', ok: false, why: 'A useful layer, but pattern matching loses to paraphrase and encoding. It cannot be the primary control.' } ] },

  { cat: 'Security', q: 'Where does "refunds under $50 are auto-approved" belong?',
    o: [ { t: 'The system prompt, clearly worded.', ok: false, why: 'Advisory in a probabilistic system, unauditable, untestable as a guarantee, and arguable.' },
         { t: 'A policy engine the tool handler calls, evaluated against the authenticated account.', ok: true, why: 'Deterministic, testable, auditable and independently changeable. The model proposes; code decides.' },
         { t: 'A second model call that reviews the first.', ok: false, why: 'Two probabilistic layers still give no guarantee. Defence in depth at best.' } ] },

  { cat: 'Security', q: 'A generated email draft contains a markdown image pointing at an unfamiliar host. What is happening?',
    o: [ { t: 'A rendering quirk — strip it and move on.', ok: false, why: 'Stripping is right; "quirk" is wrong. Understanding it matters because it indicates a live attack.' },
         { t: 'Probable exfiltration — the URL query encodes content and fires when the draft renders. Block it and log the incident.', ok: true, why: 'Markdown image URLs are a working exfiltration channel. Reject hosts not present in the source thread and alert.' },
         { t: 'Harmless — images cannot carry data.', ok: false, why: 'The data travels in the URL itself. The image never needs to load correctly for the request to be made.' } ] },

  { cat: 'Evaluation', q: 'Your eval set passes 95%; users complain. Most likely?',
    o: [ { t: 'The model needs upgrading.', ok: false, why: 'Your evals say it handles the tested distribution well. The gap is between that distribution and reality.' },
         { t: 'Coverage — sample fresh cases from production, especially abandoned and escalated sessions.', ok: true, why: 'A high pass rate with unhappy users is nearly always a coverage problem. Failed sessions are the richest source of missing cases.' },
         { t: 'The pass threshold is too lenient.', ok: false, why: 'Would not explain complaints about behaviour the set never exercises.' } ] },

  { cat: 'Evaluation', q: 'Your LLM judge scores 96% but you have never calibrated it. What do you actually know?',
    o: [ { t: 'That quality is high.', ok: false, why: 'You know the judge approves of the output. Without calibration you do not know whether that correlates with correctness.' },
         { t: 'Almost nothing — human-grade 40 outputs against the same rubric and measure agreement before trusting the number.', ok: true, why: 'An uncalibrated judge measures similarity to its own preferences. Optimising against it optimises the wrong target.' },
         { t: 'That the rubric is well designed.', ok: false, why: 'A poorly specified rubric can be applied consistently and still measure the wrong thing.' } ] },

  { cat: 'Evaluation', q: 'A PR improves quality 3 points and raises cost per case 60%. CI should:',
    o: [ { t: 'Pass — quality improved.', ok: false, why: 'A 60% cost increase would ship invisibly. That is precisely the decision a gate should surface.' },
         { t: 'Fail on the cost threshold, with an override requiring written justification.', ok: true, why: 'The trade may be correct, but it should be a deliberate recorded decision rather than a side effect.' },
         { t: 'Pass with a warning.', ok: false, why: 'Warnings are ignored at scale. Enforce the threshold and allow a deliberate override.' } ] },

  { cat: 'Cost', q: '80% of your calls are short classification turns on a frontier model. First move?',
    o: [ { t: 'Negotiate volume pricing.', ok: false, why: 'Worth doing eventually, but it optimises the wrong term. You are paying frontier rates for a small-model task.' },
         { t: 'Route classification to a small model and measure the quality delta on your eval set.', ok: true, why: 'Addresses 80% of volume directly, and the eval set tells you whether quality actually moved.' },
         { t: 'Halve the context everywhere.', ok: false, why: 'Broad quality risk to fix a structural model-to-task mismatch.' } ] },

  { cat: 'Cost', q: 'Cost per request fell 40% but cost per successful task is flat. What happened?',
    o: [ { t: 'The metric is broken.', ok: false, why: 'The divergence is exactly the signal this metric exists to produce.' },
         { t: 'The cheaper path fails more, so users retry — more requests at lower unit cost, same cost per completed task, worse experience.', ok: true, why: 'The canonical trap. Per-request cost improved while the real economics did not.' },
         { t: 'Traffic grew.', ok: false, why: 'Both metrics are per-unit, so volume does not explain it.' } ] },

  { cat: 'Cost', q: 'One free-tier account produced 40% of yesterday\'s spend. What was missing?',
    o: [ { t: 'A better model.', ok: false, why: 'Unrelated to one account consuming disproportionate resources.' },
         { t: 'Per-user daily token budgets, a spend circuit breaker, and an anomaly alert.', ok: true, why: 'One account should never reach a material share of total spend. A token budget caps it; an alert surfaces it in hours.' },
         { t: 'Stricter content filtering.', ok: false, why: 'A different threat. This is cost abuse.' } ] },

  { cat: 'Latency', q: 'TTFT is 2.4s: retrieval 200ms, rerank 150ms, model TTFT 1.9s. Best move?',
    o: [ { t: 'Drop reranking.', ok: false, why: 'Saves 150ms of 2400 and costs precision. Wrong target by an order of magnitude.' },
         { t: 'Cut input tokens and get the stable prefix cached.', ok: true, why: 'Model TTFT is 79% of the budget, and prompt processing scales with input size.' },
         { t: 'Use a larger model.', ok: false, why: 'Larger models generally increase TTFT, making the reported symptom worse.' } ] },

  { cat: 'Latency', q: 'A voice agent has an 800ms budget. Where does retrieval go?',
    o: [ { t: 'A tool the model calls when it needs context.', ok: false, why: 'A tool round trip plus a second model call exceeds the budget on its own.' },
         { t: 'Speculative prefetch triggered by the partial transcript, running in parallel with the caller finishing their sentence.', ok: true, why: 'Overlaps retrieval with time you are already spending. Occasional wasted prefetches are far cheaper than dead air.' },
         { t: 'Pre-load 40 documents to be safe.', ok: false, why: 'Right on round trips, wrong on volume — prompt processing latency and distractors both rise.' } ] },

  { cat: 'Reliability', q: 'Your provider returns 429s during a spike. Correct behaviour?',
    o: [ { t: 'Retry immediately up to five times.', ok: false, why: 'Adds load to a rate-limited service and worsens the spike for everyone.' },
         { t: 'Back off honouring Retry-After, queue non-interactive work, degrade interactive requests.', ok: true, why: 'Respect the signal, move what can wait off the hot path, keep users served at reduced capability.' },
         { t: 'Return errors to users.', ok: false, why: 'The last rung of the degradation ladder, reached before trying the ones above it.' } ] },

  { cat: 'Reliability', q: 'A user reports a wrong answer from last Tuesday. Which stored field resolves it fastest?',
    o: [ { t: 'The output text.', ok: false, why: 'Confirms it was wrong; says nothing about why.' },
         { t: 'The assembled context — section token counts and retrieved document ids.', ok: true, why: 'Almost always the right document was not retrieved or the relevant content was evicted. Both are immediately visible.' },
         { t: 'The latency breakdown.', ok: false, why: 'Useful for performance work, irrelevant to correctness.' } ] },

  { cat: 'Output', q: 'Your extractor returns schema-valid JSON where the total disagrees with the line items. Fix where?',
    o: [ { t: 'Emphasise arithmetic care in the prompt.', ok: false, why: 'Unreliable, and you still have no detection.' },
         { t: 'A post-parse validator that recomputes the total and rejects mismatches.', ok: true, why: 'Compute deterministically what code can compute. Use the model for extraction, not for verifiable arithmetic.' },
         { t: 'Drop the total field and always compute it.', ok: false, why: 'Often reasonable, but you lose the cross-check that catches a missed line item.' } ] },

  { cat: 'Output', q: 'Your JSON output is occasionally wrapped in a markdown fence. Best fix?',
    o: [ { t: 'Add "do not use markdown" to the prompt.', ok: false, why: 'A negative instruction and a fragile one. It holds until an unusual input.' },
         { t: 'Use tool-calling or native structured output, and keep a fence-stripping fallback in the parser.', ok: true, why: 'Make the constraint structural rather than advisory, and be tolerant in what you accept.' },
         { t: 'Set temperature to 0.', ok: false, why: 'Reduces frequency without eliminating it, and does not add the missing structural constraint.' } ] },

  { cat: 'Memory', q: 'Your assistant insists on a preference the user changed months ago. Root cause?',
    o: [ { t: 'Retrieval ranked the old memory too highly.', ok: false, why: 'Retrieval did its job — the memory is genuinely relevant. It should not still be authoritative.' },
         { t: 'No supersession or expiry, so the newer fact competes with the old rather than replacing it.', ok: true, why: 'Durable memories need supersedes links and confirmation timestamps.' },
         { t: 'The embedding model is stale.', ok: false, why: 'Embeddings encode neither recency nor truth. This is a data-model problem.' } ] },

  { cat: 'Multi-tenant', q: 'How should you isolate tenant data in a shared vector index?',
    o: [ { t: 'A tenant_id filter in every query.', ok: false, why: 'A predicate someone can forget. One missed call site is a cross-tenant leak, and it fails silently.' },
         { t: 'Per-tenant namespaces, plus a wrapper making unfiltered queries inexpressible, plus a CI test.', ok: true, why: 'Turns a silent disclosure bug into a loud query error, with two backstops.' },
         { t: 'Retrieve broadly and filter results afterwards.', ok: false, why: 'The data was already read. Post-filtering is not filtering.' } ] },

  { cat: 'Multi-tenant', q: 'Where does a per-tenant brand persona belong in a cached prompt?',
    o: [ { t: 'At the top, for maximum influence.', ok: false, why: 'Makes every tenant\'s prefix unique and destroys the fleet-wide cache. Often the largest margin leak in a SaaS chatbot.' },
         { t: 'Below the cache breakpoint, after the shared platform prompt and tool schemas.', ok: true, why: 'The shared prefix stays byte-identical and cached; the persona still steers effectively from a later position.' },
         { t: 'Repeated in every user message.', ok: false, why: 'Repeats tokens each turn with no caching benefit.' } ] },

  { cat: 'Human-in-loop', q: 'Your coding agent modifies files. Where is the gate?',
    o: [ { t: 'Before every read and write.', ok: false, why: 'Gating harmless frequent reads creates fatigue that erodes attention on the writes that matter.' },
         { t: 'Show the full diff before writing, per-file accept/reject, and rely on version control for undo.', ok: true, why: 'The diff is the informed-consent surface, granularity allows partial acceptance, VCS provides real reversibility.' },
         { t: 'No gate — review afterwards.', ok: false, why: 'Fine in a sandbox. In a real repository, review before write is the low-cost control.' } ] },

  { cat: 'Rollout', q: 'Quality complaints rise with no deploys in three weeks. First hypothesis?',
    o: [ { t: 'Users became more critical.', ok: false, why: 'Unfalsifiable and unactionable. Check mechanical explanations first.' },
         { t: 'External drift — a provider model update, corpus change, or shift in query distribution. Check the nightly eval trend.', ok: true, why: 'With no code change the change came from outside, and the trend line dates the onset.' },
         { t: 'A caching bug.', ok: false, why: 'Worth checking, but it would surface as cost or latency rather than broad quality complaints.' } ] },

  { cat: 'System design', q: 'You are asked to design an AI feature that sends customer emails. What comes first?',
    o: [ { t: 'Model selection and prompt design.', ok: false, why: 'Layer three of seven. You do not yet know the accuracy bar or whether sending should be automatic.' },
         { t: 'The product contract: what a correct email is, the cost of a wrong one, and who verifies before sending.', ok: true, why: 'Sending is irreversible and outward-facing, so the verification question determines the whole architecture.' },
         { t: 'The retrieval design for customer history.', ok: false, why: 'Layer two, and unscopeable until you know what correctness requires.' } ] },

  { cat: 'Multi-agent', q: 'When does fan-out to workers justify its cost?',
    o: [ { t: 'Whenever the task is complex.', ok: false, why: 'Complexity alone does not justify a large cost multiplier. Better retrieval often suffices.' },
         { t: 'When the compression ratio is high — workers absorb tens of thousands of tokens and return hundreds — and sub-tasks are independent.', ok: true, why: 'Isolation pays when there is a lot of reading whose bulk must not reach the main context. Measure it first.' },
         { t: 'When you need results faster.', ok: false, why: 'You still wait for the slowest worker and pay several times more.' } ] }
];
