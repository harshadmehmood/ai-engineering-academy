#!/usr/bin/env node
/* ============================================================
   build-index.js — scans the course repos in this folder and
   generates library/index-data.js

   Only STRUCTURE and METADATA are written into the index:
   titles, headings, paths, word counts, and an offline-readiness
   classification. Lesson text is never copied — the reader
   fetches each file from disk at view time, so the courses keep
   their own licences and stay in sync with `git pull`.

     node build-index.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'library', 'index-data.js');

/* ---- courses to scan. Add a row to index another repo. ---- */
const COURSES = [
  {
    id: 'llm-zoomcamp',
    name: 'LLM Zoomcamp',
    org: 'DataTalks.Club',
    licence: 'No licence file — public course material, personal use',
    url: 'https://github.com/DataTalksClub/llm-zoomcamp',
    blurb: 'Ten-week production RAG course: agentic RAG, vector search, orchestration, evaluation, monitoring, hybrid search and reranking.',
    skip: ['cohorts', 'images', 'etc', '.github'],
  },
  {
    id: 'agents-course',
    name: 'AI Agents Course',
    org: 'Hugging Face',
    licence: 'Apache 2.0',
    url: 'https://github.com/huggingface/agents-course',
    blurb: 'Written course on agent fundamentals, then smolagents, LangGraph and LlamaIndex, with a benchmarked final assignment.',
    skip: ['translation_agreements', 'scripts', '.github', 'quiz'],
    // the repo ships ~15 translations of every page; index English only
    skipPath: /\/units\/(?!en\/)[a-z]{2}(-[A-Za-z]+)?\//,
    // paths look like units/en/unit1/... — segment 2 is the real section
    sectionAt: 2,
  },
  {
    id: 'anthropic-courses',
    name: 'Anthropic Courses',
    org: 'Anthropic',
    licence: 'CC BY-NC 4.0',
    url: 'https://github.com/anthropics/courses',
    blurb: 'Runnable notebooks: API fundamentals, prompt engineering, real-world prompting, prompt evaluations and tool use.',
    skip: ['.github'],
  },
];

/* ---- offline-readiness classification ---- */
const SIGNALS = [
  { key: 'api',     label: 'Cloud API',      re: /\b(openai|anthropic|OPENAI_API_KEY|ANTHROPIC_API_KEY|ChatCompletion|messages\.create)\b/i },
  { key: 'service', label: 'Local service',  re: /\b(elasticsearch|Elasticsearch|qdrant|QdrantClient|docker|postgres|psycopg|grafana|kestra)\b/ },
  { key: 'model',   label: 'Model download', re: /\b(SentenceTransformer|huggingface_hub|from_pretrained|AutoTokenizer|AutoModel)\b/ },
  { key: 'ollama',  label: 'Ollama (local LLM)', re: /\bollama\b/i },
  { key: 'net',     label: 'Downloads data', re: /(requests\.get|urlopen|wget |curl )\s*\(?["']https?:\/\// },
];

function walk(dir, skip, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (skip.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, skip, out);
    else if (/\.(md|mdx|ipynb|py)$/i.test(e.name)) out.push(p);
  }
  return out;
}

function readNotebook(p) {
  try {
    const nb = JSON.parse(fs.readFileSync(p, 'utf8'));
    const cells = nb.cells || [];
    const src = cells.map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source || '')).join('\n');
    const md = cells.filter((c) => c.cell_type === 'markdown');
    const code = cells.filter((c) => c.cell_type === 'code');
    const withOutputs = code.filter((c) => (c.outputs || []).length > 0).length;
    const hasOutputs = withOutputs > 0;
    // first markdown heading is the best title we have
    let title = null;
    for (const c of md) {
      const t = (Array.isArray(c.source) ? c.source.join('') : c.source || '').match(/^#{1,3}\s+(.+)$/m);
      if (t) { title = t[1].trim(); break; }
    }
    return { src, cells: cells.length, code: code.length, hasOutputs, withOutputs, title };
  } catch {
    return { src: '', cells: 0, code: 0, hasOutputs: false, withOutputs: 0, title: null };
  }
}

function headings(text) {
  return (text.match(/^#{1,3}\s+.+$/gm) || [])
    .map((h) => h.replace(/^#+\s+/, '').trim())
    .filter((h) => h.length < 120)
    .slice(0, 24);
}

function titleCase(s) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const courses = [];
let totals = { files: 0, words: 0, notebooks: 0, lessons: 0 };

for (const c of COURSES) {
  const base = path.join(ROOT, c.id);
  if (!fs.existsSync(base)) {
    console.log(`  skip ${c.id} — not cloned`);
    continue;
  }
  let files = walk(base, c.skip);
  if (c.skipPath) files = files.filter((f) => !c.skipPath.test('/' + path.relative(base, f).split(path.sep).join('/') + '/'));
  const sections = new Map();

  for (const abs of files) {
    const rel = path.relative(base, abs);
    const parts = rel.split(path.sep);
    // Some repos nest units below a generic folder (units/en/unit1/...).
    // sectionAt picks which path segment names the section.
    const at = c.sectionAt || 0;
    const sectionKey = parts.length > at + 1 ? parts[at]
      : (parts.length > 1 ? parts[0] : '_root');
    const ext = path.extname(abs).toLowerCase();
    const raw = fs.readFileSync(abs, 'utf8');

    let entry;
    if (ext === '.ipynb') {
      const nb = readNotebook(abs);
      const needs = SIGNALS.filter((s) => s.re.test(nb.src)).map((s) => s.key);
      entry = {
        type: 'notebook',
        title: nb.title || titleCase(path.basename(abs, ext)),
        path: `${c.id}/${rel.split(path.sep).join('/')}`,
        words: nb.src.split(/\s+/).filter(Boolean).length,
        cells: nb.cells,
        codeCells: nb.code,
        cached: nb.hasOutputs,
        cachedCells: nb.withOutputs,
        needs,
        offline: needs.filter((n) => n === 'api' || n === 'net').length === 0,
        headings: headings(nb.src),
      };
      totals.notebooks++;
    } else if (ext === '.md' || ext === '.mdx') {
      const h1 = raw.match(/^#\s+(.+)$/m);
      const words = raw.split(/\s+/).filter(Boolean).length;
      if (words < 25) continue; // skip stubs
      entry = {
        type: 'lesson',
        title: (h1 ? h1[1] : titleCase(path.basename(abs, ext))).trim(),
        path: `${c.id}/${rel.split(path.sep).join('/')}`,
        words,
        video: /youtube\.com|youtu\.be/.test(raw),
        offline: true,
        needs: [],
        headings: headings(raw),
      };
      totals.lessons++;
    } else {
      const needs = SIGNALS.filter((s) => s.re.test(raw)).map((s) => s.key);
      entry = {
        type: 'script',
        title: path.basename(abs),
        path: `${c.id}/${rel.split(path.sep).join('/')}`,
        words: raw.split(/\s+/).filter(Boolean).length,
        needs,
        offline: !needs.includes('api') && !needs.includes('net'),
        headings: [],
      };
    }

    totals.files++;
    totals.words += entry.words;
    if (!sections.has(sectionKey)) sections.set(sectionKey, []);
    sections.get(sectionKey).push(entry);
  }

  const sectionList = [...sections.entries()]
    .map(([key, items]) => ({
      key,
      name: key === '_root' ? 'Overview' : titleCase(key.replace(/^\d+[-_]/, '')),
      order: /^\d+/.test(key) ? parseInt(key, 10) : 999,
      items: items.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true })),
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  courses.push({
    id: c.id, name: c.name, org: c.org, licence: c.licence, url: c.url, blurb: c.blurb,
    sections: sectionList,
    counts: {
      sections: sectionList.length,
      items: sectionList.reduce((n, s) => n + s.items.length, 0),
      words: sectionList.reduce((n, s) => n + s.items.reduce((m, i) => m + i.words, 0), 0),
    },
  });
  console.log(`  ✓ ${c.name.padEnd(20)} ${sectionList.length} sections, ` +
    `${sectionList.reduce((n, s) => n + s.items.length, 0)} items`);
}

/* ---- cached datasets ---- */
const cacheDir = path.join(ROOT, '_offline-cache');
const cache = fs.existsSync(cacheDir)
  ? fs.readdirSync(cacheDir).filter((f) => !f.startsWith('.')).map((f) => ({
      name: f,
      size: fs.statSync(path.join(cacheDir, f)).size,
    }))
  : [];

const payload = {
  generated: new Date().toISOString().slice(0, 16).replace('T', ' '),
  courses,
  cache,
  totals,
};

fs.mkdirSync(path.join(ROOT, 'library'), { recursive: true });
fs.writeFileSync(OUT, 'window.LIBRARY = ' + JSON.stringify(payload, null, 1) + ';\n');

console.log('');
console.log(`  ${totals.files} files · ${totals.lessons} lessons · ${totals.notebooks} notebooks`);
console.log(`  ${totals.words.toLocaleString()} words indexed`);
console.log(`  ${cache.length} cached datasets`);
console.log(`  → library/index-data.js (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
