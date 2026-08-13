#!/usr/bin/env node
/* ============================================================
   validate.js — structural checks for the course content.
   Zero dependencies. Runs in CI on every pull request.

     node scripts/validate.js

   Catches the mistakes that are easy to make when adding a
   lesson or a case study: a missing field, a diagram key that
   does not exist, a quiz with no correct answer, a simulator
   type that is not implemented.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* ---- load the data files in a browser-ish global ---- */
global.window = global;
[
  'diagrams', 'data-curriculum-a', 'data-curriculum-b', 'data-curriculum-c',
  'data-patterns', 'data-cases-a', 'data-cases-b', 'data-reference',
  'labs', 'cases',
].forEach((f) => require(path.join(ROOT, 'js', f + '.js')));

const MODULES = [].concat(window.CURRICULUM_A, window.CURRICULUM_B, window.CURRICULUM_C);
const LESSONS = MODULES.flatMap((m) => m.lessons);
const CASE_LIST = [].concat(window.CASES_A, window.CASES_B);
const DIAGRAM_KEYS = new Set(window.DIAGRAMS.keys());

/* simulator types actually implemented in cases.js */
const casesSrc = fs.readFileSync(path.join(ROOT, 'js', 'cases.js'), 'utf8');
const SIM_TYPES = new Set(
  (casesSrc.match(/^\s{4}([a-z]+): \{$/gm) || []).map((s) => s.trim().replace(':', '').replace('{', '').trim())
);

/* ---- helpers ---- */
function requireFields(obj, fields, label) {
  fields.forEach((f) => {
    const v = obj[f];
    const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
    if (empty) fail(`${label}: missing or empty field "${f}"`);
  });
}
function oneCorrect(options, label) {
  const n = options.filter((o) => o.ok).length;
  if (n !== 1) fail(`${label}: expected exactly 1 correct option, found ${n}`);
  options.forEach((o, i) => {
    if (!o.t || !o.t.trim()) fail(`${label}: option ${i} has no text`);
    if (!o.why || !o.why.trim()) fail(`${label}: option ${i} has no explanation`);
  });
}
function checkBody(body, label) {
  const fences = (body.match(/^```/gm) || []).length;
  if (fences % 2 !== 0) fail(`${label}: unbalanced code fence (${fences} markers)`);

  (body.match(/\{\{diagram:([a-z0-9-]+)\}\}/g) || []).forEach((tok) => {
    const key = tok.slice('{{diagram:'.length, -2);
    if (!DIAGRAM_KEYS.has(key)) fail(`${label}: unknown diagram key "${key}"`);
  });

  // a {{ }} token outside a code fence that is neither diagram nor callout
  const noCode = body.replace(/```[\s\S]*?```/g, '');
  (noCode.match(/\{\{[^}]*/g) || []).forEach((tok) => {
    if (!/^\{\{(diagram:|callout:)/.test(tok)) fail(`${label}: unrecognised template token "${tok.slice(0, 40)}"`);
  });

  const callouts = (noCode.match(/\{\{callout:([a-z]*)\|/g) || []);
  callouts.forEach((c) => {
    const type = c.slice('{{callout:'.length, -1);
    if (!['', 'good', 'warn', 'bad'].includes(type)) fail(`${label}: unknown callout type "${type}"`);
  });
}

/* ---- modules & lessons ---- */
const seenLesson = new Set();
MODULES.forEach((m, mi) => {
  requireFields(m, ['title', 'slug', 'desc', 'lessons'], `module[${mi}]`);
  m.lessons.forEach((l) => {
    const label = `lesson "${l.id}"`;
    requireFields(l, ['id', 'title', 'mins', 'level', 'summary', 'body', 'keyPoints', 'pitfalls', 'quiz', 'lab', 'refs'], label);
    if (seenLesson.has(l.id)) fail(`${label}: duplicate id`);
    seenLesson.add(l.id);

    if (!['core', 'applied', 'advanced'].includes(l.level)) fail(`${label}: bad level "${l.level}"`);
    if (!(l.mins > 0 && l.mins < 90)) fail(`${label}: implausible mins ${l.mins}`);
    if (l.summary.length > 200) warn(`${label}: summary is ${l.summary.length} chars (keep under ~200)`);

    checkBody(l.body, label);
    l.quiz.forEach((q, qi) => {
      if (!q.q || !q.q.trim()) fail(`${label} quiz[${qi}]: no question text`);
      oneCorrect(q.options, `${label} quiz[${qi}]`);
    });
    requireFields(l.lab, ['title', 'steps'], `${label} lab`);
    l.refs.forEach((r, ri) => {
      if (!Array.isArray(r) || r.length !== 2) fail(`${label} ref[${ri}]: expected [title, url]`);
      else if (!/^https?:\/\//.test(r[1])) fail(`${label} ref[${ri}]: not an absolute URL`);
    });
  });
});

/* ---- case studies ---- */
const seenCase = new Set();
CASE_LIST.forEach((c) => {
  const label = `case "${c.id}"`;
  requireFields(c, ['id', 'num', 'title', 'platform', 'tags', 'brief', 'spec', 'pipeline',
    'trace', 'context', 'tools', 'failures', 'cost', 'evals', 'decisions', 'sim', 'sims', 'notes'], label);
  if (seenCase.has(c.id)) fail(`${label}: duplicate id`);
  seenCase.add(c.id);

  if (!SIM_TYPES.has(c.sim.type)) fail(`${label}: sim.type "${c.sim.type}" is not implemented in js/cases.js`);
  if (!c.sim.cfg) fail(`${label}: sim has no cfg`);
  if (c.pipeline.length < 3) warn(`${label}: pipeline has only ${c.pipeline.length} stages`);

  c.context.forEach((x, i) => {
    if (!(x.tokens > 0)) fail(`${label} context[${i}]: tokens must be positive`);
    if (!['acc', 'acc2', 'good', 'warn', 'bad', 'ink3'].includes(x.color)) {
      fail(`${label} context[${i}]: unknown color "${x.color}"`);
    }
  });
  c.tools.forEach((t, i) => {
    if (!['read', 'write', 'gated'].includes(t.kind)) fail(`${label} tools[${i}]: bad kind "${t.kind}"`);
  });
  c.failures.forEach((f, i) => requireFields(f, ['t', 'd', 'mit'], `${label} failures[${i}]`));
  c.evals.forEach((e, i) => {
    if (!Array.isArray(e) || e.length !== 3) fail(`${label} evals[${i}]: expected [metric, target, how]`);
  });
  c.decisions.forEach((d, di) => oneCorrect(d.options, `${label} decision[${di}]`));
  c.sims.forEach((s, si) => requireFields(s, ['label', 'out'], `${label} sims[${si}]`));
  checkBody(c.notes, `${label} notes`);
});

/* ---- patterns, workshop, reference ---- */
window.PATTERNS.forEach((p, i) => {
  requireFields(p, ['id', 'name', 'op', 'problem', 'mechanism', 'cost', 'failure', 'use'], `pattern[${i}]`);
  if (!['select', 'compress', 'isolate', 'order'].includes(p.op)) fail(`pattern "${p.id}": bad op "${p.op}"`);
});
window.WORKSHOP.forEach((w, i) => {
  if (!w.cat || !w.q) fail(`workshop[${i}]: missing cat or question`);
  oneCorrect(w.o, `workshop[${i}]`);
});
window.GLOSSARY.forEach((g, i) => requireFields(g, ['t', 'g', 'd'], `glossary[${i}]`));
window.SOURCES.forEach((s, i) => {
  requireFields(s, ['t', 'o', 'd', 'u'], `source[${i}]`);
  if (!/^https?:\/\//.test(s.u)) fail(`source[${i}]: not an absolute URL`);
});
window.FORMULAS.forEach((f, i) => requireFields(f, ['t', 'f', 'n'], `formula[${i}]`));

/* ---- labs ---- */
window.LABS.forEach((l, i) => {
  requireFields(l, ['id', 'name', 'title', 'desc'], `lab[${i}]`);
  if (typeof l.html !== 'function') fail(`lab "${l.id}": html must be a function`);
  if (typeof l.init !== 'function') fail(`lab "${l.id}": init must be a function`);
  if (!l.html().trim()) fail(`lab "${l.id}": html() returned nothing`);
});

/* ---- every diagram renders ---- */
window.DIAGRAMS.keys().forEach((k) => {
  const svg = window.DIAGRAMS.render(k);
  if (!svg.startsWith('<svg') || svg.length < 200) fail(`diagram "${k}": did not render`);
  if (!window.DIAGRAMS.caption(k)) warn(`diagram "${k}": no caption registered`);
});

/* ---- every script in index.html exists and is listed ---- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const srcs = (html.match(/<script src="([^"]+)"/g) || []).map((s) => s.match(/"([^"]+)"/)[1]);
srcs.forEach((s) => {
  if (!fs.existsSync(path.join(ROOT, s))) fail(`index.html references missing file "${s}"`);
});
fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).forEach((f) => {
  if (!srcs.includes('js/' + f)) warn(`js/${f} exists but is not loaded by index.html`);
});

/* ---- report ---- */
const stats = {
  modules: MODULES.length,
  lessons: LESSONS.length,
  'reading minutes': LESSONS.reduce((n, l) => n + l.mins, 0),
  'case studies': CASE_LIST.length,
  labs: window.LABS.length,
  patterns: window.PATTERNS.length,
  diagrams: window.DIAGRAMS.keys().length,
  'glossary terms': window.GLOSSARY.length,
  'graded questions':
    LESSONS.reduce((n, l) => n + l.quiz.length, 0) +
    CASE_LIST.reduce((n, c) => n + c.decisions.length, 0) +
    window.WORKSHOP.length,
};
console.log('AI Engineering Academy — content validation\n');
Object.entries(stats).forEach(([k, v]) => console.log(`  ${k.padEnd(18)} ${v}`));
console.log('');

if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log('  ! ' + w));
  console.log('');
}
if (errors.length) {
  console.error(`${errors.length} error(s):`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('✓ all structural checks passed');
