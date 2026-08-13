# Offline Course Library

A companion reader for course repos you clone yourself. The academy is the course
I wrote; this reads everyone else's, in one navigation tree, with no internet.

It ships **no course content** — you clone the courses, it indexes them.

## Use it

```bash
cd tools

# clone whichever courses you want (these three are a good start)
git clone --depth 1 https://github.com/DataTalksClub/llm-zoomcamp.git
git clone --depth 1 https://github.com/huggingface/agents-course.git
git clone --depth 1 https://github.com/anthropics/courses.git anthropic-courses

./start.sh
```

`start.sh` builds the index, serves this folder on `localhost:8777`, and opens the
reader. Ctrl-C stops it. Use a different port with `./start.sh 9000`.

With those three cloned you get roughly **280 files, 170 written lessons, 81
notebooks and 350,000 words** — searchable, cross-linked and fully offline.

## Why a local server

Browsers block a page opened from `file://` from reading other local files, so the
reader could not load a single lesson that way. `start.sh` runs
`python3 -m http.server` bound to `127.0.0.1`. Nothing is exposed off the machine
and no request leaves it.

It also keeps licences clean. `library/index-data.js` — generated on your machine,
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
  start.sh              build index, serve, open
  build-index.js        scanner → library/index-data.js (gitignored)
  library/              the reader — index.html, styles.css, app.js
  <course-repo>/        your clones, never modified
```

## Licence

The tool is MIT, same as the rest of this repository. **The courses you clone are
not** — check each one before reusing its material. The reader displays each
course's licence on its card and on its course page, because it varies: Apache 2.0,
CC BY-NC, and at least one with nothing stated at all.
