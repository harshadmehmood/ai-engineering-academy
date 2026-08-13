# Offline Course Library

A companion reader for course repos you clone yourself. The academy is the course
I wrote; this reads everyone else's, in one navigation tree, with no internet.

It ships **no course content** — you clone the courses, it indexes them.

## Use it

```bash
cd tools
./setup.sh      # clones the three courses, builds the index (~230 MB)
./start.sh      # serves on localhost:8777 and opens the reader
```

`setup.sh` is idempotent — re-run it any time, or `./setup.sh --update` to pull each
course first. `start.sh` rebuilds the index when course files change. Ctrl-C stops
it; `./start.sh 9000` uses a different port.

With those three cloned you get roughly **280 files, 170 written lessons, 81
notebooks and 350,000 words** — searchable, cross-linked and fully offline.

## The study path

The library opens on a **companion study path**: seven stages, one per academy
module, each mapping to specific external lessons and notebooks with a line on why
that item is there. It turns a pile of cloned repos into an ordered module.

| Stage | Academy module | External coverage |
|---|---|---|
| 1 | Foundations | Good — LLM framing, tokens, API parameters, embeddings |
| 2 | Prompting as Engineering | **Strongest.** Runnable, graded prompt exercises |
| 3 | Context Engineering | **Thin.** One direct lesson; the academy carries this |
| 4 | Retrieval & Knowledge | Strong — full pipeline, hybrid search, reranking |
| 5 | Tools & Agents | Strong — tool schemas from API and framework angles |
| 6 | Evaluation & Observability | **Highest value.** Do this one properly |
| 7 | Production System Design | Moderate — metrics, feedback, dashboards |

Stages 3 and 6 are flagged in the UI for opposite reasons: stage 3 because external
material barely covers it, stage 6 because it is the gap most working engineers
actually have.

Progress is per item and shared with the rest of the reader, so marking a lesson
read anywhere advances the path. Mapped paths are validated against the built index
at load time — if a course restructures and a file moves, the path says so rather
than quietly dropping it.

Edit `curriculum.js` to change the mapping.

## Fully offline, no server

`build-index.js` also writes `library-content.js` — every indexed file's text as
JavaScript. A `file://` page cannot `fetch` a sibling file but it can load a
script, so with the bundle present the reader works straight from disk:

```
open "<your courses folder>/library/index.html"
```

Notebook `attachments`, base64 images and rendered HTML are stripped. They are the
difference between **3 MB and 63 MB**, and the reader truncates long output anyway.
Open the `.ipynb` directly if you need a chart.

Put the academy beside your courses and the two link to each other from disk too:

```bash
ln -s /path/to/repo "<your courses folder>/academy"
open "<your courses folder>/academy/index.html"
```

The academy detects a built library with a `<script>` probe — the only detection
that works from `file://` — and shows an **Open the library** button when it finds one.

`start.sh` is still there and still useful: it serves both on one origin, and
reads files live so edits show up without a rebuild.

## Why the server is still an option

Browsers block a page opened from `file://` from reading other local files, so the
reader could not load a single lesson that way. `start.sh` runs
`python3 -m http.server` bound to `127.0.0.1`. Nothing is exposed off the machine
and no request leaves it.

It also keeps licences clean. `library-index.js` — generated on your machine,
gitignored — holds only titles, paths, headings, word counts and an
offline-readiness classification. The reader fetches each file from its own repo at
view time, so `git pull` in a course folder updates the library and no third-party
text is ever copied into this tool.

## Offline readiness

Every notebook is classified by what it needs beyond the files on disk:

| Badge | Meaning |
|---|---|
| `runs offline` | No external dependency. Works on a plane. |
| `Local service` | Needs Docker — Elasticsearch, Postgres, Qdrant, Grafana. |
| `Model download` | Pulls a model on first run. Do it while connected. |
| `Cloud API key` | Needs OpenAI or Anthropic. Read-only offline. |
| `N of M code cells have stored output` | How much you can read without running anything. |

Written lessons are always readable — they are plain text on disk.

### Getting notebooks to actually run offline

1. **Read the stored outputs.** Many notebooks ship with results saved; the badge
   tells you how many cells have them.
2. **Pre-pull dependencies** before travelling — `pip install sentence-transformers`
   then run one embedding cell, and `docker compose up -d` in any module that needs
   a service.
3. **Run a local model.** Install [Ollama](https://ollama.com) and pull a small one.
   Most `openai`-based cells work against its OpenAI-compatible endpoint by changing
   the base URL. This is the only way to execute the API-dependent notebooks with no
   connection.

## Adding a course

Clone it into `tools/`, add a row to `COURSES` in `build-index.js`, re-run
`node build-index.js`.

```js
{
  id: 'their-course',                 // must match the folder name
  name: 'Their Course',
  org: 'Someone',
  licence: 'MIT',                     // check it, and show it honestly
  url: 'https://github.com/someone/their-course',
  blurb: 'One sentence on what it covers.',
  skip: ['.github', 'assets'],        // folder names to ignore
  skipPath: /\/(?!en\/)[a-z]{2}\//,   // optional: regex on the relative path
  sectionAt: 2,                       // optional: which segment names the section
}
```

`skipPath` exists because some repos ship a translation of every page — the Hugging
Face course has fifteen, which would triple the index with duplicates. `sectionAt`
exists because some nest units below a generic folder (`units/en/unit1/...`), where
segment `0` is uselessly always `units`.

## Keys

<kbd>/</kbd> or <kbd>⌘K</kbd> search · <kbd>j</kbd> / <kbd>k</kbd> next and previous · <kbd>esc</kbd> close

Read state lives in the browser's `localStorage`. Nothing is uploaded.

## Files

```
tools/
  setup.sh              clone the three courses, build the index
  start.sh              build if stale, serve on localhost, open
  build-index.js        scanner → library-index.js (gitignored)
  curriculum.js         the study path: academy module → external items
  library/              the reader — index.html, styles.css, app.js
  <course-repo>/        your clones, never modified
```

### Running it from somewhere else

The tool resolves its root from `LIBRARY_ROOT`, falling back to the current
directory — not from `__dirname`, which Node resolves through symlinks. So you can
symlink `setup.sh`, `start.sh`, `build-index.js`, `curriculum.js` and `library/`
into any folder, keep your course clones there, and still have one canonical copy
of the tool:

```bash
ln -s /path/to/repo/tools/library      ~/courses/library
ln -s /path/to/repo/tools/start.sh     ~/courses/start.sh
# …and the rest
cd ~/courses && ./start.sh
```

The generated index is written beside the courses, never into the repo.

## Licence

The tool is MIT, same as the rest of this repository. **The courses you clone are
not** — check each one before reusing its material. The reader displays each
course's licence on its card and on its course page, because it varies: Apache 2.0,
CC BY-NC, and at least one with nothing stated at all.
