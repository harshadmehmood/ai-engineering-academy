/* ============================================================
   data-curriculum-b.js
   Modules 4–5: Retrieval & Knowledge Systems · Tools & Agents
   ============================================================ */
window.CURRICULUM_B = [

/* ==========================================================
   MODULE 4 — RETRIEVAL & KNOWLEDGE SYSTEMS
   ========================================================== */
{
  title: 'Retrieval & Knowledge Systems',
  slug: 'retrieval',
  desc: 'Getting the right evidence in front of the model, with provenance a human can check.',
  lessons: [

  {
    id: 'rag-basics',
    title: 'RAG: the pipeline and where it breaks',
    mins: 13, level: 'core',
    summary: 'Retrieval-augmented generation is six stages. Measure each one, because a single end-to-end number tells you nothing.',
    body: `
{{diagram:rag-pipeline}}

RAG grounds generation in retrieved evidence so the model answers from your data rather than its training distribution. The architecture is simple; the quality lives entirely in the details of each stage.

## The six stages, and the failure at each

**1. Query understanding.** The raw user question is often a poor search query. "what about the other one" carries no searchable terms. *Failure:* searching the literal text of a follow-up question. *Fix:* rewrite the query using conversation context before searching.

**2. Retrieval.** Fetch candidates. *Failure:* vector-only search missing exact identifiers. *Fix:* hybrid — lexical plus vector plus structured filters.

**3. Fusion.** Combine ranked lists from multiple retrievers. *Failure:* naively averaging incomparable scores. *Fix:* Reciprocal Rank Fusion, which uses ranks rather than scores and needs no calibration.

**4. Reranking.** A cross-encoder scores each candidate against the query directly. *Failure:* skipping it and sending 20 documents. *Fix:* retrieve 100, rerank, send 5.

**5. Packing.** Fit the selected evidence into the budget with provenance. *Failure:* truncating mid-chunk, dropping citations, no freshness markers. *Fix:* whole chunks only, each with source metadata.

**6. Generation.** Answer with citations. *Failure:* no refusal path, so the model answers from parametric memory when retrieval found nothing. *Fix:* an explicit "not in context" output shape, and a check that cited spans actually resolve.

{{callout:bad|The most damaging RAG bug is the silent fallback: retrieval returns nothing useful, and the model answers anyway from what it happens to know. The answer looks identical to a grounded one. Without a resolves-to-source check you will never detect it.}}

## Measure per stage

| Stage | Metric | Question it answers |
|---|---|---|
| Retrieval | recall@50 | Is the answer in the candidate set at all? |
| Rerank | recall@5, MRR | Did we surface it into the final few? |
| Packing | truncation rate | Did we accidentally cut the evidence? |
| Generation | faithfulness | Is every claim supported by the packed context? |
| Generation | citation validity | Do the cited spans actually exist? |
| End to end | answer correctness | Did the user get the right answer? |

Recall@50 is the ceiling on everything downstream. If the answer is not in the candidate set, no amount of reranking or prompting recovers it. **Debug retrieval before you debug the prompt** — a very large share of "the model is wrong" tickets are actually recall failures.

## When RAG is the wrong tool

- **Aggregations.** "How many open tickets this month?" is a SQL query. Retrieval samples documents; it cannot count.
- **Whole-corpus reasoning.** "What themes appear across all 400 reviews?" needs a map-reduce pass, not top-k.
- **Small corpora.** Under ~50k tokens total, just include everything. A retrieval pipeline adds latency and failure modes to solve a problem you do not have.
- **Highly structured data.** If it lives in tables with a schema, query it. Text-to-SQL with validation beats embedding your database rows.

## The hybrid that ships

Most real products need routing, not one pipeline: classify the question, then dispatch to SQL for aggregates, retrieval for document questions, a direct tool for live state, and a refusal for out-of-scope. That router is a small cheap classifier and it typically improves quality more than any single retrieval tweak.
`,
    keyPoints: [
      'RAG is six stages, each with a distinct failure mode and its own metric.',
      'Recall@k at the candidate stage is the hard ceiling on everything downstream.',
      'The silent fallback — answering ungrounded when retrieval fails — is the most damaging bug.',
      'Aggregations, whole-corpus questions and structured data need SQL or map-reduce, not top-k.',
      'A cheap question-router in front of several strategies usually beats tuning one pipeline.'
    ],
    pitfalls: [
      { t: 'One end-to-end score', d: 'Tells you something is wrong and nothing about where.' },
      { t: 'Searching the literal follow-up question', d: '"what about the other one" has no searchable content — rewrite first.' },
      { t: 'RAG for counting', d: 'Top-k sampling cannot produce a correct aggregate. Use the database.' }
    ],
    quiz: [{
      q: 'Answer quality is poor. recall@50 is 62%. Where do you work first?',
      options: [
        { t: 'Improve the generation prompt.', ok: false, why: 'Nearly four in ten questions have no correct evidence available at all. Prompting cannot fix missing information.' },
        { t: 'Fix retrieval — chunking, hybrid search, query rewriting — until recall@50 is high.', ok: true, why: 'Correct. Recall at the candidate stage caps every downstream stage. Until it is high, nothing else you tune can be evaluated meaningfully.' },
        { t: 'Add a reranker.', ok: false, why: 'A reranker only reorders what retrieval already found. It cannot introduce a document that was never a candidate.' }
      ]
    }],
    lab: {
      title: 'Instrument your pipeline',
      steps: [
        'Build 30 question/answer pairs where you know the correct source document.',
        'Log the candidate set, post-rerank set, and packed set for each.',
        'Compute recall@50, recall@5, and citation-resolves rate.',
        'The lowest number is your bottleneck. Work only on that until it is not.'
      ]
    },
    refs: [['Anthropic — Contextual retrieval', 'https://www.anthropic.com/news/contextual-retrieval']]
  },

  {
    id: 'chunking',
    title: 'Chunking: the decision that caps everything',
    mins: 12, level: 'applied',
    summary: 'A chunk is the smallest retrievable unit. If the answer spans two chunks, no retriever can ever return it whole.',
    body: `
{{diagram:chunking}}

Chunking looks like a preprocessing detail. It is actually the hardest ceiling in your retrieval system: **you can only ever retrieve what a chunk contains.**

## Why naive fixed-size splitting fails

Splitting every 500 characters is fast and cuts through the middle of sentences, tables, code functions and — critically — the relationship between a claim and its qualifier. The classic damage:

> Chunk 41: "…the trial period lasts 30 days."
> Chunk 42: "…unless the account is enterprise-tier, in which case it is 90 days."

Retrieve chunk 41 and the model confidently gives a wrong answer to an enterprise customer. Nothing in the system detects this.

## Structure-aware chunking

Split on the document's own boundaries, then merge or split to hit a target size:

- **Markdown / HTML** — split on headings; carry the heading path into each chunk.
- **PDF** — split on section headings when the outline is available; fall back to page boundaries; preserve tables whole.
- **Code** — split on function and type declarations, never mid-body. Include the file path and enclosing type.
- **Transcripts** — split on speaker turns or topic shifts, not on time.
- **Spreadsheets** — one chunk per logical table with the header row repeated in every chunk.

Target 300–800 tokens for prose. Smaller is more precise and loses context; larger carries context and dilutes the embedding. Overlap of 10–15% at boundaries catches claims that straddle a split.

## Contextual chunk enrichment

The technique with the largest measured impact on retrieval quality: prepend a short, generated description of where the chunk sits in its document before embedding it.

\`\`\`
[Contract_4417.pdf · §4 Payment Terms · Enterprise addendum · updated 2026-03-11]
This section defines the trial period and its exceptions for enterprise accounts.

The trial period lasts 30 days unless the account is enterprise-tier...
\`\`\`

Now the chunk is retrievable by "enterprise trial length" even though the original text never uses the phrase. You generate these once at index time with a cheap model — it is a one-off cost per document that pays back on every query. Published results on this technique show substantial reductions in retrieval failure rate.

{{callout:good|Store the enriched text for embedding, and the original text for display and citation. Never show the user your generated preamble as if it were the source document.}}

## Metadata is not optional

Every chunk carries:

\`\`\`ts
{
  id, documentId, text, embedding,
  sectionPath: 'Contract > §4 Payment > 4.2 Trial',
  page: 7,
  updatedAt: '2026-03-11',
  status: 'current' | 'superseded' | 'draft',
  tenantId,          // enforced filter, always
  sourceUri
}
\`\`\`

\`sectionPath\` and \`page\` make citation verifiable. \`updatedAt\` and \`status\` let the model resolve conflicts between versions. \`tenantId\` is a security control that must be applied in the query, not filtered afterwards.

## The parent-document pattern

Embed small chunks for retrieval precision, but return the **parent section** for generation context. You get the targeting benefit of small chunks and the completeness benefit of large ones. Implementation is a \`parentId\` on each chunk and a fetch after reranking. This resolves most of the small-versus-large tension and is worth adopting by default.

## Re-chunking is a migration

Changing your strategy means re-processing and re-embedding everything. Version your chunking config, store the version on each chunk, and plan for a dual-index cutover rather than an in-place rewrite.
`,
    keyPoints: [
      'A chunk is the atomic retrievable unit — answers spanning two chunks are unreachable.',
      'Split on document structure, then size; 300–800 tokens with 10–15% overlap for prose.',
      'Contextual enrichment at index time is the single highest-impact retrieval improvement.',
      'Carry section path, page, freshness, status and tenant on every chunk.',
      'Parent-document retrieval: embed small, return the enclosing section.'
    ],
    pitfalls: [
      { t: 'Fixed-size character splitting', d: 'Severs claims from their qualifiers with no detection.' },
      { t: 'Splitting tables', d: 'A table fragment without its header row is unusable and actively misleading.' },
      { t: 'Post-filtering by tenant', d: 'The filter must be in the query. Post-filtering means the wrong tenant\'s data was already retrieved.' }
    ],
    quiz: [{
      q: 'Your legal assistant answers correctly about clause text but wrongly about which clause a rule belongs to. Likely cause?',
      options: [
        { t: 'The model is not reading carefully.', ok: false, why: 'The information about section membership probably is not in the context at all — the chunks lack it.' },
        { t: 'Chunks lack a section path, so the model cannot tell where the text came from.', ok: true, why: 'Correct. Structural metadata must be carried into the chunk. Without sectionPath the model can only guess, and it guesses plausibly.' },
        { t: 'Chunks are too small.', ok: false, why: 'Possible, but adding the section path is cheaper, more targeted, and also makes citations verifiable.' }
      ]
    }],
    lab: {
      title: 'Chunk quality audit',
      steps: [
        'Sample 20 random chunks from your index and read them cold.',
        'For each, ask: could I answer a question from this alone, and could I cite where it came from?',
        'Count how many fail either test — that fraction is roughly your retrieval quality ceiling.',
        'Add contextual enrichment to 100 documents and re-run recall@5 on the questions that touch them.'
      ]
    },
    refs: [['Anthropic — Contextual retrieval', 'https://www.anthropic.com/news/contextual-retrieval']]
  },

  {
    id: 'hybrid-search',
    title: 'Hybrid search and rank fusion',
    mins: 12, level: 'applied',
    summary: 'Lexical finds the exact token; vectors find the paraphrase. Fuse by rank, not by score.',
    body: `
Vector-only search is a prototype architecture. Production retrieval runs at least two retrievers and fuses them, because their failure modes are complementary.

## What each is for

**Lexical (BM25)** matches exact terms with statistical weighting. Excellent for identifiers, error codes, names, version numbers, quoted phrases. Fails completely on paraphrase — a query with no shared words scores zero.

**Vector** matches meaning. Excellent for paraphrase and conceptual similarity. Blurs rare tokens and cannot express negation or numeric constraints.

**Structured filters** are neither. \`tenant_id = X AND status = 'current' AND created > '2026-01-01'\` is a WHERE clause, and it belongs in the query as a hard pre-filter — not as something the ranker approximates.

## Fusing correctly: RRF

BM25 scores and cosine similarities are on incomparable scales. Averaging them, or normalising and weighting them, requires per-corpus calibration that drifts. **Reciprocal Rank Fusion** sidesteps the problem by using only positions:

\`\`\`ts
function rrf(lists: string[][], k = 60): Array<[string, number]> {
  const scores = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, i) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
    });
  }
  return [...scores].sort((a, b) => b[1] - a[1]);
}

const fused = rrf([bm25Results, vectorResults, symbolResults]);
\`\`\`

Fifteen lines, no calibration, no tuning, robust across corpora. The constant \`k = 60\` is a widely used default that dampens the influence of the very top ranks; it rarely needs changing. A document appearing in both lists rises above one that tops a single list — which is exactly the behaviour you want.

{{callout:good|RRF is one of the best effort-to-value ratios in retrieval engineering. If you are running vector-only today, adding BM25 plus RRF is typically a half-day change with a large, immediately measurable recall improvement.}}

## Query rewriting comes first

Before searching, transform the query using conversation context:

- **Decontextualise.** "what about the enterprise one" → "enterprise tier trial period length".
- **Expand.** Add synonyms and likely alternate phrasings for the lexical leg.
- **Decompose.** "Compare our refund policy to the EU requirement" is two searches, not one.
- **Extract filters.** Pull dates, ids and statuses out of the natural-language query and into structured predicates.

This is a cheap small-model call and it frequently moves recall more than any index change. Do it once and reuse the rewritten query across all retrievers.

## Tenant and permission filtering

The filter is a pre-filter in the query, applied at the data layer. Two rules:

1. It is never optional and never applied at a call site — wrap the store so an unfiltered query is not expressible.
2. Post-filtering is not filtering. If you retrieve top-50 then remove other tenants' documents, you already read them, your top-k is now unpredictably small, and one logging mistake leaks them.

## Know when to stop

Diminishing returns arrive quickly. Hybrid plus RRF plus a reranker covers the large majority of real needs. Graph retrieval, HyDE, multi-vector representations and query-generation ensembles each add real value in specific situations and add real complexity everywhere. Get the fundamentals measurably right first; you will usually find you do not need them.
`,
    keyPoints: [
      'Run lexical and vector retrieval together — their failure modes are complementary.',
      'Fuse with Reciprocal Rank Fusion; it needs no score calibration.',
      'Rewrite the query first: decontextualise, expand, decompose, extract filters.',
      'Tenant and permission filters are pre-filters enforced at the data layer.',
      'Hybrid + RRF + rerank covers most needs; exotic techniques rarely pay for their complexity.'
    ],
    pitfalls: [
      { t: 'Averaging BM25 and cosine scores', d: 'Incomparable scales; requires per-corpus calibration that silently drifts.' },
      { t: 'Searching raw follow-up questions', d: 'Pronouns and ellipsis carry no searchable signal.' },
      { t: 'Post-filtering by tenant', d: 'Data already read, unpredictable result counts, one log line from a breach.' }
    ],
    quiz: [{
      q: 'Users search invoice numbers like "INV-2026-4417" and get unrelated invoices. Fix?',
      options: [
        { t: 'Increase top-k.', ok: false, why: 'The exact document is not ranking at all — it is not a depth problem. More results means more unrelated invoices.' },
        { t: 'Add a lexical/exact-match leg for identifier patterns and fuse with RRF.', ok: true, why: 'Correct. Identifiers are lexical search\'s core strength and vector search\'s core weakness. Detect the pattern and make sure the exact-match leg runs.' },
        { t: 'Fine-tune the embedding model on invoice numbers.', ok: false, why: 'Expensive, fragile, and fighting the representation\'s nature. BM25 already solves this for free.' }
      ]
    }],
    lab: {
      title: 'Add BM25 and measure',
      steps: [
        'Add a lexical index alongside your vector index over the same chunks.',
        'Implement the 15-line RRF function above.',
        'Run your 30-question eval set with vector-only, then with fusion.',
        'Report the recall@10 delta. Also record which queries only the lexical leg found — those characterise your blind spot.'
      ]
    },
    refs: [['Anthropic — Contextual retrieval', 'https://www.anthropic.com/news/contextual-retrieval']]
  },

  {
    id: 'reranking',
    title: 'Reranking: buying precision cheaply',
    mins: 10, level: 'applied',
    summary: 'Retrieve 100 for recall, rerank to 5 for precision. The reranker is far cheaper than the generation call it protects.',
    body: `
Retrieval optimises recall — cast a wide net. Generation needs precision — few, highly relevant documents. A reranker converts one into the other.

## Why it works better than the retriever

A bi-encoder embeds the query and the document **separately**, then compares vectors. The document was embedded before your query existed, so its representation cannot depend on it. That is what makes the index possible, and it is what limits quality.

A cross-encoder reranker takes \`(query, document)\` **together** and produces a relevance score. It can attend across both. It is far more accurate and far too slow to run over a million documents — but running it over 100 candidates is fast and cheap.

That is the whole architecture: **cheap and approximate to narrow to 100, expensive and accurate to narrow to 5.**

## Where it pays

\`\`\`
vector top-100      recall 94%   precision@5  31%
+ cross-encoder     recall 94%   precision@5  78%
\`\`\`

Recall is unchanged — the reranker cannot find what retrieval missed. Precision at the point of generation roughly doubles, and per the context-rot lesson, precision at generation is what drives answer quality.

{{callout:|Compare the cost honestly. A reranker call over 100 short candidates is typically a small fraction of the cost of the generation call it feeds. And by cutting 15 documents from the prompt it often *saves* more than it costs.}}

## Three implementations

**Hosted cross-encoder reranker.** One API call, strong quality, simple. The default choice.

**LLM-as-reranker.** Give a small model the query and 20 candidate summaries; ask for the ids of the most relevant, in order. More flexible — you can express criteria like "prefer current over superseded" directly in the instruction. Slower and more expensive than a dedicated reranker.

**Local cross-encoder.** A small model running in your own infrastructure. Best latency and cost at volume, and required if documents cannot leave your environment.

## Rerank on more than relevance

Pure semantic relevance is not the objective. A production ranker should also account for:

- **Freshness** — a superseded policy that is textually perfect is the wrong answer.
- **Authority** — the official document outranks a forum thread that quotes it.
- **Diversity** — five near-identical chunks waste four slots. Apply Maximal Marginal Relevance or simple near-duplicate suppression after reranking.

A practical composite: \`final = rerankScore × freshnessDecay × authorityWeight\`, then MMR for diversity. Keep the weights in config so you can tune them against your eval set rather than in a code review.

## Set k by measurement

Do not pick 5 because it sounds right. Run the distractor-knee experiment from the context-rot lesson: hold everything constant, sweep k, and plot answer accuracy. Use the knee. It is usually lower than people expect, and it is specific to your corpus and question distribution.
`,
    keyPoints: [
      'Bi-encoders enable the index; cross-encoders deliver precision over a shortlist.',
      'Reranking cannot improve recall — only retrieval can.',
      'Cost is small relative to generation, and cutting documents often nets a saving.',
      'Combine relevance with freshness, authority and diversity.',
      'Choose final k empirically from an accuracy-versus-k curve.'
    ],
    pitfalls: [
      { t: 'Reranking a shortlist of 10', d: 'Too little to choose from. Retrieve 50–200 so the reranker has real work to do.' },
      { t: 'Ignoring near-duplicates', d: 'Five copies of one chunk occupy five slots and manufacture false consensus.' },
      { t: 'Relevance-only scoring', d: 'Returns the textually perfect but superseded document.' }
    ],
    quiz: [{
      q: 'recall@50 is 95% but answers are still often wrong. Next step?',
      options: [
        { t: 'Retrieve top-100 instead of 50.', ok: false, why: 'Recall is already excellent. Adding candidates adds distractors and does not address the actual gap.' },
        { t: 'Add reranking and cut what reaches the model from 50 to about 5.', ok: true, why: 'Correct. The evidence is being found and then buried among distractors. This is precisely the precision-at-generation problem reranking solves.' },
        { t: 'Switch to a larger generation model.', ok: false, why: 'More capable models tolerate distractors somewhat better, but you are paying more to work around a fixable pipeline defect.' }
      ]
    }],
    lab: {
      title: 'Measure the precision lift',
      steps: [
        'Label the correct source document for 30 eval questions.',
        'Record precision@5 with your current retriever.',
        'Add a reranker over the top-50 and record precision@5 again.',
        'Also record the token delta in the packed context — you will likely find the reranker pays for itself.'
      ]
    },
    refs: [['Anthropic — Contextual retrieval', 'https://www.anthropic.com/news/contextual-retrieval']]
  },

  {
    id: 'agentic-search',
    title: 'Agentic search: letting the model drive retrieval',
    mins: 11, level: 'advanced',
    summary: 'One-shot retrieval answers one-shot questions. Multi-hop questions need the model in the search loop.',
    body: `
Classic RAG retrieves once, then answers. That works when the question maps to a single lookup. It fails when answering requires a chain:

> "Which of our enterprise customers are on a contract that auto-renews before the new pricing takes effect?"

You cannot embed that into one query. You need the new pricing date, then the enterprise customer list, then each contract's renewal terms, then a comparison. Three dependent searches and a computation.

## The agentic loop

Give the model search as a tool and let it iterate:

\`\`\`
search("new pricing effective date")
  → "Pricing v4 effective 2026-09-01"
search("enterprise customers active contracts")
  → 14 accounts
for each: getContract(id) → renewal terms
compare, then answer with citations
\`\`\`

Each step is informed by the previous one. The model is doing what a competent analyst does: forming a plan, gathering, refining.

## What you gain, and what you pay

**Gain:** multi-hop reasoning, self-correction after a bad search, adaptive depth, and a legible audit trail — the tool-call sequence documents exactly how the answer was reached.

**Pay:** several model calls instead of one, so several times the latency and cost. Non-determinism in the search path, which makes evaluation harder. New failure modes: loops, premature stopping, and drift toward a nearby-but-different question.

## Controls that make it usable

**Cap iterations.** Typically 5–15, with a clear terminal message so the model concludes gracefully instead of thrashing.

**Require progress.** Track queries issued. If two consecutive searches return substantially the same document set, inject a nudge: *"That search returned the same results. Try different terms or answer with what you have."*

**Force a final grounded answer.** The last turn must produce the structured answer with citations, and citations must resolve. Do not let the loop end in a tool call.

**Log the whole trajectory.** Query sequence, result counts, and which documents ultimately supported the answer. This is your primary debugging surface and it is also the input to your eval set.

{{callout:warn|Evaluate the trajectory, not just the answer. An agent that reaches the right answer by luck after nine flailing searches is a latent failure — it will not be lucky on the next question. Track searches-per-answer as a quality metric.}}

## The pragmatic hybrid

Route by question shape. A cheap classifier decides:

- **Simple lookup** → one-shot RAG. Fast, cheap, predictable. Most traffic.
- **Multi-hop or comparative** → agentic loop with a budget.
- **Aggregate or numeric** → generate SQL, validate it, execute it.
- **Out of scope** → refuse with a helpful redirect.

This gives you agentic capability where it earns its cost, without paying for it on the eighty percent of questions that are a single lookup.

## A note on tool granularity

Agentic search works far better with a few well-shaped tools than with one \`search(query)\`. Give it \`searchDocs\`, \`getDocument(id)\`, \`listByFilter({...})\` and \`getEntity(type, id)\`. The distinct shapes let the model express what it is actually trying to do, and the resulting trajectories are dramatically easier to read.
`,
    keyPoints: [
      'Multi-hop questions need iterative, model-driven retrieval.',
      'You gain self-correction and an audit trail; you pay several times the latency and cost.',
      'Cap iterations, detect no-progress loops, and force a final grounded answer.',
      'Evaluate the trajectory — searches-per-answer is a real quality metric.',
      'Route by question shape so only the questions that need it pay agentic prices.'
    ],
    pitfalls: [
      { t: 'No iteration cap', d: 'A confused agent searches until the budget is gone.' },
      { t: 'Agentic search for every question', d: 'Multiplies cost and latency on the simple lookups that dominate traffic.' },
      { t: 'Judging only the final answer', d: 'Hides trajectories that succeeded by luck and will fail next time.' }
    ],
    quiz: [{
      q: 'Your agent searches the same terms three times in a row and then answers vaguely. Best fix?',
      options: [
        { t: 'Raise the iteration cap so it has more attempts.', ok: false, why: 'It is not making progress. More iterations of the same behaviour produces more cost and the same vague answer.' },
        { t: 'Detect repeated result sets and inject explicit guidance to change strategy or answer with what it has.', ok: true, why: 'Correct. Loop detection with a corrective nudge converts thrashing into either a better search or an honest partial answer.' },
        { t: 'Lower the temperature.', ok: false, why: 'Would likely make the repetition worse by reducing variation in query formulation.' }
      ]
    }],
    lab: {
      title: 'Trajectory analysis',
      steps: [
        'Log full search trajectories for 20 real agentic questions.',
        'Categorise each: direct hit, productive refinement, loop, or drift.',
        'Compute average searches per answer and the loop rate.',
        'Add loop detection and re-measure. Track the cost delta as well as the quality delta.'
      ]
    },
    refs: [['Anthropic — Building effective agents', 'https://www.anthropic.com/engineering/building-effective-agents']]
  },

  {
    id: 'rag-eval',
    title: 'Evaluating retrieval systems',
    mins: 11, level: 'applied',
    summary: 'Faithfulness, relevance and recall are three separate numbers. Reporting one hides the other two.',
    body: `
Retrieval evaluation splits cleanly into two halves: did we find the right evidence, and did we use it honestly?

## Retrieval metrics

**Recall@k** — fraction of questions whose correct source appears in the top k. Your ceiling. Measure at your candidate depth (50 or 100) and at your final depth (5).

**Precision@k** — fraction of returned documents that are actually relevant. Drives context efficiency and, via distraction, answer quality.

**MRR** — mean reciprocal rank of the first correct result. Sensitive to whether the right answer is at position 1 versus position 8.

**nDCG@k** — rank-weighted relevance with graded labels. Use when relevance is not binary.

You need labelled data: question → correct source documents. Fifty to two hundred pairs. Build it from real questions and have a human label the sources. This is genuinely a few days of work and it is the foundation everything else stands on.

{{callout:good|A shortcut for bootstrapping: take documents you have, ask a model to generate questions each one uniquely answers, then have a human filter out the bad ones. You get 60–70% usable pairs for a fraction of the effort. Keep a human-only held-out set to check that the generated set is not systematically easier.}}

## Generation metrics

**Faithfulness (groundedness)** — is every claim in the answer supported by the provided context? The most important generation metric in RAG, because an unfaithful answer is a confident lie with citations attached.

Measure it by decomposing the answer into atomic claims and checking each against the context. An LLM judge does this well; calibrate it against human labels first.

**Answer relevance** — does the answer address the question that was asked? A faithful answer to a different question is still a failure.

**Citation validity** — do the cited spans exist verbatim in the cited documents? Fully deterministic, cheap, and it catches a real class of hallucination with zero model calls. Every RAG system should have this check in production, not just in evals.

**Refusal correctness** — when the context genuinely lacks the answer, does the system say so? Build a deliberate subset of questions your corpus cannot answer. Many systems score well on everything else and fail this completely.

## The scorecard

| Metric | Type | Target |
|---|---|---|
| recall@50 | deterministic | > 90% |
| recall@5 | deterministic | > 80% |
| citation validity | deterministic | > 98% |
| faithfulness | LLM judge | > 90% |
| answer relevance | LLM judge | > 90% |
| refusal correctness | labelled subset | > 85% |
| p95 latency | measured | your budget |
| cost per query | measured | your budget |

Run the deterministic rows in CI on every change — they are fast and free. Run the judged rows nightly or per release.

## Watch for the ratchet

Two drifts to guard against. **Corpus drift:** your documents change, so an eval set built in January silently measures a system that no longer exists. **Overfitting:** optimising hard against a fixed set eventually tunes to the test. Refresh 10–20% of cases quarterly from current traffic, and keep a held-out set you never look at during development.
`,
    keyPoints: [
      'Separate retrieval metrics (recall, precision, MRR) from generation metrics (faithfulness, relevance).',
      'Citation validity is deterministic, free, and catches real hallucinations — run it in production.',
      'Include a subset of unanswerable questions to test refusal behaviour explicitly.',
      'Run deterministic checks in CI; run judged metrics nightly.',
      'Refresh the eval set to counter corpus drift and overfitting.'
    ],
    pitfalls: [
      { t: 'One "quality" number', d: 'Cannot distinguish a retrieval miss from an unfaithful answer.' },
      { t: 'No unanswerable questions', d: 'You never measure whether the system can decline.' },
      { t: 'Stale eval set', d: 'Measures a corpus that no longer exists.' }
    ],
    quiz: [{
      q: 'Faithfulness scores 96% but users report wrong answers. What is the most likely gap?',
      options: [
        { t: 'The faithfulness judge is broken.', ok: false, why: 'Possible — but there is a more common explanation that this exact metric pattern points to.' },
        { t: 'Answers are faithful to retrieved context that is itself the wrong or outdated context — check recall and freshness.', ok: true, why: 'Correct. Faithfulness only measures answer-to-context consistency. Retrieve the superseded policy and you get a perfectly faithful wrong answer.' },
        { t: 'Temperature is too high.', ok: false, why: 'High temperature would tend to reduce faithfulness, not preserve it at 96%.' }
      ]
    }],
    lab: {
      title: 'Build the scorecard',
      steps: [
        'Label 50 question/source pairs, including 8 that your corpus genuinely cannot answer.',
        'Implement recall@k and citation-validity as deterministic checks.',
        'Write a faithfulness judge prompt and calibrate it against 20 human-graded answers.',
        'Publish all eight scorecard rows and wire the deterministic ones into CI.'
      ]
    },
    refs: [['Anthropic — Define success criteria', 'https://docs.claude.com/en/docs/test-and-evaluate/define-success']]
  }
]},

/* ==========================================================
   MODULE 5 — TOOLS & AGENTS
   ========================================================== */
{
  title: 'Tools & Agents',
  slug: 'agents',
  desc: 'Giving a model the ability to act, without giving it authority you cannot revoke.',
  lessons: [

  {
    id: 'tool-design',
    title: 'Designing tools a model can use correctly',
    mins: 13, level: 'core',
    summary: 'A tool is an API for a reader who has never seen your codebase and cannot ask a question.',
    body: `
{{diagram:tool-boundary}}

Tool design is API design for an unusual consumer: it reads only your names, descriptions and schema; it cannot read your source; and when it is unsure it does not ask — it guesses plausibly.

## Six rules

**1. One clear purpose per tool.** \`manageUser(action, params)\` forces the model to reason about a mode switch before reasoning about the task. \`getUser\`, \`updateUserEmail\`, \`deactivateUser\` are three unambiguous choices.

**2. Types that constrain.** Enums over strings. Explicit formats. Bounded numbers.

\`\`\`ts
// Weak
{ dateRange: string, limit: number, status: string }

// Strong
{ dateRange: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' },
  limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
  status: { enum: ['open','pending','closed'] } }
\`\`\`

Every constraint expressed in the schema is a class of error the model cannot make.

**3. Describe when to use it, not just what it does.** The model's hard problem is selection, not invocation.

> \`searchOrders\` — Find orders by customer, date range or status. Use when you need to locate an order and do not have its id. If you have the id, use \`getOrder\` instead.

That final sentence prevents a specific, common mistake.

**4. Bound the output.** Every list tool needs a default limit, a maximum, and a truncation flag. Return the fields the model needs, not your full row.

**5. Make errors instructive.** The error text is context the model will act on. \`"Invalid status 'active'. Valid values: open, pending, closed."\` produces a correct retry. \`"Bad request"\` produces a loop.

**6. Separate read from write, always.** Reads can be liberal. Writes are gated: narrower, idempotent, logged, and — for anything destructive or financial — behind explicit human confirmation your code enforces.

## Idempotency

An agent may retry after a timeout, or call twice after an ambiguous result. Every write tool takes a client-supplied idempotency key:

\`\`\`ts
issueRefund({ orderId, amount, idempotencyKey: \`refund-\${orderId}-\${attempt}\` })
\`\`\`

Without this, a network blip becomes a double refund. This is not an AI-specific concern; it is ordinary distributed-systems hygiene that AI systems hit far more often because retries are automatic and frequent.

## Return shapes that teach

\`\`\`ts
// Poor
{ ok: true, data: [ ...50 full records... ] }

// Good
{ matched: 312, returned: 20, truncated: true,
  results: [{ id, customer, total, status, date }],
  nextCursor: 'eyJvZmZzZXQiOjIwfQ',
  hint: 'Narrow by status or dateRange to reduce results.' }
\`\`\`

The model now knows the result was incomplete, how to get more, and how to search better. That single \`hint\` field measurably reduces flailing.

{{callout:|Test your tool descriptions the way you would test a prompt. Give a competent engineer only the tool list and ten user requests, and ask which tool they would call. Every disagreement is a defect the model will hit at a higher rate than the human did.}}

## Authorization is never the model's job

The tool handler resolves the caller's identity from the session, checks permission against the real authorization system, validates every argument against the schema **and** against business rules, then executes. The model's proposal is an input to that process, never a substitute for it.
`,
    keyPoints: [
      'One purpose per tool; the model\'s hard problem is selection, not invocation.',
      'Encode constraints in the schema — enums, formats, bounds — so errors become unrepresentable.',
      'Descriptions must say when to use the tool and what to use instead.',
      'Bound outputs, flag truncation, and return an actionable hint.',
      'Idempotency keys on every write; authorization always in the handler.'
    ],
    pitfalls: [
      { t: 'Multi-mode "manager" tools', d: 'Adds a mode-selection error on top of the real task.' },
      { t: 'Unbounded list results', d: 'One call consumes the context budget.' },
      { t: 'No idempotency', d: 'Automatic retries turn a timeout into a duplicate side effect.' }
    ],
    quiz: [{
      q: 'Your agent sometimes calls searchOrders when it already has the order id. Best fix?',
      options: [
        { t: 'Add a rule to the system prompt about which to use.', ok: false, why: 'Works sometimes. The information belongs next to the tool it governs, where it is read at selection time.' },
        { t: 'Add "If you have the order id, use getOrder instead" to the searchOrders description.', ok: true, why: 'Correct. Selection guidance belongs in the tool description — that is what the model reads when choosing. It is also more robust to prompt edits.' },
        { t: 'Remove searchOrders.', ok: false, why: 'Eliminates a legitimate capability to fix a disambiguation problem you can solve with one sentence.' }
      ]
    }],
    lab: {
      title: 'Tool description review',
      steps: [
        'Print your tool list — names, descriptions and schemas only.',
        'Give it to a colleague with ten realistic user requests and ask which tool they would call for each.',
        'Every disagreement or hesitation is a defect.',
        'Fix by renaming, merging, or adding "use X instead when…" guidance, then re-test.'
      ]
    },
    refs: [['Anthropic — Tool use', 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview']]
  },

  {
    id: 'agent-loop',
    title: 'The agent loop and stop conditions',
    mins: 12, level: 'core',
    summary: 'An agent is a while-loop around a model call. Everything hard is in the loop conditions.',
    body: `
{{diagram:agent-loop}}

\`\`\`ts
async function runAgent(task: string, ctx: Ctx) {
  const messages = [{ role: 'user', content: task }];
  let iterations = 0, tokens = 0;

  while (iterations++ < ctx.maxIterations) {
    const res = await model.run({ system: ctx.system, messages, tools: ctx.tools });
    tokens += res.usage.total;
    messages.push({ role: 'assistant', content: res.content });

    if (res.stopReason !== 'tool_use') return { answer: res.text, iterations, tokens };
    if (tokens > ctx.maxTokens) return { answer: await forceConclude(messages), reason: 'budget' };

    const results = await Promise.all(res.toolCalls.map(async call => {
      if (!ctx.allowed.has(call.name)) return err(call, 'Tool not available on this route.');
      const args = ctx.schemas[call.name].safeParse(call.input);
      if (!args.success) return err(call, formatIssues(args.error));
      if (isDestructive(call.name) && !await ctx.confirm(call)) return err(call, 'User declined.');
      try   { return ok(call, cap(await ctx.execute(call.name, args.data, ctx.user))); }
      catch (e) { return err(call, actionable(e)); }
    }));

    messages.push({ role: 'user', content: results });
  }
  return { answer: await forceConclude(messages), reason: 'max_iterations' };
}
\`\`\`

Twenty-five lines. Every line that matters is a guard.

## The five stop conditions

**Success** — the model returns text instead of a tool call. Verify it against your output schema before treating it as done.

**Iteration cap** — the loop bound. 5–15 typically. Do not just return; call \`forceConclude\` so the model produces its best answer from what it has, clearly labelled as incomplete.

**Token budget** — an independent limit. Ten iterations that each read a large file can exceed budget long before the iteration cap.

**Wall-clock timeout** — a user waiting on an interactive path will not wait five minutes.

**Unrecoverable error** — an authentication failure or a permission denial is not something to retry. Fail fast and surface it.

{{callout:bad|Never ship a loop without all five. The failure without them is not a crash — it is an agent quietly spending your budget in a circle at 3am, which you discover on your invoice.}}

## Guards worth noting in that code

- \`ctx.allowed\` — a route-scoped allowlist. A tool absent here cannot be called even if the model names it.
- Schema validation **before** execution, with the validator's own errors returned to the model.
- \`ctx.confirm\` for destructive operations, enforced by the runtime rather than requested in the prompt.
- \`cap(...)\` on every tool result. One unbounded return fills the window.
- \`actionable(e)\` — errors rewritten as instructions the model can recover from.

## Parallel tool calls

Models can request several tools at once. Run independent calls concurrently — it is often the single largest latency win available. But: only reads. Parallel writes need the same ordering and conflict analysis as any concurrent system, and the model is not reasoning about your transaction boundaries.

## Progress and observability

Emit an event per iteration: which tools were called, how many tokens, elapsed time. Two uses. Users tolerate a slow agent far better when they can see it working — "reading AuthService.swift…" beats a spinner. And when something goes wrong the trajectory is your entire debugging surface.

## Deciding maxIterations honestly

Instrument first. Log the iteration count for successful runs, plot the distribution, and set the cap at roughly the 95th percentile plus a small margin. Setting it by intuition either truncates legitimate work or lets failures run long.
`,
    keyPoints: [
      'An agent is a bounded while-loop; the guards are the engineering.',
      'Five stop conditions: success, iteration cap, token budget, wall clock, unrecoverable error.',
      'On cap, force a labelled best-effort conclusion rather than returning nothing.',
      'Validate arguments and cap results before they enter context.',
      'Parallelise reads only; emit per-iteration progress events.'
    ],
    pitfalls: [
      { t: 'Only an iteration cap', d: 'Ten iterations reading large files blows the token budget first.' },
      { t: 'Silent termination at the cap', d: 'The user gets nothing after a long wait; force a partial answer.' },
      { t: 'Parallel writes', d: 'The model is not reasoning about your transaction boundaries.' }
    ],
    quiz: [{
      q: 'Your agent hits its 10-iteration cap on 15% of requests. Best response?',
      options: [
        { t: 'Raise the cap to 30.', ok: false, why: 'Without knowing why they run long, this multiplies cost on the failing tail and may just move the cliff.' },
        { t: 'Analyse the capped trajectories: if they loop, add loop detection; if they legitimately need depth, raise the cap for that route only.', ok: true, why: 'Correct. The trajectory tells you whether this is thrashing or genuine depth, and those need opposite fixes.' },
        { t: 'Remove the cap.', ok: false, why: 'Unbounded loops are an availability and cost incident waiting to happen.' }
      ]
    }],
    lab: {
      title: 'Instrument the loop',
      steps: [
        'Log iterations, tokens, wall time and stop reason for every agent run.',
        'Plot the distributions over a week of traffic.',
        'Set each cap at roughly p95 of successful runs.',
        'Review every run that hit a cap and classify it as loop, drift, or genuine depth.'
      ]
    },
    refs: [['Anthropic — Building effective agents', 'https://www.anthropic.com/engineering/building-effective-agents']]
  },

  {
    id: 'workflow-vs-agent',
    title: 'Workflows versus agents',
    mins: 11, level: 'core',
    summary: 'If you can draw the flowchart, write the flowchart. Agency is for when you genuinely cannot.',
    body: `
{{diagram:workflow-vs-agent}}

A **workflow** has a control flow you wrote. The model fills in steps; your code decides what happens next. A **agent** decides its own next step at runtime.

The industry default drifted toward agents because they demo well. In production, workflows win most of the time — they are testable, their cost is bounded, they fail in ways you can reproduce, and their latency is predictable.

## The decision test

Ask: **can I draw the flowchart?**

If yes — if the steps are known even when they branch — build the workflow. Branching does not require agency; a switch statement branches.

Reach for agency only when: the number of steps genuinely varies with the input, the *order* depends on intermediate findings, or the space of valid paths is too large to enumerate. Debugging, open-ended research, and exploratory code changes qualify. "Summarise this document then email it" does not.

## Composable workflow shapes

**Chain.** A → B → C, each output feeding the next. Extract, then classify, then route.

**Router.** Classify, then dispatch to a specialised handler. The highest-value pattern in most products: a cheap classifier in front of three good specialists beats one prompt trying to cover everything.

**Parallel + aggregate.** Run n independent calls and combine. Good for multi-aspect analysis and for self-consistency voting.

**Evaluator–optimizer.** Generate, critique, revise, with a bounded loop and a defined exit criterion. This is agentic in feel but fully bounded in structure.

**Orchestrator–worker.** A planner decomposes into sub-tasks, workers execute in isolated contexts, the orchestrator synthesises. The one genuinely agentic shape that stays controllable, because the planning step is explicit and inspectable.

## The honest comparison

| | Workflow | Agent |
|---|---|---|
| Cost | Predictable | Varies 5–20× |
| Latency | Predictable | Unbounded without caps |
| Testing | Standard unit tests | Trajectory evaluation |
| Debugging | Reproducible | Non-deterministic |
| Novel inputs | Fails at the edges | Adapts |
| Time to first demo | Slower | Faster |
| Time to production | Faster | Slower |

That last pair is the trap. Agents reach an impressive demo quickly and then absorb months in reliability work. Workflows take longer to specify and then behave.

{{callout:good|A practical migration path: ship the workflow. Log every case it handles badly. When a *category* of failure emerges that genuinely needs adaptive planning, add agency to that branch only. You end up with a mostly-deterministic system and a small agentic component where it earns its cost.}}

## Hybrid in practice

\`\`\`ts
const intent = await classify(message);          // deterministic route
switch (intent) {
  case 'order_status': return statusWorkflow(message);      // 1 call
  case 'refund':       return refundWorkflow(message);      // 2 calls + human gate
  case 'technical':    return diagnosticAgent(message, {    // agentic, bounded
                              maxIterations: 8 });
  default:             return escalateToHuman(message);
}
\`\`\`

Most traffic takes a cheap, predictable path. Only the genuinely open-ended branch pays agentic prices, and it does so with a budget.
`,
    keyPoints: [
      'If you can draw the flowchart, write the flowchart — branching is not agency.',
      'Router (classify then dispatch) is the highest-value workflow shape in most products.',
      'Agents demo faster and productionise slower.',
      'Start deterministic, add agency to specific branches once failures justify it.',
      'Orchestrator–worker is the agentic shape that stays inspectable.'
    ],
    pitfalls: [
      { t: 'Agency by default', d: 'Unbounded cost and non-reproducible bugs on tasks a switch statement handles.' },
      { t: 'Confusing branching with agency', d: 'Conditional logic is a workflow feature.' },
      { t: 'No fallback from the agent branch', d: 'When it fails, you need a defined path — usually escalation to a human.' }
    ],
    quiz: [{
      q: 'Expense reports: extract fields, validate against policy, route to an approver, notify. Occasionally an unusual receipt needs judgement. Architecture?',
      options: [
        { t: 'A single agent with tools for all four steps.', ok: false, why: 'Three of four steps are fully deterministic. You would pay agentic cost and unpredictability for work a chain handles perfectly.' },
        { t: 'A deterministic chain for the four steps, with an escalation branch to an agent or a human for receipts that fail validation.', ok: true, why: 'Correct. The known path is a workflow; the genuinely uncertain minority gets the expensive treatment. This is the standard production shape.' },
        { t: 'Four separate agents, one per step.', ok: false, why: 'Maximum cost and coordination complexity for steps with no need for runtime planning.' }
      ]
    }],
    lab: {
      title: 'Flowchart the feature',
      steps: [
        'Take an AI feature you built or plan to build and draw the flowchart on paper.',
        'If you finished the drawing, it is a workflow — implement it as one.',
        'If you got stuck at a box, that box is your agentic component. Scope agency to it alone.',
        'Write the fallback for when that box fails.'
      ]
    },
    refs: [['Anthropic — Building effective agents', 'https://www.anthropic.com/engineering/building-effective-agents']]
  },

  {
    id: 'mcp',
    title: 'MCP and standard tool interfaces',
    mins: 10, level: 'applied',
    summary: 'A protocol for exposing tools, resources and prompts so integrations compose instead of multiplying.',
    body: `
Without a standard, every application × every data source is a bespoke integration. The Model Context Protocol (MCP) is an open standard that turns that into servers on one side and clients on the other.

## The three primitives

**Tools** — functions the model may invoke. Named, schema'd, executed by the server. Model-controlled.

**Resources** — data the client may read: files, records, documents. Identified by URI. Application-controlled, meaning your app decides what to include rather than the model requesting it.

**Prompts** — reusable templates the server offers, typically surfaced as user-selectable commands.

The tools/resources distinction is the one people miss and it matters. Tools are *actions the model chooses*. Resources are *data your application supplies*. Modelling a read-only data source as a resource keeps it out of the model's decision surface, which reduces tool count and improves selection accuracy — a direct application of the tool-minimization lesson.

## Transports

- **stdio** — the server runs as a local subprocess. Simplest, no network exposure, ideal for local files, git, or a local database.
- **HTTP with Server-Sent Events** — remote servers, multiple clients, requires authentication and network hardening.

Prefer stdio for anything local. It removes an entire class of exposure.

## What it buys you

Write a server once and it works with any MCP-capable client. Swap the model or the host application without rewriting integrations. The ecosystem of existing servers — filesystem, git, databases, issue trackers — becomes available without building each yourself.

## The security surface, stated plainly

An MCP server is code executing on your machine with your credentials, exposing capabilities to a model that reads untrusted content. Treat installing one exactly as you would treat installing any dependency with filesystem and network access.

- **Read the source of any server you did not write.** A "read-only" server is read-only because its code says so.
- **Scope credentials to the minimum.** A database server gets a read-only role on the specific schema, not your admin connection string.
- **Prefer local stdio** over remote HTTP where possible.
- **Audit the tool list after installation.** Servers can expose more than their description implies.
- **Watch for tool shadowing.** Two servers exposing similarly-named tools creates ambiguity, and a malicious server can name its tool to attract calls intended for a trusted one.

{{callout:warn|An MCP server that reads untrusted content (web pages, email, shared documents) and also has write capabilities is the highest-risk configuration in this whole space. Split it: one server reads with no write tools, another writes and never touches untrusted input.}}

## When not to bother

If you have one application calling three internal APIs you control, direct tool definitions are simpler and one dependency lighter. MCP pays off when you have multiple clients, multiple sources, or want to use community servers. Adopt it for the interoperability, not because it is the newer thing.
`,
    keyPoints: [
      'MCP standardises tools (model-invoked), resources (app-supplied data) and prompts (templates).',
      'Model read-only data as resources to keep the tool surface small.',
      'Prefer stdio transport for local servers; HTTP+SSE needs real auth and hardening.',
      'An MCP server is a dependency with your credentials — read its source and scope its access.',
      'Never combine untrusted-content reading with write capability in one server.'
    ],
    pitfalls: [
      { t: 'Installing servers without review', d: 'Arbitrary code with your filesystem and network access.' },
      { t: 'Broad credentials', d: 'Give the narrowest role that works, per server.' },
      { t: 'Tool shadowing across servers', d: 'Ambiguous names cause misrouted calls; a hostile server can exploit this deliberately.' }
    ],
    quiz: [{
      q: 'You want an agent to read your Postgres database. Safest setup?',
      options: [
        { t: 'An MCP server with your application\'s connection string.', ok: false, why: 'That role can usually write and read every table. An injection reaching a query tool would have full access.' },
        { t: 'An MCP server over stdio using a read-only role scoped to the specific schema, with row limits enforced server-side.', ok: true, why: 'Correct. Least privilege at the database level, no network exposure, and bounded results. The capability itself is constrained, not just the instructions.' },
        { t: 'A remote HTTP MCP server so the team can share it.', ok: false, why: 'Adds authentication, transport security and exposure concerns without addressing the credential-scoping issue that actually matters.' }
      ]
    }],
    lab: {
      title: 'Audit your MCP surface',
      steps: [
        'List every MCP server configured in your environment.',
        'For each: what credentials does it hold, and what is the worst thing it could do?',
        'Print the full tool list from each and look for overlapping names.',
        'Downgrade every credential you can, and remove any server whose source you have not read.'
      ]
    },
    refs: [['Model Context Protocol', 'https://modelcontextprotocol.io'], ['Anthropic — MCP', 'https://docs.claude.com/en/docs/mcp']]
  },

  {
    id: 'multi-agent',
    title: 'Multi-agent systems: when they earn their cost',
    mins: 12, level: 'advanced',
    summary: 'Real benefits from context isolation and parallelism; real costs in tokens, latency and debuggability.',
    body: `
Multi-agent systems are frequently reached for too early. They have genuine uses — and a cost profile that surprises teams who adopt them for the wrong reason.

## The legitimate reasons

**Context isolation.** Covered in the context module: workers absorb exploratory tokens and return conclusions. This is the strongest reason and often the only one you need.

**Parallel wall-clock.** Four independent investigations at once instead of sequentially. Only helps if the sub-tasks are genuinely independent.

**Trust separation.** A worker with no dangerous tools processes attacker-controlled content and returns structured findings. The orchestrator, which holds the dangerous tools, never touches the raw untrusted input. This is a real security architecture, not just a performance one.

**Genuinely different configurations.** One step needs a large model with extended reasoning; another needs a fast cheap model with a different tool set. Separate agents make that natural.

## The costs, stated honestly

- **Tokens.** Typically several times a single-agent approach; published accounts of research-style multi-agent systems report roughly an order of magnitude over a single chat turn. Budget accordingly.
- **Latency.** Fan-out helps wall clock but each worker is still a full round trip, and you wait for the slowest.
- **Debuggability.** Non-deterministic behaviour across n interacting components. You need per-agent tracing from day one, not added later.
- **Error compounding.** Four workers at 90% reliability give roughly 66% end-to-end success if all four must succeed. Design for partial results.

{{callout:warn|Error compounding is the underestimated one. Every worker you add multiplies another sub-1.0 term into your success rate. Either make workers independently optional, or keep the count low.}}

## Topologies

**Orchestrator–worker.** A planner decomposes, workers execute in isolation, the orchestrator synthesises. The default and the most controllable.

**Pipeline.** Fixed sequence of specialised agents. Really a workflow with model-shaped stages; predictable and easy to test.

**Debate / critique.** Independent agents produce answers, a judge selects or synthesises. Genuinely improves quality on hard judgement calls, at n× cost. Reserve for high-stakes, low-volume decisions.

**Peer-to-peer.** Agents messaging each other freely. Almost never worth it — emergent, hard to bound, hard to debug. If you find yourself designing this, look for the orchestrator you are avoiding writing.

## Making it work

**Write worker prompts as if the worker knows nothing** — because it does. It cannot see the orchestrator's context. Every fact it needs must be in its task.

**Structured returns with a \`notFound\` field.** "Searched and found nothing" must be distinguishable from "did not search".

**Explicit fan-out limits.** \`maxWorkers\` enforced by the runtime. Never "as many as needed".

**Per-worker budgets.** Tokens and iterations, enforced, logged.

**A defined partial-result policy.** If two of four workers fail, does the orchestrator retry, proceed and label the output partial, or fail the task? Decide before you ship.

## Start with one

The strongest advice here: prove that a single well-engineered agent is insufficient before adding topology. Most tasks that appear to need multiple agents need better retrieval, tighter tool results, and compaction. Add agents when you have measured a specific problem that isolation solves.
`,
    keyPoints: [
      'The strongest reasons are context isolation and trust separation, not "more intelligence".',
      'Expect several times to an order of magnitude more tokens than single-agent.',
      'Error compounding: four 90%-reliable workers give roughly 66% joint success.',
      'Orchestrator–worker is the controllable default; peer-to-peer rarely justifies itself.',
      'Cap fan-out, budget each worker, and define the partial-result policy up front.'
    ],
    pitfalls: [
      { t: 'Multi-agent as the default architecture', d: 'Large cost multiplier to solve a problem better context engineering usually fixes.' },
      { t: 'Under-specified worker tasks', d: 'The worker cannot see what the orchestrator knows.' },
      { t: 'No partial-result policy', d: 'Silent under-reporting when a worker fails.' }
    ],
    quiz: [{
      q: 'A research feature must synthesise findings from 8 sources. Single agent with 8 fetch calls, or 8 workers?',
      options: [
        { t: 'Always 8 workers — parallelism is faster.', ok: false, why: 'Faster in wall clock, but several times the cost and eight chances to fail. Whether it is right depends on how much content each source produces.' },
        { t: 'Depends on content size: if each source is small, one agent fetching sequentially is cheaper and simpler; if each requires deep reading, workers isolate that cost.', ok: true, why: 'Correct. The deciding factor is the compression ratio — how many tokens a worker absorbs versus how many it returns. High ratio favours workers.' },
        { t: 'Always one agent — multi-agent is over-engineering.', ok: false, why: 'Too absolute. When each source needs thousands of tokens of reading to produce a paragraph, isolation is genuinely the right architecture.' }
      ]
    }],
    lab: {
      title: 'Compute the compression ratio',
      steps: [
        'For a task you are considering fanning out, estimate tokens each worker consumes and tokens it returns.',
        'Compute the ratio. Above roughly 10:1, isolation is likely worth it.',
        'Multiply worker count by per-worker cost and compare against the single-agent path.',
        'Compute joint success rate from per-worker reliability, and decide your partial-result policy from that number.'
      ]
    },
    refs: [['Anthropic — Multi-agent research system', 'https://www.anthropic.com/engineering/multi-agent-research-system']]
  },

  {
    id: 'error-recovery',
    title: 'Error handling and recovery',
    mins: 11, level: 'applied',
    summary: 'Agents encounter errors constantly. Whether they recover depends almost entirely on your error text.',
    body: `
In an agentic system errors are routine, not exceptional. Files are missing, arguments are malformed, APIs are down, permissions are denied. The difference between an agent that completes tasks and one that gives up is usually the quality of the error messages you write.

## Error text is a prompt

The model reads your error and decides what to do next. Write it as an instruction.

\`\`\`
✗ "Error: ENOENT"
✓ "File not found: src/AuthServce.swift. Did you mean src/AuthService.swift?
   Use listDir('src/') to see available files."

✗ "Invalid argument"
✓ "Invalid date_range.start: expected YYYY-MM-DD, got '15/01/26'.
   Retry with '2026-01-15'."

✗ "403"
✓ "Permission denied: deleteProject requires the owner role; you have editor.
   Ask the user to escalate, or use archiveProject instead."
\`\`\`

Each corrected version names the problem, the expected form, and a concrete next action. Typo suggestions from a fuzzy match against real filenames are especially high value — they turn a dead end into a one-turn recovery.

## Classify by recoverability

| Class | Examples | Handling |
|---|---|---|
| **Recoverable by the model** | bad args, wrong path, malformed query | Return actionable error, let it retry |
| **Recoverable by the system** | rate limit, timeout, 503 | Retry with backoff in your code, do not surface |
| **Requires the user** | permission denied, ambiguous intent, missing credential | Surface clearly and stop |
| **Fatal** | auth invalid, quota exhausted, tool misconfigured | Fail fast, alert, do not retry |

The second row matters: transient infrastructure failures should never reach the model. Retrying a 503 with exponential backoff is your runtime's job. Putting "the API returned 503" into context wastes an iteration and invites the model to invent a workaround.

## Bound the retries

**System retries:** 3 attempts, exponential backoff with jitter, only on idempotent operations, only on transient status codes.

**Model retries:** at most 2 attempts at the same tool call. If it fails the same way twice, the model is not going to solve it — inject explicit guidance:

> \`searchOrders\` has failed twice with the same argument error. Do not retry it. Either ask the user for clarification, or proceed using the information you already have.

{{callout:bad|The pathological loop: the model calls a tool, gets an unhelpful error, tries a slight variation, fails again, and repeats until the iteration cap. Every cycle costs a full model call. Detect same-tool-same-error repetition and break it explicitly.}}

## Degrade rather than fail

Rank your fallbacks and take the best available:

1. Full answer with fresh retrieval.
2. Answer from cache, labelled with its age.
3. Partial answer plus an explicit statement of what is missing.
4. A clear failure with a path forward — a support link, a retry button, an escalation.

Level 4 is still a designed outcome. An unhandled exception surfaced as a stack trace is not.

## Make failure visible in the product

If the agent could not complete the task, say so plainly: what it accomplished, what it could not, and why. Users forgive a system that fails honestly and lose trust in one that quietly returns something incomplete as though it were finished.

## Log for improvement

Record every tool error with the tool name, the arguments, the error class and whether the agent recovered. Sort by frequency. The top three are nearly always fixable with a better description, a tighter schema, or a better error message — and fixing them raises task completion rates more than most model or prompt changes.
`,
    keyPoints: [
      'Error messages are prompts — name the problem, the expected form, and the next action.',
      'Handle transient infrastructure errors in your runtime; never surface them to the model.',
      'Cap model retries at two identical attempts, then inject explicit guidance.',
      'Design a ranked degradation path ending in an honest, actionable failure.',
      'Log tool errors by frequency; the top three are usually cheap fixes with large impact.'
    ],
    pitfalls: [
      { t: 'Passing raw exception text through', d: 'Stack traces waste context and give the model nothing to act on.' },
      { t: 'Surfacing transient errors to the model', d: 'Wastes iterations and invites invented workarounds.' },
      { t: 'Silent partial success', d: 'The most trust-damaging outcome. Always state what was not done.' }
    ],
    quiz: [{
      q: 'Your agent calls readFile with a slightly misspelled path and gives up. Best fix?',
      options: [
        { t: 'Instruct the model to double-check paths before calling.', ok: false, why: 'Advisory, and it does not help once the mistake is made. The recovery path is where the value is.' },
        { t: 'Return "File not found: X. Did you mean Y?" using a fuzzy match against real filenames, plus a listDir suggestion.', ok: true, why: 'Correct. This converts a dead end into a one-turn recovery. Suggestion-bearing errors are among the highest-leverage changes in agent engineering.' },
        { t: 'Auto-correct to the nearest match and proceed.', ok: false, why: 'Tempting but dangerous — silently operating on a different file than requested is a correctness and safety hazard. Suggest, do not substitute.' }
      ]
    }],
    lab: {
      title: 'Rewrite your top errors',
      steps: [
        'Log every tool error for a week with tool name, args, and whether the agent recovered.',
        'Sort by frequency and take the top five.',
        'Rewrite each message to name the problem, the expected form, and a concrete next action.',
        'Add fuzzy-match suggestions for any not-found error, then measure the change in recovery rate.'
      ]
    },
    refs: [['Anthropic — Tool use', 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview']]
  },

  {
    id: 'human-in-loop',
    title: 'Human-in-the-loop design',
    mins: 11, level: 'applied',
    summary: 'Decide what needs approval by consequence and reversibility — then make the approval genuinely informed.',
    body: `
Approval gates are the primary control on agent risk. Placed well, they cost almost nothing and prevent the failures that matter. Placed badly, they train users to click through everything, which is worse than having none.

## Classify by consequence and reversibility

| | Reversible | Irreversible |
|---|---|---|
| **Low impact** | Auto-execute | Auto-execute, notify |
| **High impact** | Auto-execute, offer undo | **Require approval** |

Only one cell needs a gate. Reading a file: auto. Drafting an email: auto. Sending it: irreversible and high impact — gate it. Deleting a production table: gate it, twice.

**Undo beats approval where it is available.** A reversible action with a visible one-click undo gives users control without interrupting flow. Prefer building undo over adding a dialog.

## The dialog must be informed

An approval prompt that does not let the user actually evaluate the action is a rubber stamp with extra latency.

\`\`\`
✗  "The assistant wants to run a tool. Allow?"

✓  Send email
   To:      customer@example.com
   Subject: Re: Refund request #4417
   ─────────────────────────────────────
   Hi Sam, I've processed your refund of $89.00...
   ─────────────────────────────────────
   Sending is not reversible.
   [Send]  [Edit first]  [Cancel]
\`\`\`

Show the exact action, the exact arguments, the consequence, and offer an edit path. Editing is important: users frequently want 90% of what the agent proposed.

{{callout:warn|Approval fatigue is a real failure mode. If users approve twelve times in a session they stop reading by the fourth. Fewer, better-placed gates on genuinely consequential actions beat blanket confirmation — and blanket confirmation actively degrades safety by training the click-through reflex.}}

## Batch where it fits

For bulk operations, one approval for a reviewable plan beats fifty individual dialogs:

> The assistant will update 47 records. Preview the diff for all 47, or approve individually?

Show a summary, a full preview on demand, and a spot-check sample. Approving a reviewed plan is a real decision; approving 47 identical dialogs is not.

## Progressive autonomy

Trust can be earned within a session or over time:

- **First use** — approve everything consequential.
- **After a pattern of approvals** — offer "always allow this action for this project".
- **Scoped grants** — "allow file edits inside \`src/\`" rather than "allow all edits".
- **Session-limited** — auto-approve for this task, reset afterwards.

Always provide a visible way to revoke, and always log auto-approved actions somewhere reviewable.

## Design the interruption point

Where the gate sits changes its usefulness. Interrupting *before* a long agent run to confirm the plan is cheap and valuable. Interrupting *after* twelve steps to confirm the final write is also fine. Interrupting *at step four of twelve* is the worst option — the user lacks context to judge and has already invested waiting.

Prefer: confirm the plan up front, run autonomously, gate the final irreversible action.

## Make the audit trail complete

Every gated action logs: what was proposed, the full arguments, who approved, when, and the result. For anything financial, destructive, or affecting other people, this is not optional — it is what lets you answer "how did this happen?" three weeks later.
`,
    keyPoints: [
      'Gate only high-impact irreversible actions; prefer undo where the action is reversible.',
      'Show exact arguments and consequences, and offer an edit path.',
      'Approval fatigue makes blanket confirmation worse than targeted gating.',
      'Batch bulk operations into one reviewable plan approval.',
      'Confirm the plan up front and gate the final write — never mid-run.'
    ],
    pitfalls: [
      { t: 'Generic "allow this tool?" dialogs', d: 'The user cannot evaluate the action, so it becomes a reflex click.' },
      { t: 'Too many gates', d: 'Trains click-through and degrades the safety of the gates that matter.' },
      { t: 'No audit trail', d: 'You cannot reconstruct what happened or who authorised it.' }
    ],
    quiz: [{
      q: 'Your coding agent modifies files. Where does the approval gate go?',
      options: [
        { t: 'Before every file read and write.', ok: false, why: 'Reads are harmless and frequent; gating them creates fatigue that erodes attention on the writes that matter.' },
        { t: 'Show the full diff before writing, with per-file approve/reject, and rely on version control for undo.', ok: true, why: 'Correct. The diff is the informed-consent surface, per-file granularity allows partial acceptance, and VCS provides real reversibility.' },
        { t: 'No gate — let it write and review afterwards.', ok: false, why: 'Acceptable only in a sandboxed or throwaway environment. In a real repository, review before write is the low-cost control.' }
      ]
    }],
    lab: {
      title: 'Map your gates',
      steps: [
        'List every action your agent can take.',
        'Place each in the impact × reversibility grid.',
        'Gate only the high-impact irreversible cell; for the rest, build undo or notification.',
        'For each gate, write the dialog copy showing exact arguments and consequence — then count how many gates a typical session hits.'
      ]
    },
    refs: [['Anthropic — Building effective agents', 'https://www.anthropic.com/engineering/building-effective-agents']]
  }
]}
];
