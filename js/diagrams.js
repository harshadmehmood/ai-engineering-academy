/* ============================================================
   diagrams.js — offline, theme-aware SVG diagram library.
   All diagrams are generated strings using CSS custom properties
   so they re-colour automatically in light/dark mode.
   Usage:  DIAGRAMS.render('rag-pipeline')  -> '<svg …>'
           DIAGRAMS.figure('rag-pipeline', 'caption')
   ============================================================ */
(function (global) {
  'use strict';

  var C = {
    ink: 'var(--ink)', ink2: 'var(--ink2)', ink3: 'var(--ink3)',
    line: 'var(--line2)', panel: 'var(--panel2)', bg: 'var(--bg2)',
    acc: 'var(--acc)', acc2: 'var(--acc2)',
    good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)'
  };
  var MONO = 'ui-monospace,SFMono-Regular,Menlo,monospace';
  var SANS = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---- primitives ---- */
  function box(x, y, w, h, label, opt) {
    opt = opt || {};
    var stroke = opt.stroke || C.line;
    var fill = opt.fill || C.panel;
    var tc = opt.color || C.ink;
    var r = opt.r == null ? 8 : opt.r;
    var fs = opt.fs || 12;
    var out = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.25"' +
      (opt.dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    var lines = String(label).split('|');
    var lh = fs + 3;
    var startY = y + h / 2 - ((lines.length - 1) * lh) / 2 + fs * 0.35;
    lines.forEach(function (ln, i) {
      var isSub = ln.charAt(0) === '~';
      var t = isSub ? ln.slice(1) : ln;
      out += '<text x="' + (x + w / 2) + '" y="' + (startY + i * lh) +
        '" text-anchor="middle" font-family="' + (opt.mono ? MONO : SANS) +
        '" font-size="' + (isSub ? fs - 2 : fs) + '" font-weight="' + (isSub ? 400 : (opt.weight || 600)) +
        '" fill="' + (isSub ? C.ink3 : tc) + '">' + esc(t) + '</text>';
    });
    return out;
  }

  function arrow(x1, y1, x2, y2, opt) {
    opt = opt || {};
    var col = opt.color || C.ink3;
    var out = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + col + '" stroke-width="1.4" marker-end="url(#ah)"' +
      (opt.dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    if (opt.label) {
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      out += '<text x="' + mx + '" y="' + (my + (opt.above ? -6 : -5)) + '" text-anchor="middle" font-family="' +
        MONO + '" font-size="9.5" fill="' + C.ink3 + '">' + esc(opt.label) + '</text>';
    }
    return out;
  }

  function curveArrow(x1, y1, x2, y2, bend, opt) {
    opt = opt || {};
    var col = opt.color || C.ink3;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend;
    var out = '<path d="M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2 +
      '" fill="none" stroke="' + col + '" stroke-width="1.4" marker-end="url(#ah)"' +
      (opt.dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    if (opt.label) {
      out += '<text x="' + mx + '" y="' + (my + (bend > 0 ? 13 : -5)) + '" text-anchor="middle" font-family="' +
        MONO + '" font-size="9.5" fill="' + C.ink3 + '">' + esc(opt.label) + '</text>';
    }
    return out;
  }

  function text(x, y, s, opt) {
    opt = opt || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (opt.anchor || 'start') +
      '" font-family="' + (opt.mono ? MONO : SANS) + '" font-size="' + (opt.fs || 11) +
      '" font-weight="' + (opt.weight || 400) + '" fill="' + (opt.color || C.ink2) + '">' + esc(s) + '</text>';
  }

  function band(x, y, w, h, label, color) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + color +
      '" opacity="0.86"/>' + (w > 34 ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 3.5) +
      '" text-anchor="middle" font-family="' + MONO + '" font-size="9" fill="#04121b" font-weight="600">' +
      esc(label) + '</text>' : '');
  }

  function svg(w, h, body) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" xmlns="http://www.w3.org/2000/svg" role="img">' +
      '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="' + C.ink3 + '"/></marker>' +
      '<linearGradient id="grd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.acc +
      '"/><stop offset="1" stop-color="' + C.acc2 + '"/></linearGradient></defs>' + body + '</svg>';
  }

  /* row of boxes connected by arrows */
  function chain(items, opt) {
    opt = opt || {};
    var bw = opt.bw || 104, bh = opt.bh || 48, gap = opt.gap || 30, y = opt.y || 20;
    var out = '', x = opt.x || 10;
    items.forEach(function (it, i) {
      var o = typeof it === 'string' ? { label: it } : it;
      out += box(x, y, bw, bh, o.label, { fill: o.fill, stroke: o.stroke, color: o.color, fs: opt.fs || 11.5 });
      if (i < items.length - 1) out += arrow(x + bw, y + bh / 2, x + bw + gap - 3, y + bh / 2, { label: o.edge });
      x += bw + gap;
    });
    return { body: out, width: x - gap, endX: x - gap };
  }

  /* ============================================================
     Named diagrams
     ============================================================ */
  var D = {};

  D['request-lifecycle'] = function () {
    var c = chain([
      { label: 'User intent|~UI event' },
      { label: 'App logic|~auth, routing' },
      { label: 'Context build|~select + budget' },
      { label: 'Model|~generation' },
      { label: 'Validation|~schema, policy' },
      { label: 'Action|~tool / write' }
    ], { bw: 100, bh: 50, gap: 26, y: 30 });
    var b = c.body;
    b += curveArrow(530, 80, 130, 80, 44, { label: 'retry / repair loop', dash: true, color: C.warn });
    b += text(10, 18, 'YOUR SOFTWARE OWNS EVERY BOX EXCEPT ONE', { fs: 9.5, weight: 700, color: C.ink3 });
    b += '<rect x="316" y="24" width="100" height="62" rx="10" fill="none" stroke="' + C.acc + '" stroke-dasharray="3 3"/>';
    b += text(366, 100, 'probabilistic', { anchor: 'middle', fs: 9, mono: true, color: C.acc });
    return svg(766, 140, b);
  };

  D['context-window'] = function () {
    var b = text(10, 16, 'ONE MODEL CALL = ONE FLAT TOKEN SEQUENCE', { fs: 9.5, weight: 700, color: C.ink3 });
    var x = 10, y = 28, h = 40;
    var parts = [
      ['System', 90, C.acc], ['Tools', 70, C.acc2], ['Memory', 80, C.good],
      ['Retrieved docs', 200, C.warn], ['History', 150, C.ink3], ['User turn', 70, C.bad]
    ];
    parts.forEach(function (p) { b += band(x, y, p[1], h, p[0], p[2]); x += p[1] + 3; });
    b += '<rect x="' + (x + 3) + '" y="' + y + '" width="80" height="' + h + '" rx="4" fill="none" stroke="' + C.line + '" stroke-dasharray="3 3"/>';
    b += text(x + 43, y + 24, 'free', { anchor: 'middle', mono: true, fs: 9, color: C.ink3 });
    b += '<line x1="10" y1="80" x2="756" y2="80" stroke="' + C.line + '"/>';
    b += text(10, 96, '0', { mono: true, fs: 9 });
    b += text(756, 96, 'context limit', { mono: true, fs: 9, anchor: 'end' });
    b += text(10, 122, 'Everything competes for the same finite budget. Adding a tool schema', { fs: 11, color: C.ink2 });
    b += text(10, 137, 'silently evicts retrieved evidence — the model never tells you.', { fs: 11, color: C.ink2 });
    return svg(766, 150, b);
  };

  D['context-rot'] = function () {
    var b = text(10, 16, 'ACCURACY vs CONTEXT LENGTH (illustrative)', { fs: 9.5, weight: 700, color: C.ink3 });
    b += '<line x1="46" y1="30" x2="46" y2="150" stroke="' + C.line + '"/>';
    b += '<line x1="46" y1="150" x2="720" y2="150" stroke="' + C.line + '"/>';
    var pts = [[46, 44], [140, 46], [240, 52], [340, 64], [440, 82], [540, 104], [640, 124], [720, 136]];
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    b += '<path d="' + d + '" fill="none" stroke="' + C.bad + '" stroke-width="2"/>';
    b += '<path d="' + d + ' L720 150 L46 150 Z" fill="' + C.bad + '" opacity="0.08"/>';
    b += '<line x1="46" y1="44" x2="720" y2="44" stroke="' + C.good + '" stroke-dasharray="4 4" stroke-width="1.4"/>';
    b += text(724, 47, 'ideal', { fs: 10, color: C.good });
    b += text(724, 139, 'real', { fs: 10, color: C.bad });
    b += text(40, 48, 'high', { anchor: 'end', fs: 9.5, mono: true });
    b += text(40, 152, 'low', { anchor: 'end', fs: 9.5, mono: true });
    ['1k', '8k', '32k', '100k', '400k', '1M'].forEach(function (t, i) {
      var x = 46 + i * 134;
      b += text(Math.min(x, 716), 166, t, { anchor: 'middle', fs: 9.5, mono: true });
    });
    b += box(430, 62, 170, 34, 'attention budget|~thins as n grows', { fill: 'none', stroke: C.warn, color: C.warn, fs: 10 });
    return svg(766, 180, b);
  };

  D['jit-retrieval'] = function () {
    var b = text(10, 16, 'PRE-LOAD  vs  JUST-IN-TIME', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(10, 30, 140, 100, 'Pre-load|~dump all 40 docs', { stroke: C.bad, color: C.bad });
    b += arrow(152, 80, 196, 80);
    b += box(198, 30, 120, 100, 'Model|~90k tokens|~1 shot', {});
    b += text(80, 148, '✗ slow · costly · diluted', { anchor: 'middle', fs: 10, color: C.bad });
    b += '<line x1="360" y1="24" x2="360" y2="150" stroke="' + C.line + '" stroke-dasharray="3 3"/>';
    b += box(390, 30, 120, 44, 'Model|~decides', { stroke: C.good });
    b += box(390, 88, 120, 42, 'search(q)|~identifiers only', { mono: true, fs: 10 });
    b += arrow(450, 76, 450, 86, {});
    b += curveArrow(510, 108, 512, 52, 60, { label: '3 docs' });
    b += box(560, 30, 130, 100, 'Model|~8k tokens|~3 turns', { stroke: C.good });
    b += text(560, 148, '✓ cheap · focused · auditable', { fs: 10, color: C.good });
    return svg(766, 160, b);
  };

  D['compaction'] = function () {
    var b = text(10, 16, 'COMPACTION — THE HAND-OFF NOTE', { fs: 9.5, weight: 700, color: C.ink3 });
    var x = 10;
    for (var i = 0; i < 9; i++) { b += band(x, 30, 26, 30, '', i > 6 ? C.warn : C.ink3); x += 29; }
    b += text(10, 76, 'turns 1–9 · 148k tokens · 92% full', { fs: 10, mono: true, color: C.ink3 });
    b += arrow(280, 45, 330, 45, { label: 'summarize' });
    b += box(340, 22, 160, 46, 'Structured summary|~decisions · state · open Qs', { stroke: C.acc, fs: 10.5 });
    b += arrow(504, 45, 548, 45);
    b += band(556, 30, 40, 30, 'sum', C.acc);
    b += band(599, 30, 26, 30, '', C.ink3);
    b += band(628, 30, 26, 30, '', C.ink3);
    b += text(556, 76, 'turns 10+ · 22k tokens', { fs: 10, mono: true, color: C.good });
    b += box(10, 96, 730, 42, 'Keep verbatim: the last tool result, the active file, the exact user ask. Summarize: everything already resolved.', { fill: 'none', stroke: C.line, dash: true, fs: 11, weight: 500, color: C.ink2 });
    return svg(766, 150, b);
  };

  D['memory-tiers'] = function () {
    var b = text(10, 16, 'FOUR MEMORY TIERS — DIFFERENT LIFETIMES, DIFFERENT STORES', { fs: 9.5, weight: 700, color: C.ink3 });
    var tiers = [
      ['Working', 'this call only', 'context window', C.bad],
      ['Episodic', 'this session', 'conversation log', C.warn],
      ['Semantic', 'forever, shared', 'vector + SQL store', C.acc],
      ['Procedural', 'forever, versioned', 'prompt / skill files', C.good]
    ];
    var x = 10;
    tiers.forEach(function (t) {
      b += box(x, 30, 176, 78, t[0] + '|~' + t[1] + '|~' + t[2], { stroke: t[3], color: t[3], fs: 13 });
      x += 186;
    });
    b += text(10, 126, 'A common bug: storing episodic chatter in the semantic tier. It never expires, so last week\'s wrong answer', { fs: 11, color: C.ink2 });
    b += text(10, 141, 'is retrieved as fact forever. Give every memory a source, a timestamp and an eviction rule.', { fs: 11, color: C.ink2 });
    return svg(766, 152, b);
  };

  D['prompt-cache'] = function () {
    var b = text(10, 16, 'CACHE-STABLE PREFIX ORDERING', { fs: 9.5, weight: 700, color: C.ink3 });
    b += text(10, 42, 'GOOD', { fs: 10, weight: 700, color: C.good });
    var x = 56, y = 30;
    [['system', 110, C.acc], ['tools', 90, C.acc2], ['docs', 130, C.good]].forEach(function (p) {
      b += band(x, y, p[1], 26, p[0], p[2]); x += p[1] + 2;
    });
    b += '<rect x="54" y="28" width="' + (x - 56) + '" height="30" rx="5" fill="none" stroke="' + C.good + '" stroke-width="1.6"/>';
    b += text(x + 10, y + 18, 'cached ✓', { fs: 10, mono: true, color: C.good });
    x += 66;
    b += band(x, y, 90, 26, 'user turn', C.bad);
    b += text(10, 92, 'BAD', { fs: 10, weight: 700, color: C.bad });
    y = 80; x = 56;
    [['time', 60, C.bad], ['system', 110, C.acc], ['tools', 90, C.acc2], ['docs', 130, C.good], ['user', 80, C.bad]].forEach(function (p) {
      b += band(x, y, p[1], 26, p[0], p[2]); x += p[1] + 2;
    });
    b += text(x + 10, y + 18, 'cache miss ✗', { fs: 10, mono: true, color: C.bad });
    b += box(10, 122, 730, 38, 'One volatile token at position 0 invalidates the entire prefix. Put timestamps, request ids and user names AFTER the stable block.', { fill: 'none', stroke: C.line, dash: true, fs: 11, weight: 500, color: C.ink2 });
    return svg(766, 172, b);
  };

  D['rag-pipeline'] = function () {
    var b = text(10, 16, 'RETRIEVAL PIPELINE — EVERY STAGE IS A PLACE TO FAIL', { fs: 9.5, weight: 700, color: C.ink3 });
    var c = chain([
      { label: 'Query|~+ rewrite' }, { label: 'Hybrid search|~BM25 + vector' },
      { label: 'Fuse|~RRF' }, { label: 'Rerank|~cross-encoder' },
      { label: 'Pack|~budget fit' }, { label: 'Generate|~cite spans' }
    ], { bw: 106, bh: 52, gap: 22, y: 32 });
    b += c.body;
    b += box(10, 106, 106, 34, 'top-200', { fill: 'none', stroke: C.line, fs: 10, weight: 500 });
    b += box(266, 106, 106, 34, 'top-50', { fill: 'none', stroke: C.line, fs: 10, weight: 500 });
    b += box(394, 106, 106, 34, 'top-8', { fill: 'none', stroke: C.line, fs: 10, weight: 500 });
    b += box(522, 106, 106, 34, 'top-5 fits', { fill: 'none', stroke: C.good, color: C.good, fs: 10, weight: 500 });
    b += text(10, 162, 'Recall is won early and cheaply; precision is won late and expensively. Measure them separately.', { fs: 11, color: C.ink2 });
    return svg(766, 172, b);
  };

  D['chunking'] = function () {
    var b = text(10, 16, 'CHUNK BOUNDARIES DECIDE WHAT CAN EVER BE RETRIEVED', { fs: 9.5, weight: 700, color: C.ink3 });
    b += text(10, 40, 'Fixed 400 chars — splits the answer in half', { fs: 11, color: C.bad });
    var x = 10;
    for (var i = 0; i < 6; i++) { b += band(x, 48, 118, 26, 'chunk ' + (i + 1), i === 2 || i === 3 ? C.bad : C.ink3); x += 121; }
    b += text(10, 96, 'Structure-aware — heading + section, overlap on boundaries', { fs: 11, color: C.good });
    x = 10;
    [['§1 Intro', 120], ['§2 Trial period', 200], ['§3 Payment', 160], ['§4 Termination', 240]].forEach(function (p) {
      b += band(x, 104, p[1], 26, p[0], C.good); x += p[1] + 4;
    });
    b += box(10, 142, 730, 40, 'Every chunk carries: document id · section path · page · updated-at. Provenance is not decoration — it is how a human verifies the answer.', { fill: 'none', stroke: C.line, dash: true, fs: 11, weight: 500, color: C.ink2 });
    return svg(766, 194, b);
  };

  D['agent-loop'] = function () {
    var b = text(10, 16, 'THE AGENT LOOP — WHO HOLDS AUTHORITY', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(30, 40, 130, 56, 'Model|~proposes action', { stroke: C.acc, color: C.acc });
    b += arrow(162, 68, 220, 68, { label: 'tool_use' });
    b += box(222, 40, 140, 56, 'Your runtime|~validate + authorize', { stroke: C.good, color: C.good });
    b += arrow(364, 68, 420, 68, { label: 'if allowed' });
    b += box(422, 40, 120, 56, 'Tool|~side effect', {});
    b += curveArrow(482, 100, 100, 100, 52, { label: 'tool_result appended to context' });
    b += box(566, 40, 176, 56, 'Stop condition|~done · budget · error', { stroke: C.warn, color: C.warn });
    b += arrow(544, 68, 564, 68);
    b += box(10, 152, 730, 38, 'The model NEVER executes anything. It emits a request. Permission, rate limits, argument validation and audit logging all live in your code.', { fill: 'none', stroke: C.bad, fs: 11, weight: 500, color: C.ink2 });
    return svg(766, 202, b);
  };

  D['workflow-vs-agent'] = function () {
    var b = text(10, 16, 'CHOOSE THE LEAST DYNAMIC THING THAT WORKS', { fs: 9.5, weight: 700, color: C.ink3 });
    b += text(10, 40, 'Workflow — you wrote the graph', { fs: 11, weight: 600, color: C.good });
    var c1 = chain(['fetch', 'classify', 'route', 'reply'], { bw: 86, bh: 40, gap: 22, y: 50, fs: 11 });
    b += c1.body;
    b += text(470, 74, '✓ testable  ✓ bounded cost  ✓ debuggable', { fs: 10.5, color: C.good });
    b += text(10, 122, 'Agent — the model writes the graph at runtime', { fs: 11, weight: 600, color: C.warn });
    b += box(10, 132, 100, 44, 'Goal', { stroke: C.warn });
    b += curveArrow(112, 154, 200, 154, -22, { label: '?' });
    b += box(202, 132, 100, 44, 'step n', { dash: true });
    b += curveArrow(304, 154, 392, 154, -22, { label: '?' });
    b += box(394, 132, 100, 44, 'step n+1', { dash: true });
    b += text(506, 158, '✓ handles novelty  ✗ unbounded  ✗ hard to test', { fs: 10.5, color: C.warn });
    return svg(766, 194, b);
  };

  D['tool-boundary'] = function () {
    var b = text(10, 16, 'TOOL SURFACE DESIGN', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(10, 32, 250, 118, '', { stroke: C.bad, fill: 'none' });
    b += text(135, 52, 'ONE GOD TOOL', { anchor: 'middle', fs: 11, weight: 700, color: C.bad });
    b += box(30, 64, 210, 34, 'runQuery(sql: String)', { mono: true, fs: 11, stroke: C.bad });
    b += text(135, 118, 'unbounded blast radius', { anchor: 'middle', fs: 10, color: C.ink3 });
    b += text(135, 134, 'model must know your schema', { anchor: 'middle', fs: 10, color: C.ink3 });
    b += box(300, 32, 440, 118, '', { stroke: C.good, fill: 'none' });
    b += text(520, 52, 'NARROW, TYPED, AUTHORIZED', { anchor: 'middle', fs: 11, weight: 700, color: C.good });
    b += box(316, 64, 196, 30, 'getOrder(id: UUID)', { mono: true, fs: 10.5, stroke: C.good });
    b += box(524, 64, 200, 30, 'listRefunds(since, limit≤50)', { mono: true, fs: 10.5, stroke: C.good });
    b += box(316, 100, 196, 30, 'issueRefund(≤$50)', { mono: true, fs: 10.5, stroke: C.warn, color: C.warn });
    b += box(524, 100, 200, 30, 'escalate(reason) → human', { mono: true, fs: 10.5, stroke: C.good });
    b += text(10, 172, 'Each tool name and description is a prompt. Vague names cause wrong calls far more often than model weakness does.', { fs: 11, color: C.ink2 });
    return svg(766, 184, b);
  };

  D['eval-layers'] = function () {
    var b = text(10, 16, 'A SINGLE ACCURACY NUMBER HIDES WHICH LAYER BROKE', { fs: 9.5, weight: 700, color: C.ink3 });
    var rows = [
      ['Retrieval', 'recall@k · precision@k · citation validity', C.acc],
      ['Generation', 'faithfulness · refusal correctness · format', C.acc2],
      ['Tools', 'call accuracy · arg validity · recovery rate', C.good],
      ['System', 'p95 latency · cost/task · task success', C.warn]
    ];
    var y = 30;
    rows.forEach(function (r) {
      b += '<rect x="10" y="' + y + '" width="730" height="34" rx="7" fill="' + C.panel + '" stroke="' + C.line + '"/>';
      b += '<rect x="10" y="' + y + '" width="5" height="34" rx="2" fill="' + r[2] + '"/>';
      b += text(28, y + 21, r[0], { fs: 12.5, weight: 700, color: C.ink });
      b += text(140, y + 21, r[1], { fs: 11.5, mono: true, color: C.ink2 });
      y += 40;
    });
    b += text(10, y + 14, 'End-to-end score = product of layer scores. 90% × 90% × 90% = 73% task success.', { fs: 11, color: C.warn });
    return svg(766, y + 26, b);
  };

  D['injection'] = function () {
    var b = text(10, 16, 'PROMPT INJECTION IS A CONFUSED-DEPUTY PROBLEM', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(10, 32, 120, 46, 'Attacker|~writes a page', { stroke: C.bad, color: C.bad });
    b += arrow(132, 55, 176, 55);
    b += box(178, 32, 120, 46, 'Web page|~"ignore rules…"', { stroke: C.bad });
    b += arrow(300, 55, 344, 55, { label: 'fetch' });
    b += box(346, 32, 120, 46, 'Agent context|~data == instructions', { stroke: C.warn, color: C.warn });
    b += arrow(468, 55, 512, 55);
    b += box(514, 32, 120, 46, 'sendEmail()|~exfiltration', { stroke: C.bad, color: C.bad });
    b += text(10, 104, 'DEFENCE IN DEPTH — no single layer is sufficient', { fs: 11, weight: 700, color: C.good });
    var x = 10;
    ['tag untrusted spans', 'least-privilege tools', 'egress allowlist', 'human approval', 'output scanning'].forEach(function (t) {
      b += box(x, 114, 142, 38, t, { stroke: C.good, fs: 10, weight: 500 });
      x += 148;
    });
    b += text(10, 176, 'Treat every retrieved document, tool result and file as attacker-controlled input, because eventually one will be.', { fs: 11, color: C.ink2 });
    return svg(766, 188, b);
  };

  D['multi-agent'] = function () {
    var b = text(10, 16, 'ORCHESTRATOR / WORKER — CONTEXT ISOLATION AS THE POINT', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(300, 30, 160, 50, 'Orchestrator|~holds the plan', { stroke: C.acc, color: C.acc });
    var xs = [40, 220, 400, 580];
    xs.forEach(function (x, i) {
      b += box(x, 130, 146, 50, 'Worker ' + (i + 1) + '|~own clean window', { fs: 11 });
      b += curveArrow(380, 82, x + 73, 128, 14, { label: 'task' });
    });
    b += text(10, 206, 'Each worker burns its own 40k tokens exploring, and returns 800 tokens of findings. The orchestrator never sees the mess —', { fs: 11, color: C.ink2 });
    b += text(10, 221, 'that compression IS the architecture. Cost is roughly linear in worker count, so cap it explicitly.', { fs: 11, color: C.ink2 });
    return svg(766, 232, b);
  };

  D['latency-budget'] = function () {
    var b = text(10, 16, 'LATENCY BUDGET — WHERE THE SECONDS GO', { fs: 9.5, weight: 700, color: C.ink3 });
    var items = [['auth+route', 40, C.ink3], ['retrieval', 180, C.acc], ['rerank', 120, C.acc2], ['TTFT', 210, C.warn], ['stream 600 tok', 300, C.good]];
    var total = 0; items.forEach(function (i) { total += i[1]; });
    var x = 10;
    items.forEach(function (i) { b += band(x, 32, i[1] * 1.42, 34, i[0], i[2]); x += i[1] * 1.42 + 3; });
    b += text(10, 84, '0 ms', { fs: 9.5, mono: true });
    b += text(740, 84, '~' + (total * 3) + ' ms p50', { fs: 9.5, mono: true, anchor: 'end' });
    b += box(10, 98, 358, 56, 'Perceived latency = TTFT|~stream the first token fast, even if total is slower', { stroke: C.good, color: C.good, fs: 11.5 });
    b += box(382, 98, 358, 56, 'Do retrieval BEFORE the user finishes typing|~speculative prefetch on debounce', { stroke: C.acc, color: C.acc, fs: 11.5 });
    return svg(766, 166, b);
  };

  D['cost-model'] = function () {
    var b = text(10, 16, 'UNIT ECONOMICS OF ONE AI FEATURE', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(10, 30, 176, 92, 'Per request|~in: 6,000 tok|~out: 700 tok|~≈ $0.028', { stroke: C.acc, fs: 12 });
    b += arrow(190, 76, 226, 76, { label: '×' });
    b += box(228, 30, 176, 92, 'Per user / month|~24 requests|~≈ $0.67', { stroke: C.acc2, fs: 12 });
    b += arrow(408, 76, 444, 76, { label: 'vs' });
    b += box(446, 30, 176, 92, 'Plan price|~$12 / month|~gross margin 94%', { stroke: C.good, color: C.good, fs: 12 });
    b += box(636, 30, 110, 92, 'Abuse|~1 bad actor|~= 900 users', { stroke: C.bad, color: C.bad, fs: 12 });
    b += text(10, 144, 'The median user is never the problem. Model the 99th percentile, then cap it with quota — not with hope.', { fs: 11, color: C.ink2 });
    return svg(766, 156, b);
  };

  D['sysdesign-layers'] = function () {
    var b = text(10, 16, 'THE SEVEN-LAYER CHECKLIST FOR ANY AI FEATURE', { fs: 9.5, weight: 700, color: C.ink3 });
    var L = [
      ['1 · Product contract', 'what counts as success, and who verifies it'],
      ['2 · Data & context', 'what the model may see, and where it comes from'],
      ['3 · Model & routing', 'which model, which fallback, which cache'],
      ['4 · Tools & authority', 'what may change state, under what permission'],
      ['5 · Validation', 'schema, policy, groundedness, refusal paths'],
      ['6 · Evaluation', 'the fixed set you run before every deploy'],
      ['7 · Operations', 'cost caps, quotas, tracing, rollback']
    ];
    var y = 28;
    L.forEach(function (l, i) {
      var w = 730 - i * 0;
      b += '<rect x="10" y="' + y + '" width="' + w + '" height="30" rx="6" fill="' + C.panel + '" stroke="' + C.line + '"/>';
      b += '<rect x="10" y="' + y + '" width="4" height="30" rx="2" fill="url(#grd)"/>';
      b += text(26, y + 19, l[0], { fs: 12, weight: 700, color: C.ink });
      b += text(210, y + 19, l[1], { fs: 11.5, color: C.ink2 });
      y += 35;
    });
    return svg(766, y + 6, b);
  };

  D['embeddings-space'] = function () {
    var b = text(10, 16, 'SEMANTIC SIMILARITY ≠ RELEVANCE', { fs: 9.5, weight: 700, color: C.ink3 });
    b += '<rect x="10" y="28" width="360" height="180" rx="10" fill="' + C.bg + '" stroke="' + C.line + '"/>';
    var pts = [[80, 70, 'refund policy', C.acc], [120, 100, 'return window', C.acc], [95, 130, 'money back', C.acc],
      [270, 60, 'shipping', C.ink3], [300, 120, 'packaging', C.ink3], [240, 170, 'warehouse', C.ink3]];
    pts.forEach(function (p) {
      b += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + p[3] + '"/>';
      b += text(p[0] + 9, p[1] + 4, p[2], { fs: 9.5, color: C.ink2 });
    });
    b += '<circle cx="100" cy="100" r="52" fill="none" stroke="' + C.acc + '" stroke-dasharray="3 3"/>';
    b += '<circle cx="100" cy="100" r="4" fill="' + C.bad + '"/>';
    b += text(108, 96, 'query', { fs: 9.5, color: C.bad, weight: 700 });
    b += box(390, 40, 350, 70, 'Nearest ≠ correct. "How do I cancel?" is near "refund policy"|~but the right answer may live in a doc using none of those words.', { fill: 'none', stroke: C.warn, color: C.ink2, fs: 11, weight: 500 });
    b += box(390, 124, 350, 84, 'Fix: hybrid retrieval (lexical catches exact identifiers like|~GIDSignIn or invoice #4417 that embeddings blur), then rerank|~with a model that actually reads the query and the passage together.', { fill: 'none', stroke: C.good, color: C.ink2, fs: 11, weight: 500 });
    return svg(766, 220, b);
  };

  D['streaming'] = function () {
    var b = text(10, 16, 'STREAMING CHANGES THE UX CONTRACT', { fs: 9.5, weight: 700, color: C.ink3 });
    b += text(10, 42, 'Blocking', { fs: 11, weight: 700, color: C.bad });
    b += band(90, 30, 500, 22, 'user stares at a spinner for 8.2 s', C.bad);
    b += band(594, 30, 146, 22, 'answer', C.good);
    b += text(10, 92, 'Streaming', { fs: 11, weight: 700, color: C.good });
    b += band(90, 80, 90, 22, 'TTFT 0.9s', C.warn);
    b += band(183, 80, 557, 22, 'tokens arrive continuously — user reads while it writes', C.good);
    b += box(10, 120, 730, 56, 'Same total time. Completely different product. But streaming means you cannot validate the whole output before showing it —|~so validate structure incrementally, and keep destructive actions behind a post-stream confirmation step.', { fill: 'none', stroke: C.line, dash: true, fs: 11, weight: 500, color: C.ink2 });
    return svg(766, 188, b);
  };

  D['guardrails'] = function () {
    var b = text(10, 16, 'GUARDRAILS RUN ON BOTH SIDES OF THE MODEL', { fs: 9.5, weight: 700, color: C.ink3 });
    b += box(10, 40, 130, 56, 'Input|~user + retrieved', {});
    b += arrow(142, 68, 178, 68);
    b += box(180, 40, 140, 56, 'Pre-checks|~PII · injection · quota', { stroke: C.acc, color: C.acc });
    b += arrow(322, 68, 358, 68);
    b += box(360, 40, 110, 56, 'Model', { stroke: C.line });
    b += arrow(472, 68, 508, 68);
    b += box(510, 40, 140, 56, 'Post-checks|~schema · citations · policy', { stroke: C.good, color: C.good });
    b += arrow(652, 68, 688, 68);
    b += box(690, 40, 60, 56, 'Ship', { stroke: C.good });
    b += curveArrow(580, 100, 415, 100, 40, { label: 'repair once, then fail closed', dash: true, color: C.warn });
    b += text(10, 168, 'A guardrail that only logs is not a guardrail. Decide in advance: block, degrade, or escalate to a human.', { fs: 11, color: C.ink2 });
    return svg(766, 180, b);
  };

  D['hero'] = function () {
    var b = '';
    b += '<rect x="4" y="4" width="392" height="212" rx="16" fill="' + C.bg + '" stroke="' + C.line + '"/>';
    b += text(20, 28, 'context assembled for one call', { fs: 10, mono: true, color: C.ink3 });
    var rows = [
      ['system rules', 62, C.acc], ['tool schemas', 48, C.acc2], ['memory', 40, C.good],
      ['retrieved §4.2', 96, C.warn], ['recent turns', 74, C.ink3], ['user ask', 44, C.bad]
    ];
    var y = 44;
    rows.forEach(function (r) {
      b += band(20, y, r[1] * 2.6, 20, '', r[2]);
      b += text(20 + r[1] * 2.6 + 8, y + 14, r[0], { fs: 9.5, mono: true, color: C.ink3 });
      y += 25;
    });
    b += '<line x1="20" y1="' + (y + 4) + '" x2="376" y2="' + (y + 4) + '" stroke="' + C.line + '"/>';
    b += text(20, y + 22, 'budget 11,240 / 200,000', { fs: 10, mono: true, color: C.good });
    b += text(376, y + 22, 'cache hit 92%', { fs: 10, mono: true, color: C.acc, anchor: 'end' });
    return svg(400, 220, b);
  };

  /* ---- public ---- */
  var CAPTIONS = {
    'request-lifecycle': 'One AI request, end to end. The model is a single stage inside software you control.',
    'context-window': 'Anatomy of a context window.',
    'context-rot': 'Longer context is not free accuracy — quality degrades before the limit does.',
    'jit-retrieval': 'Pre-loading everything versus letting the model pull what it needs.',
    'compaction': 'Compaction replaces resolved history with a structured summary.',
    'memory-tiers': 'Four memory tiers with different lifetimes and different storage.',
    'prompt-cache': 'Prefix stability is what makes prompt caching pay.',
    'rag-pipeline': 'A production retrieval pipeline funnels wide then narrows precisely.',
    'chunking': 'Chunk boundaries set a hard ceiling on retrieval quality.',
    'agent-loop': 'The agent loop, with the authority boundary drawn explicitly.',
    'workflow-vs-agent': 'Deterministic workflow versus model-planned agent.',
    'tool-boundary': 'Tool surface design: one god tool versus narrow authorized capabilities.',
    'eval-layers': 'Evaluate each layer separately, because they fail independently.',
    'injection': 'Prompt injection and the layered defences that contain it.',
    'multi-agent': 'Orchestrator/worker topology exists to isolate context, not to add intelligence.',
    'latency-budget': 'Where the milliseconds actually go.',
    'cost-model': 'Unit economics, including the abusive tail.',
    'sysdesign-layers': 'The seven layers to specify for any AI feature.',
    'embeddings-space': 'Embedding proximity is a useful signal, not a definition of relevance.',
    'streaming': 'Streaming changes perceived latency and your validation strategy.',
    'hero': 'A context window assembled for a single model call.',
    'guardrails': 'Guardrails on both sides of the model call.'
  };

  global.DIAGRAMS = {
    has: function (k) { return !!D[k]; },
    render: function (k) { return D[k] ? D[k]() : ''; },
    caption: function (k) { return CAPTIONS[k] || ''; },
    figure: function (k, cap) {
      if (!D[k]) return '';
      return '<figure class="diagram">' + D[k]() +
        '<figcaption>' + esc(cap || CAPTIONS[k] || '') + '</figcaption></figure>';
    },
    keys: function () { return Object.keys(D); },
    /* exposed primitives so labs can build ad-hoc visuals */
    p: { box: box, arrow: arrow, curveArrow: curveArrow, text: text, band: band, svg: svg, chain: chain, C: C }
  };
})(window);
