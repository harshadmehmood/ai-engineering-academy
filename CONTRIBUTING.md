# Contributing

Thanks for considering it. This project is a **single static site with no build step and no dependencies** — that constraint is deliberate, and it is the one rule that shapes everything else.

## The one rule

`index.html` must keep working when opened directly from disk, with no server, no bundler, and no network access. That means:

- No npm packages in the shipped site. No CDN links, no web fonts, no remote images.
- No frameworks. Plain ES5-compatible JavaScript in `js/`, plain CSS in `styles.css`.
- Node is used **only** for the dev scripts in `scripts/`.

If a change would break "double-click index.html and it works", it will not be merged — but there is almost always another way to get the same result, so open an issue and let's find it.

## Getting set up

```bash
git clone https://github.com/harshadmehmood/ai-engineering-academy.git
cd ai-engineering-academy
open index.html          # macOS   (or: xdg-open / just drag it into a browser)
```

That's the whole setup. Before opening a PR:

```bash
node scripts/validate.js   # content structure — fast, no dependencies
./scripts/smoke.sh         # renders all 84 routes in headless Chrome
```

Both run automatically on every pull request.

## What's most welcome

| | |
|---|---|
| **New case studies** | The highest-value contribution. A real application shape not already covered — agentic browser automation, recommendation systems, on-device inference, evaluation platforms, fine-tuning pipelines. |
| **Corrections** | If something is wrong, say so and cite a source. Accuracy matters more than volume here. |
| **New labs** | An interactive simulation that makes a trade-off visible rather than describing it. |
| **Failure modes** | Real production failures you have hit, with the mitigation that actually worked. |
| **Accessibility & i18n** | Keyboard navigation, screen-reader labels, translations. |

## Adding a case study

Append one object to `window.CASES_B` in `js/data-cases-b.js`. Nothing else needs touching — navigation, search, filters and prev/next pick it up automatically.

```js
{
  id: 'kebab-case-id',
  num: '15',
  title: 'Human-Readable Title',
  platform: 'Web · Node/TS + Postgres',
  tags: ['agentic', 'cost'],
  brief: 'One paragraph. What the product is, and what makes it interesting as an engineering problem.',

  spec:     [['User goal', '…'], ['Cost of wrong', '…'], ['Verifier', '…']],
  pipeline: ['Input', 'Retrieve', 'Model', 'Validate', 'Act'],
  trace:    [{ t: 'Step name', d: 'What happens and why', code: 'optional()' }],
  context:  [{ name: 'System prompt', tokens: 1400, note: 'Why this is here', color: 'acc' }],
  tools:    [{ sig: 'getThing(id: UUID) → Thing', kind: 'read', note: 'Why it is shaped this way' }],
  failures: [{ t: 'Failure name', d: 'How it manifests', mit: 'The mitigation' }],
  cost:     { lines: [['Input per request', '~6,000 tokens']], notes: ['A non-obvious economic point'] },
  evals:    [['Metric', '> 90%', 'How it is measured']],
  decisions:[{ q: 'A real design question', options: [
               { t: 'Plausible but wrong', ok: false, why: 'Why it is tempting and why it fails' },
               { t: 'Correct', ok: true,  why: 'The reasoning' } ] }],
  sim:      { type: 'cost', cfg: { /* see below */ } },
  sims:     [{ label: 'Scenario', out: 'Pre-formatted terminal-style output' }],
  notes:    '### A heading\n\nMarkdown lesson notes.'
}
```

**Field notes**

- `context[].color` — one of `acc`, `acc2`, `good`, `warn`, `bad`, `ink3`.
- `tools[].kind` — `read` (green), `write` (red), `gated` (amber, requires a decision your code enforces).
- `sim.type` — one of the twelve simulators already implemented in `js/cases.js`: `budget`, `topk`, `cost`, `latency`, `escalation`, `quota`, `precision`, `acl`, `injection`, `threshold`, `refine`, `multiagent`. Reuse one where you can; add a new one only if none fits.
- `sims[].out` — pre-formatted text rendered in a monospace block. Keep lines under ~70 characters so it reads on mobile.

## Adding a lesson

Append to a module's `lessons` array in any `js/data-curriculum-*.js`.

```js
{
  id: 'kebab-case-id',
  title: 'Lesson title',
  mins: 12,
  level: 'core',            // core | applied | advanced
  summary: 'One sentence, under 200 characters.',
  body: `…markdown…`,
  keyPoints: ['…'],
  pitfalls: [{ t: 'Name', d: 'Description' }],
  quiz: [{ q: '…', options: [{ t: '…', ok: false, why: '…' }] }],
  lab: { title: '…', steps: ['…'] },
  refs: [['Source title', 'https://…']]
}
```

Bodies use a markdown subset rendered by `APP.md()` in `js/app.js`: `##`/`###`, `**bold**`, `` `code` ``, fenced blocks, `-` and `1.` lists, `>` quotes, `|` tables, plus two custom tokens that must sit alone on their own line:

```
{{diagram:rag-pipeline}}
{{callout:warn|Text of the callout.}}
```

Diagram keys come from `DIAGRAMS.keys()` in `js/diagrams.js`. Callout types are `` (info), `good`, `warn`, `bad`.

## Adding a lab

Push an object onto `window.LABS` in `js/labs.js`:

```js
LABS.push({
  id: 'my-lab', name: 'Short tab label',
  title: 'Full title',
  desc: 'What trade-off this makes visible.',
  html: function () { return '…markup…'; },
  init: function () { /* wire up events, render initial state */ }
});
```

`init()` runs every time the tab is opened, so it must be safe to call repeatedly and must not accumulate listeners on elements outside its own markup.

## Adding a diagram

Add a generator to the `D` map in `js/diagrams.js` and a caption to `CAPTIONS`. Use the primitives (`box`, `arrow`, `curveArrow`, `text`, `band`, `chain`) and CSS custom properties (`var(--acc)`, `var(--ink2)`, …) rather than hard-coded colours, so the diagram works in both themes. The validator checks that every diagram renders and has a caption.

## Writing style

The prose in this project has a specific voice. Matching it matters more than you might expect, because a course that reads inconsistently feels unreliable.

- **Be concrete.** "Retrieve 100, rerank, send 5" beats "use an appropriate number of documents".
- **State the trade-off.** Every technique costs something. Say what.
- **Name the failure you inherit.** Every pattern introduces a new way to be wrong.
- **No hype.** No "revolutionary", no "game-changing", no exclamation marks.
- **Wrong answers must be tempting.** In a quiz, the incorrect options should be things a competent engineer would genuinely consider, and the `why` should explain what makes them attractive before explaining why they fail.
- **Cite sources for factual claims**, and prefer primary sources over blog summaries.
- British or American spelling are both fine; be consistent within a file.

## Accuracy

If you state a number, a benchmark result, or a provider behaviour, cite it. Where a figure is illustrative rather than measured — as the cost models in this project are — label it as such. It is better to say "typically an order of magnitude" than to invent a precise-looking figure.

## Pull requests

- One logical change per PR. A new case study is one PR; three unrelated typo fixes are one PR.
- Run both scripts before pushing.
- Describe what you changed and why. If it is a correction, link the source.
- New content should include its own quiz or decision questions — the graded questions are a core part of how this course works, not an optional extra.

## Reporting problems

Open an issue. For content errors please include the lesson or case id and, where you can, a source that supports the correction.

## Licence

By contributing you agree that your contribution is licensed under the [MIT Licence](LICENSE).
