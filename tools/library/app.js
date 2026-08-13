/* ============================================================
   app.js — AI Academy Library reader.

   Reads course files from disk at view time (fetch). Nothing
   from the courses is copied into this tool; index-data.js
   holds only titles, paths and metadata.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* The index is generated locally and deliberately not committed, so this
     page is reachable — on GitHub Pages, or opened straight from a clone —
     with nothing to read. Explain that instead of throwing. */
  if (!window.LIBRARY) {
    document.addEventListener('DOMContentLoaded', showSetup);
    if (document.readyState !== 'loading') showSetup();
    return;
  }
  function showSetup() {
    var d = $('drawer'); if (d) d.remove();
    var s = $('scrim'); if (s) s.remove();
    var t = $('offlineTag'); if (t) t.textContent = 'not set up';
    document.body.style.paddingLeft = '0';
    var bar = document.querySelector('.topbar'); if (bar) bar.style.paddingLeft = '16px';
    ['page-course', 'page-item', 'page-path'].forEach(function (p) {
      var e = $(p); if (e) e.remove();
    });
    $('page-home').innerHTML =
      '<div class="hero"><label>LOCAL COURSE LIBRARY</label>' +
      '<h1>This tool runs on your machine, not here.</h1>' +
      '<p>It reads course repositories from your own disk, so there is nothing for it ' +
      'to show on a hosted page. The index it needs is generated locally and is not ' +
      'committed to the repository.</p></div>' +
      '<div class="banner" style="border-left-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,var(--panel));border-color:color-mix(in srgb,var(--acc) 35%,var(--line))">' +
      '<b>Two commands to run it for real:</b></div>' +
      '<pre style="background:var(--bg2);border:1px solid var(--line);border-radius:10px;' +
      'padding:16px;overflow-x:auto;font-family:var(--mono);font-size:13px;line-height:1.7">' +
      'git clone https://github.com/harshadmehmood/ai-engineering-academy.git\n' +
      'cd ai-engineering-academy/tools\n\n' +
      './setup.sh   <span style="color:var(--ink3)"># clones three courses, builds the index</span>\n' +
      './start.sh   <span style="color:var(--ink3)"># serves locally and opens this page, working</span></pre>' +
      '<p class="lead" style="margin-top:18px">You then get roughly 280 files, 170 written lessons and 81 ' +
      'notebooks in one searchable tree, plus a seven-stage study path mapping them onto ' +
      'the academy&rsquo;s modules — all offline.</p>' +
      '<p style="margin-top:22px"><a class="pathLink" style="display:inline-block;margin:0" ' +
      'href="https://harshadmehmood.github.io/ai-engineering-academy/">← Back to the academy</a> ' +
      '<a class="pathLink" style="display:inline-block;margin:0 0 0 8px" ' +
      'href="https://github.com/harshadmehmood/ai-engineering-academy/tree/main/tools">Setup guide on GitHub</a></p>';
  }

  var L = window.LIBRARY;
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---- flatten ---- */
  var ITEMS = [];
  L.courses.forEach(function (c) {
    c.sections.forEach(function (s) {
      s.items.forEach(function (i) {
        i._course = c.id; i._courseName = c.name; i._section = s.name;
        i._n = ITEMS.length; ITEMS.push(i);
      });
    });
  });
  var byPath = {};
  ITEMS.forEach(function (i) { byPath[i.path] = i; });

  /* ---- state ---- */
  var KEY = 'ailib.v1';
  var S = (function () {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  })();
  S.read = S.read || {}; S.theme = S.theme || 'dark';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function readCount() { return Object.keys(S.read).filter(function (k) { return S.read[k]; }).length; }

  var NEEDS = {
    api: ['Cloud API key', 'bad'], net: ['Downloads data', 'bad'],
    service: ['Local service', 'warn'], model: ['Model download', 'warn'],
    ollama: ['Ollama', 'warn']
  };

  /* ---- markdown ---- */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (m, a, u) {
        return '<img alt="' + esc(a) + '" src="' + esc(u) + '">';
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }
  function md(src) {
    if (!src) return '';
    var out = [], lines = String(src).replace(/\r/g, '').split('\n');
    var i = 0, lt = null, lb = [], tb = null, para = [];
    function fp() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function fl() {
      if (lb.length) {
        out.push('<' + lt + '>' + lb.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + lt + '>');
        lb = []; lt = null;
      }
    }
    function ft() {
      if (!tb) return;
      var head = tb[0], rows = tb.slice(1).filter(function (r) { return !/^[\s|:-]+$/.test(r.join('')); });
      out.push('<table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + rows.map(function (r) {
          return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>');
      tb = null;
    }
    function fa() { fp(); fl(); ft(); }
    while (i < lines.length) {
      var ln = lines[i];
      if (/^\s*```/.test(ln)) {
        fa(); var buf = []; i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); continue;
      }
      if (/^\s*\|.*\|\s*$/.test(ln)) {
        fp(); fl(); if (!tb) tb = [];
        tb.push(ln.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }));
        i++; continue;
      } else if (tb) ft();
      var h = ln.match(/^(#{1,6})\s+(.*)$/);
      if (h) { fa(); var lv = Math.min(h[1].length, 4); out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'); i++; continue; }
      if (/^>\s?/.test(ln)) {
        fa(); var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>'); continue;
      }
      if (/^\s*(---+|\*\*\*+)\s*$/.test(ln)) { fa(); out.push('<hr>'); i++; continue; }
      var u = ln.match(/^\s*[-*+]\s+(.*)$/), o = ln.match(/^\s*\d+[.)]\s+(.*)$/);
      if (u || o) {
        fp(); var t = u ? 'ul' : 'ol';
        if (lt && lt !== t) fl();
        lt = t; lb.push((u || o)[1]); i++; continue;
      }
      if (!ln.trim()) { fa(); i++; continue; }
      fl(); para.push(ln.trim()); i++;
    }
    fa();
    return out.join('\n');
  }

  /* ---- notebook renderer ---- */
  function renderNotebook(json) {
    var nb;
    try { nb = JSON.parse(json); } catch (e) { return '<div class="banner">Could not parse this notebook.</div>'; }
    var cells = nb.cells || [];
    var out = [], n = 0;
    cells.forEach(function (c) {
      var src = Array.isArray(c.source) ? c.source.join('') : (c.source || '');
      if (!src.trim()) return;
      if (c.cell_type === 'markdown') {
        out.push('<div class="nbMd">' + md(src) + '</div>');
        return;
      }
      n++;
      var h = '<div class="nbCell"><div class="cellHead"><span>In [' + n + ']</span>' +
        '<span>' + (c.execution_count ? 'executed' : 'not run') + '</span></div>' +
        '<pre><code>' + esc(src) + '</code></pre>';
      var outs = c.outputs || [];
      if (outs.length) {
        outs.forEach(function (o) {
          var txt = '', err = false;
          if (o.output_type === 'stream') txt = (Array.isArray(o.text) ? o.text.join('') : o.text || '');
          else if (o.output_type === 'error') { err = true; txt = (o.traceback || []).join('\n').replace(/\[[0-9;]*m/g, ''); }
          else if (o.data) {
            if (o.data['image/png']) { h += '<div class="nbOut"><img alt="output" src="data:image/png;base64,' + o.data['image/png'] + '"></div>'; return; }
            txt = o.data['text/plain'] ? (Array.isArray(o.data['text/plain']) ? o.data['text/plain'].join('') : o.data['text/plain']) : '';
          }
          if (txt.trim()) h += '<div class="nbOut' + (err ? ' err' : '') + '">' + esc(txt.slice(0, 6000)) + '</div>';
        });
      } else {
        h += '<div class="noOut">' + (c.execution_count
          ? 'Ran, but produced no output — nothing to show offline.'
          : 'Not run before publishing — no stored output.') + '</div>';
      }
      out.push(h + '</div>');
    });
    return out.join('\n');
  }

  /* ---- fetch with a helpful failure ---- */
  var SERVED = location.protocol !== 'file:';
  function load(relPath) {
    return fetch('../' + relPath).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  /* ---- toast ---- */
  var tt;
  function toast(m) {
    var t = $('toast'); t.textContent = m; t.classList.remove('hide');
    clearTimeout(tt); tt = setTimeout(function () { t.classList.add('hide'); }, 2200);
  }

  /* ---- nav ---- */
  var navFilter = 'all';
  function passes(i) {
    if (navFilter === 'all') return true;
    if (navFilter === 'lesson') return i.type === 'lesson';
    if (navFilter === 'notebook') return i.type === 'notebook';
    if (navFilter === 'offline') return i.offline;
    if (navFilter === 'unread') return !S.read[i.path];
    return true;
  }
  function icon(i) { return i.type === 'notebook' ? '❖' : i.type === 'lesson' ? '▤' : '⌗'; }

  function buildNav() {
    var h = '';
    L.courses.forEach(function (c) {
      var secs = c.sections.map(function (s) {
        var items = s.items.filter(passes);
        if (!items.length) return '';
        return '<details class="navSection"' + (items.length <= 14 ? '' : '') + '>' +
          '<summary><span>' + esc(s.name) + '</span><span class="cnt">' + items.length + '</span></summary>' +
          items.map(function (i) {
            return '<div class="navItem" data-path="' + esc(i.path) + '">' +
              '<span class="ic">' + icon(i) + '</span>' +
              '<span class="tx">' + esc(i.title) + '</span>' +
              (S.read[i.path] ? '<span class="tick">✓</span>' : '') + '</div>';
          }).join('') + '</details>';
      }).join('');
      if (secs) h += '<div class="navCourse"><b>' + esc(c.name) + '</b>' + secs + '</div>';
    });
    $('nav').innerHTML = h || '<p class="meta" style="padding:12px">Nothing matches that filter.</p>';
    $$('#nav .navItem').forEach(function (e) {
      e.onclick = function () { go('#item/' + e.dataset.path); };
    });
    var pct = ITEMS.length ? Math.round((readCount() / ITEMS.length) * 100) : 0;
    $('progPct').textContent = pct + '%';
    $('progCount').textContent = readCount() + ' of ' + ITEMS.length + ' read';
    var r = 16, cc = 2 * Math.PI * r;
    $('ringWrap').innerHTML = '<svg width="42" height="42" viewBox="0 0 42 42">' +
      '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="4"/>' +
      '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="var(--acc)" stroke-width="4" stroke-linecap="round"' +
      ' stroke-dasharray="' + cc + '" stroke-dashoffset="' + (cc * (1 - pct / 100)) + '" transform="rotate(-90 21 21)"/></svg>';
  }

  /* ---- pages ---- */
  var PATH = [
    'llm-zoomcamp/04-evaluation/lessons/11-evaluation-intro.md',
    'llm-zoomcamp/04-evaluation/lessons/12-rag-answers.md',
    'llm-zoomcamp/04-evaluation/lessons/13-llm-as-judge.md',
    'llm-zoomcamp/04-evaluation/lessons/14-agent-evaluation.md',
    'llm-zoomcamp/04-evaluation/code/04-llm-judge.ipynb',
    'llm-zoomcamp/06-best-practices/lessons/02-hybrid-search.md',
    'llm-zoomcamp/06-best-practices/lessons/03-reranking.md',
    'llm-zoomcamp/05-monitoring/lessons/04-metrics.md',
    'llm-zoomcamp/05-monitoring/lessons/08-user-feedback.md'
  ];

  function renderHome() {
    var t = L.totals;
    $('heroSub').textContent = L.courses.length + ' courses · ' + t.lessons +
      ' written lessons · ' + t.notebooks + ' notebooks · ' + t.words.toLocaleString() +
      ' words, all on this disk. Indexed ' + L.generated + '.';
    $('heroStats').innerHTML =
      '<div><b>' + t.lessons + '</b><small>Lessons</small></div>' +
      '<div><b>' + t.notebooks + '</b><small>Notebooks</small></div>' +
      '<div><b>' + ITEMS.filter(function (i) { return i.offline; }).length + '</b><small>Run offline</small></div>' +
      '<div><b>' + readCount() + '</b><small>Read</small></div>';

    $('serveBanner').innerHTML = SERVED
      ? '<div class="banner" style="border-left-color:var(--good);background:color-mix(in srgb,var(--good) 10%,var(--panel));border-color:color-mix(in srgb,var(--good) 35%,var(--line))"><b>Served over HTTP.</b> Files load correctly. Everything here is local — no internet is used.</div>'
      : '<b>Opened directly from disk.</b> Browsers block one local file from reading another, so lesson text will not load. Run <code>./start.sh</code> in the AI Videos folder instead — it serves this page locally and opens it for you. Still fully offline.';
    if (SERVED) $('serveBanner').classList.remove('banner');

    $('pathPromo').innerHTML = (function () {
      var P = window.STUDY_PATH; if (!P) return '';
      var all = 0, done = 0;
      P.stages.forEach(function (st) { st.items.forEach(function (it) {
        if (byPath[it.p]) { all++; if (S.read[it.p]) done++; } }); });
      return '<div class="stage" style="cursor:pointer" data-goto="#path">' +
        '<div class="stageHead"><span class="stageN">◆</span><div class="stageT">' +
        '<b>Companion study path</b><small>' + esc(P.intro.split('. ')[0]) + '.</small></div>' +
        '<span class="stageMeta">' + done + '/' + all + '</span></div>' +
        '<div class="pathBar" style="margin:0"><span style="width:' +
        (all ? (done / all) * 100 : 0) + '%"></span></div></div>';
    })();
    $$('#pathPromo [data-goto]').forEach(function (e) { e.onclick = function () { go('#path'); }; });

    $('courseGrid').innerHTML = L.courses.map(function (c) {
      return '<div class="courseCard" data-course="' + c.id + '">' +
        '<div class="org">' + esc(c.org) + '</div><h3>' + esc(c.name) + '</h3>' +
        '<p>' + esc(c.blurb) + '</p><div class="row">' +
        '<span>' + c.counts.sections + ' sections</span>' +
        '<span>' + c.counts.items + ' items</span>' +
        '<span>' + Math.round(c.counts.words / 1000) + 'k words</span></div>' +
        '<div class="lic">Licence: ' + esc(c.licence) + '</div></div>';
    }).join('');
    $$('[data-course]').forEach(function (e) {
      e.onclick = function () { go('#course/' + e.dataset.course); };
    });

    $('pathList').innerHTML = PATH.map(function (p, n) {
      var i = byPath[p];
      if (!i) return '';
      return '<div class="itemRow" data-path="' + esc(p) + '">' +
        '<span class="ic">' + (n + 1) + '</span>' +
        '<span class="tx"><b>' + esc(i.title) + '</b><small>' + esc(i.path) + '</small></span>' +
        '<span class="w">' + i.words + 'w</span>' +
        (S.read[p] ? '<span class="tick">✓</span>' : '') + '</div>';
    }).join('');

    var nbs = ITEMS.filter(function (i) { return i.type === 'notebook'; });
    var groups = [
      ['Fully offline', nbs.filter(function (n) { return !n.needs.length; }), 'ok'],
      ['Needs a local service (Docker)', nbs.filter(function (n) { return n.needs.indexOf('service') >= 0 && n.needs.indexOf('api') < 0; }), 'warn'],
      ['Needs a model download (do before travel)', nbs.filter(function (n) { return n.needs.indexOf('model') >= 0 && n.needs.indexOf('api') < 0; }), 'warn'],
      ['Needs a cloud API key', nbs.filter(function (n) { return n.needs.indexOf('api') >= 0; }), 'bad']
    ];
    $('readiness').innerHTML = '<table class="rt"><tr><th>Category</th><th>Notebooks</th><th>What it means</th></tr>' +
      groups.map(function (g) {
        return '<tr><td><span class="pill ' + g[2] + '">' + esc(g[0]) + '</span></td>' +
          '<td><b>' + g[1].length + '</b></td><td>' +
          (g[2] === 'ok' ? 'Runs on a plane with no changes.'
            : g[2] === 'warn' ? 'Start the service or pull the model while you still have a connection.'
              : 'Read-only offline. The code and any cached outputs are still there.') + '</td></tr>';
      }).join('') + '</table>' +
      '<p class="meta" style="margin-top:10px">Cached outputs let you read results without running: <b>' +
      nbs.filter(function (n) { return n.cached; }).length + '</b> of ' + nbs.length +
      ' notebooks were saved with their outputs intact.</p>';

    $('cacheList').innerHTML = L.cache.length
      ? '<table class="rt"><tr><th>File</th><th>Size</th></tr>' + L.cache.map(function (f) {
          return '<tr><td><code>_offline-cache/' + esc(f.name) + '</code></td><td>' +
            (f.size > 1e6 ? (f.size / 1e6).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB') + '</td></tr>';
        }).join('') + '</table>'
      : '<p class="lead">No cached datasets.</p>';

    $$('#pathList [data-path]').forEach(function (e) {
      e.onclick = function () { go('#item/' + e.dataset.path); };
    });
  }

  function renderCourse(id) {
    var c = L.courses.filter(function (x) { return x.id === id; })[0];
    if (!c) return go('#home');
    $('courseMeta').textContent = c.org + ' · ' + c.counts.items + ' items · licence: ' + c.licence;
    $('courseBody').innerHTML = '<label>' + esc(c.org.toUpperCase()) + '</label><h1>' + esc(c.name) + '</h1>' +
      '<p class="lead">' + esc(c.blurb) + '</p>' +
      '<p class="meta" style="margin:10px 0 22px">Source: <a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.url) + '</a></p>' +
      c.sections.map(function (s) {
        return '<div class="secBlock"><div class="secHead"><h3>' + esc(s.name) + '</h3>' +
          '<span class="meta">' + s.items.length + ' items</span></div>' +
          s.items.map(function (i) {
            var badge = i.needs.length
              ? '<span class="pill ' + (i.needs.indexOf('api') >= 0 ? 'bad' : 'warn') + '">' +
                (NEEDS[i.needs[0]] ? NEEDS[i.needs[0]][0] : i.needs[0]) + '</span>'
              : (i.type === 'notebook' ? '<span class="pill ok">offline</span>' : '');
            return '<div class="itemRow" data-path="' + esc(i.path) + '">' +
              '<span class="ic">' + icon(i) + '</span>' +
              '<span class="tx"><b>' + esc(i.title) + '</b><small>' + esc(i.path.replace(c.id + '/', '')) + '</small></span>' +
              badge + '<span class="w">' + i.words + 'w</span>' +
              (S.read[i.path] ? '<span class="tick">✓</span>' : '') + '</div>';
          }).join('') + '</div>';
      }).join('');
    $$('#courseBody [data-path]').forEach(function (e) {
      e.onclick = function () { go('#item/' + e.dataset.path); };
    });
  }

  var lastList = null;
  function renderItem(p) {
    var i = byPath[p];
    if (!i) return go('#home');
    $('itemMeta').textContent = i._courseName + ' · ' + i._section + ' · ' + i.words + ' words';
    $('doneBtn').textContent = S.read[p] ? '✓ Read' : 'Mark read';
    $('doneBtn').onclick = function () {
      S.read[p] = !S.read[p]; save(); buildNav();
      $('doneBtn').textContent = S.read[p] ? '✓ Read' : 'Mark read';
    };
    var badges = ['<span class="pill">' + i.type + '</span>',
      '<span class="pill">' + esc(i.path) + '</span>'];
    if (i.type === 'notebook') {
      var cc = i.cachedCells || 0, tot = i.codeCells || 0;
      badges.push(cc === 0
        ? '<span class="pill warn">no stored outputs — code only</span>'
        : '<span class="pill ' + (cc === tot ? 'ok' : 'warn') + '">' + cc + ' of ' + tot +
          ' code cells have stored output</span>');
      if (!i.needs.length) badges.push('<span class="pill ok">runs offline</span>');
      i.needs.forEach(function (n) {
        var d = NEEDS[n] || [n, 'warn'];
        badges.push('<span class="pill ' + d[1] + '">' + d[0] + '</span>');
      });
    }
    if (i.video) badges.push('<span class="pill">has a video on YouTube</span>');
    $('itemBadges').innerHTML = badges.join('');

    $('itemBody').innerHTML = '<p class="meta">Loading ' + esc(i.path) + ' …</p>';
    load(i.path).then(function (txt) {
      $('itemBody').innerHTML = i.type === 'notebook' ? renderNotebook(txt) : md(txt);
    }).catch(function (e) {
      $('itemBody').innerHTML = '<div class="banner">' +
        (SERVED
          ? '<b>Could not load this file.</b> ' + esc(e.message) + '<br>The index may be stale — re-run <code>node build-index.js</code>.'
          : '<b>Cannot read local files when opened directly.</b> Browsers block <code>file://</code> pages from reading other files. Close this tab and run <code>./start.sh</code> from the AI Videos folder — it serves the library locally and opens it. No internet involved.') +
        '</div>';
    });

    var list = lastList && lastList.indexOf(p) >= 0 ? lastList : ITEMS.map(function (x) { return x.path; });
    var idx = list.indexOf(p);
    var prev = list[idx - 1], next = list[idx + 1];
    $('prevBtn').style.visibility = prev ? '' : 'hidden';
    $('nextBtn').style.visibility = next ? '' : 'hidden';
    if (prev) { $('prevBtn').textContent = '← ' + (byPath[prev] ? byPath[prev].title : 'Previous').slice(0, 42); $('prevBtn').onclick = function () { go('#item/' + prev); }; }
    if (next) { $('nextBtn').textContent = (byPath[next] ? byPath[next].title : 'Next').slice(0, 42) + ' →'; $('nextBtn').onclick = function () { go('#item/' + next); }; }
    $('backBtn').onclick = function () { go('#course/' + i._course); };
    $$('#nav .navItem').forEach(function (e) { e.classList.toggle('active', e.dataset.path === p); });
    var open = $$('#nav .navItem.active')[0];
    if (open && open.closest('details')) open.closest('details').open = true;
  }


  /* ---- companion study path ---- */
  function renderPath() {
    var P = window.STUDY_PATH;
    if (!P) { $('pathBody').innerHTML = '<div class="banner">curriculum.js did not load.</div>'; return; }

    var all = 0, done = 0, missing = [];
    P.stages.forEach(function (st) {
      st.items.forEach(function (it) {
        if (!byPath[it.p]) { missing.push(it.p); return; }
        all++; if (S.read[it.p]) done++;
      });
    });
    $('pathMeta').textContent = done + ' of ' + all + ' completed';

    var h = '<label>COMPANION STUDY PATH</label><h1>' + esc(P.name) + '</h1>' +
      '<p class="lead">' + esc(P.intro) + '</p>' +
      '<p class="meta" style="margin:10px 0 20px">The academy: <a href="' + esc(P.academyUrl) +
      '" target="_blank" rel="noopener">' + esc(P.academyUrl) + '</a></p>';

    if (missing.length) {
      h += '<div class="banner"><b>' + missing.length + ' mapped file' + (missing.length > 1 ? 's have' : ' has') +
        ' moved</b> since the path was written — these repos restructure. Missing: ' +
        missing.map(function (m) { return '<code>' + esc(m) + '</code>'; }).join(', ') +
        '. Everything else still works.</div>';
    }

    h += '<div class="pathBar"><span style="width:' + (all ? (done / all) * 100 : 0) + '%"></span></div>';

    P.stages.forEach(function (st) {
      var items = st.items.filter(function (it) { return byPath[it.p]; });
      var sDone = items.filter(function (it) { return S.read[it.p]; }).length;
      var words = items.reduce(function (n, it) { return n + byPath[it.p].words; }, 0);
      h += '<div class="stage' + (sDone === items.length && items.length ? ' complete' : '') + '">' +
        '<div class="stageHead">' +
        '<span class="stageN">' + st.n + '</span>' +
        '<div class="stageT"><b>' + esc(st.academy) + '</b>' +
        '<small>' + esc(st.goal) + '</small></div>' +
        '<span class="stageMeta">' + sDone + '/' + items.length + ' · ' +
        Math.round(words / 250) + ' min</span></div>' +
        (st.priority ? '<div class="stageFlag good">Highest value in the path</div>' : '') +
        (st.sparse ? '<div class="stageFlag warn">Thin external coverage — the academy carries this one</div>' : '') +
        '<a class="stageLink" href="' + esc(P.academyUrl) + esc(st.academyHash) +
        '" target="_blank" rel="noopener">Read academy module ' + st.n + ' first →</a>' +
        items.map(function (it) {
          var i = byPath[it.p];
          return '<div class="pathItem" data-path="' + esc(it.p) + '">' +
            '<span class="ic">' + icon(i) + '</span>' +
            '<span class="tx"><b>' + esc(i.title) + '</b><small>' + esc(it.why) + '</small></span>' +
            (i.needs && i.needs.length
              ? '<span class="pill ' + (i.needs.indexOf('api') >= 0 ? 'bad' : 'warn') + '">' +
                (NEEDS[i.needs[0]] ? NEEDS[i.needs[0]][0] : i.needs[0]) + '</span>' : '') +
            '<span class="w">' + i.words + 'w</span>' +
            (S.read[it.p] ? '<span class="tick">✓</span>' : '') + '</div>';
        }).join('') + '</div>';
    });

    $('pathBody').innerHTML = h;
    $$('#pathBody [data-path]').forEach(function (e) {
      lastList = null;
      e.onclick = function () { go('#item/' + e.dataset.path); };
    });
  }

  /* ---- palette ---- */
  var pRows = [], pSel = 0;
  function openPal() { $('palette').classList.remove('hide'); $('paletteInput').value = ''; $('paletteInput').focus(); search(''); }
  function closePal() { $('palette').classList.add('hide'); }
  function search(q) {
    q = q.trim().toLowerCase();
    pRows = (q
      ? ITEMS.filter(function (i) {
          return (i.title + ' ' + i.path + ' ' + i.headings.join(' ')).toLowerCase().indexOf(q) >= 0;
        })
      : ITEMS.slice(0, 14)).slice(0, 60);
    pSel = 0;
    $('paletteResults').innerHTML = pRows.length ? pRows.map(function (r, n) {
      return '<div class="pRes' + (n === 0 ? ' sel' : '') + '" data-i="' + n + '">' +
        '<span class="pType">' + r.type + '</span><span class="pTxt"><b>' + esc(r.title) +
        '</b> <span class="meta">' + esc(r._courseName + ' · ' + r._section) + '</span></span></div>';
    }).join('') : '<div class="pRes"><span class="pTxt meta">No matches</span></div>';
    $$('#paletteResults [data-i]').forEach(function (e) {
      e.onclick = function () { closePal(); go('#item/' + pRows[+e.dataset.i].path); };
    });
  }
  function move(d) {
    if (!pRows.length) return;
    pSel = (pSel + d + pRows.length) % pRows.length;
    $$('.pRes').forEach(function (e, n) { e.classList.toggle('sel', n === pSel); });
    var el = $$('.pRes')[pSel]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  /* ---- router ---- */
  function show(p) {
    ['home', 'path', 'course', 'item'].forEach(function (x) { $('page-' + x).classList.toggle('hide', x !== p); });
    window.scrollTo(0, 0);
  }
  function route() {
    var h = location.hash.replace(/^#/, '') || 'home';
    var slash = h.indexOf('/');
    var page = slash < 0 ? h : h.slice(0, slash);
    var arg = slash < 0 ? '' : h.slice(slash + 1);
    if (page === 'path') { show('path'); renderPath(); }
    else if (page === 'course') { show('course'); renderCourse(arg); }
    else if (page === 'item') { show('item'); renderItem(arg); }
    else { show('home'); renderHome(); }
    if (window.innerWidth < 1180) { $('drawer').classList.remove('open'); $('scrim').classList.remove('on'); }
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  /* ---- boot ---- */
  document.documentElement.setAttribute('data-theme', S.theme);
  buildNav();
  $('menuBtn').onclick = function () {
    var o = $('drawer').classList.toggle('open'); $('scrim').classList.toggle('on', o);
  };
  $('drawerClose').onclick = $('scrim').onclick = function () {
    $('drawer').classList.remove('open'); $('scrim').classList.remove('on');
  };
  $('themeBtn').onclick = function () {
    S.theme = S.theme === 'dark' ? 'light' : 'dark'; save();
    document.documentElement.setAttribute('data-theme', S.theme);
  };
  $('searchBtn').onclick = openPal;
  $('paletteInput').oninput = function () { search(this.value); };
  $('palette').onclick = function (e) { if (e.target.id === 'palette') closePal(); };
  $$('[data-nf]').forEach(function (b) {
    b.onclick = function () {
      navFilter = b.dataset.nf;
      $$('[data-nf]').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); buildNav();
    };
  });
  $$('[data-goto]').forEach(function (b) { b.onclick = function () { go(b.dataset.goto); }; });
  document.addEventListener('keydown', function (e) {
    var t = (e.target.tagName || '').toLowerCase();
    if (!$('palette').classList.contains('hide')) {
      if (e.key === 'Escape') { closePal(); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { move(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { move(-1); e.preventDefault(); }
      else if (e.key === 'Enter' && pRows[pSel]) { closePal(); go('#item/' + pRows[pSel].path); e.preventDefault(); }
      return;
    }
    if (t === 'input' || t === 'textarea') return;
    if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { openPal(); e.preventDefault(); }
    if (e.key === 'j' && !$('page-item').classList.contains('hide')) $('nextBtn').click();
    if (e.key === 'k' && !$('page-item').classList.contains('hide')) $('prevBtn').click();
  });
  window.addEventListener('hashchange', route);
  route();
})();
