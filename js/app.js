/* ============================================================
   app.js — router, markdown renderer, progress, page renderers.
   Everything is static: no network, no build step, no server.
   ============================================================ */
(function (global) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------------- data assembly ---------------- */
  var MODULES = [].concat(global.CURRICULUM_A || [], global.CURRICULUM_B || [], global.CURRICULUM_C || []);
  var LESSONS = [];
  MODULES.forEach(function (m, mi) {
    m.lessons.forEach(function (l, li) {
      l._m = mi; l._i = li; l._module = m.title; l._slug = m.slug;
      l._n = LESSONS.length + 1;
      LESSONS.push(l);
    });
  });
  var TOTAL_MINS = LESSONS.reduce(function (n, l) { return n + l.mins; }, 0);

  /* ---------------- persistence ---------------- */
  var KEY = 'aisa.v1';
  var S = load();
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* private mode or disabled storage */ }
    return { done: {}, marks: {}, answers: {}, streak: 0, last: null, theme: 'dark', mode: 25 };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function touchStreak() {
    var t = today();
    if (S.last === t) return;
    var y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    S.streak = (S.last === y) ? (S.streak || 0) + 1 : 1;
    S.last = t; save();
  }

  function doneCount() { return Object.keys(S.done).filter(function (k) { return S.done[k]; }).length; }
  function doneMins() {
    return LESSONS.reduce(function (n, l) { return n + (S.done[l.id] ? l.mins : 0); }, 0);
  }

  /* ---------------- markdown subset ---------------- */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function md(src) {
    if (!src) return '';
    var out = [], lines = String(src).replace(/\r/g, '').split('\n');
    var i = 0, listType = null, listBuf = [], tableBuf = null, para = [];

    function flushPara() {
      if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    }
    function flushList() {
      if (listBuf.length) {
        out.push('<' + listType + '>' + listBuf.map(function (x) {
          return '<li>' + inline(x) + '</li>';
        }).join('') + '</' + listType + '>');
        listBuf = []; listType = null;
      }
    }
    function flushTable() {
      if (!tableBuf) return;
      var head = tableBuf[0], rows = tableBuf.slice(1).filter(function (r) {
        return !/^[\s|:-]+$/.test(r.join(''));
      });
      out.push('<table><thead><tr>' + head.map(function (c) {
        return '<th>' + inline(c) + '</th>';
      }).join('') + '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>');
      tableBuf = null;
    }
    function flushAll() { flushPara(); flushList(); flushTable(); }

    while (i < lines.length) {
      var ln = lines[i];

      /* fenced code */
      if (/^```/.test(ln)) {
        flushAll();
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      /* diagram token */
      var dm = ln.match(/^\{\{diagram:([a-z0-9-]+)\}\}$/i);
      if (dm) {
        flushAll();
        out.push(global.DIAGRAMS ? DIAGRAMS.figure(dm[1]) : '');
        i++; continue;
      }

      /* callout token */
      var cm = ln.match(/^\{\{callout:([a-z]*)\|([\s\S]*)\}\}$/i);
      if (cm) {
        flushAll();
        out.push('<div class="callout ' + cm[1] + '">' + inline(cm[2]) + '</div>');
        i++; continue;
      }

      /* table */
      if (/^\s*\|.*\|\s*$/.test(ln)) {
        flushPara(); flushList();
        if (!tableBuf) tableBuf = [];
        tableBuf.push(ln.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }));
        i++; continue;
      } else if (tableBuf) { flushTable(); }

      /* heading */
      var hm = ln.match(/^(#{2,4})\s+(.*)$/);
      if (hm) {
        flushAll();
        var lvl = hm[1].length;
        out.push('<h' + lvl + '>' + inline(hm[2]) + '</h' + lvl + '>');
        i++; continue;
      }

      /* blockquote */
      if (/^>\s?/.test(ln)) {
        flushAll();
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
        continue;
      }

      /* hr */
      if (/^---+$/.test(ln.trim())) { flushAll(); out.push('<hr>'); i++; continue; }

      /* lists */
      var um = ln.match(/^\s*[-*]\s+(.*)$/);
      var om = ln.match(/^\s*\d+\.\s+(.*)$/);
      if (um || om) {
        flushPara();
        var t = um ? 'ul' : 'ol';
        if (listType && listType !== t) flushList();
        listType = t;
        listBuf.push((um || om)[1]);
        i++; continue;
      }

      /* blank */
      if (!ln.trim()) { flushAll(); i++; continue; }

      flushList();
      para.push(ln.trim());
      i++;
    }
    flushAll();
    return out.join('\n');
  }

  /* ---------------- toast ---------------- */
  var toastT;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.classList.remove('hide');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.add('hide'); }, 2200);
  }

  /* ---------------- nav drawer ---------------- */
  function buildNav() {
    var h = '<div class="navGroup"><b>Overview</b>' +
      ['#home|Home', '#learn|All lessons', '#context|Context engineering',
        '#cases|Case studies', '#labs|Interactive labs', '#workshop|Decision workshop',
        '#reference|Reference library', '#library|Companion library', '#progress|My progress'].map(function (x) {
          var p = x.split('|');
          return '<a href="' + p[0] + '">' + p[1] + '</a>';
        }).join('') + '</div>';
    MODULES.forEach(function (m) {
      h += '<div class="navGroup"><b>' + esc(m.title) + '</b>' +
        m.lessons.map(function (l) {
          return '<a href="#lesson/' + l.id + '"><span>' + esc(l.title) + '</span>' +
            (S.done[l.id] ? '<span class="tick">✓</span>' : '') + '</a>';
        }).join('') + '</div>';
    });
    $('nav').innerHTML = h;
  }

  function setDrawer(open) {
    $('drawer').classList.toggle('open', open);
    $('scrim').classList.toggle('on', open);
  }

  /* ---------------- stats ---------------- */
  function refreshStats() {
    var d = doneCount(), pct = LESSONS.length ? Math.round((d / LESSONS.length) * 100) : 0;
    var m = doneMins();
    if ($('statPct')) $('statPct').textContent = pct + '%';
    if ($('statDone')) $('statDone').textContent = d + '/' + LESSONS.length;
    if ($('statMins')) $('statMins').textContent = (m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm');
    if ($('statStreak')) $('statStreak').textContent = S.streak || 0;
    $('drawerPct').textContent = pct + '%';
    $('drawerDone').textContent = d + ' of ' + LESSONS.length + ' lessons';
    $('ringWrap').innerHTML = ring(pct);
  }
  function ring(pct) {
    var r = 17, c = 2 * Math.PI * r;
    return '<svg width="44" height="44" viewBox="0 0 44 44">' +
      '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="4"/>' +
      '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="var(--acc)" stroke-width="4" ' +
      'stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct / 100)) +
      '" transform="rotate(-90 22 22)"/></svg>';
  }

  /* ---------------- home ---------------- */
  var PATHS = [
    { t: 'I am new to LLM engineering', d: 'Start with the mental models, then prompting, then build one small thing end to end.',
      steps: ['what-llm', 'tokens', 'context-window', 'prompt-anatomy', 'structured-output', 'eval-why'] },
    { t: 'My assistant degrades on long tasks', d: 'The context engineering track, in order. This is the most common production complaint.',
      steps: ['ce-intro', 'ce-budget', 'ce-rot', 'ce-compaction', 'ce-jit', 'ce-caching'] },
    { t: 'My RAG answers are wrong', d: 'Debug retrieval before you debug the prompt. Recall is the ceiling on everything else.',
      steps: ['rag-basics', 'chunking', 'hybrid-search', 'reranking', 'rag-eval', 'ce-rot'] },
    { t: 'I am building an agent', d: 'Tool design, loop guards, and the honest comparison against a workflow you could write instead.',
      steps: ['workflow-vs-agent', 'tool-design', 'agent-loop', 'error-recovery', 'human-in-loop', 'ce-subagents'] },
    { t: 'It works but I cannot afford it', d: 'Caching, routing, context reduction and the abuse tail — in impact order.',
      steps: ['ce-caching', 'model-routing', 'cost', 'abuse', 'ce-tools', 'latency'] },
    { t: 'I need to make it safe to ship', d: 'Injection, guardrails, evaluation and rollout discipline.',
      steps: ['security-injection', 'system-prompt', 'eval-why', 'llm-judge', 'tracing', 'deploy'] }
  ];

  function renderHome() {
    $('heroArt').innerHTML = DIAGRAMS.render('hero');
    $('qlLearn').textContent = (MODULES[0].lessons.length + MODULES[1].lessons.length) + ' lessons';
    $('qlContext').textContent = MODULES[2].lessons.length + ' lessons + ' + (global.PATTERNS || []).length + ' patterns';
    $('qlCases').textContent = CASES.all().length + ' case studies';
    $('qlLabs').textContent = (global.LABS || []).length + ' labs';

    var next = LESSONS.filter(function (l) { return !S.done[l.id]; })[0] || LESSONS[0];
    $('nextTitle').textContent = next.title;
    $('nextDesc').textContent = next.summary;

    $('pathGrid').innerHTML = PATHS.map(function (p, i) {
      return '<div class="pathCard" data-path="' + i + '"><b>' + esc(p.t) + '</b>' +
        '<small>' + esc(p.d) + '</small>' +
        '<div class="pathSteps">' + p.steps.length + ' lessons · ' +
        p.steps.reduce(function (n, id) {
          var l = LESSONS.filter(function (x) { return x.id === id; })[0];
          return n + (l ? l.mins : 0);
        }, 0) + ' min</div></div>';
    }).join('');

    $$('[data-path]').forEach(function (e) {
      e.onclick = function () {
        var p = PATHS[+e.dataset.path];
        go('#lesson/' + p.steps[0]);
        toast('Path: ' + p.t);
      };
    });
    $$('#modeBtns button').forEach(function (b) {
      b.classList.toggle('active', +b.dataset.mode === S.mode);
      b.onclick = function () {
        S.mode = +b.dataset.mode; save();
        $$('#modeBtns button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
      };
    });
    $('startSession').onclick = function () { planSession(); };
    $('continueBtn').onclick = function () { go('#lesson/' + next.id); };
    refreshStats();
    var cc = $('ccGo');
    if (cc) cc.textContent = (location.protocol === 'file:') ? 'How to run it →' : 'Open →';
  }


  function planSession() {
    var budget = S.mode, picked = [], used = 0;
    LESSONS.forEach(function (l) {
      if (S.done[l.id]) return;
      if (used + l.mins <= budget) { picked.push(l); used += l.mins; }
    });
    if (!picked.length) picked = [LESSONS[0]];
    toast(picked.length + ' lesson' + (picked.length > 1 ? 's' : '') + ' · ' + used + ' min planned');
    go('#lesson/' + picked[0].id);
  }

  /* ---------------- curriculum ---------------- */
  var curFilter = { q: '', level: 'all' };
  function renderLearn() {
    var q = curFilter.q.toLowerCase();
    var html = MODULES.map(function (m) {
      var ls = m.lessons.filter(function (l) {
        if (curFilter.level === 'unread' && S.done[l.id]) return false;
        if (curFilter.level !== 'all' && curFilter.level !== 'unread' && l.level !== curFilter.level) return false;
        if (!q) return true;
        return (l.title + ' ' + l.summary + ' ' + l.body + ' ' +
          l.keyPoints.join(' ')).toLowerCase().indexOf(q) >= 0;
      });
      if (!ls.length) return '';
      var mins = ls.reduce(function (n, l) { return n + l.mins; }, 0);
      return '<div class="module"><div class="moduleHead"><h2>' + esc(m.title) + '</h2>' +
        '<span class="mCount">' + ls.length + ' lessons · ' + mins + ' min</span>' +
        '<p>' + esc(m.desc) + '</p></div>' +
        ls.map(function (l) {
          return '<div class="lessonRow" data-lesson="' + l.id + '">' +
            '<span class="num">' + String(l._n).padStart(2, '0') + '</span>' +
            '<span class="lTitle"><b>' + esc(l.title) + '</b><small>' + esc(l.summary) + '</small></span>' +
            '<span class="lvl ' + l.level + '">' + l.level + '</span>' +
            '<span class="mins">' + l.mins + 'm</span>' +
            '<span class="tick">' + (S.done[l.id] ? '✓' : '') + '</span></div>';
        }).join('') + '</div>';
    }).join('');
    $('modules').innerHTML = html || '<p class="lead">No lessons match that filter.</p>';
    $$('[data-lesson]').forEach(function (e) {
      e.onclick = function () { go('#lesson/' + e.dataset.lesson); };
    });
  }

  /* ---------------- lesson reader ---------------- */
  function renderLesson(id) {
    var l = LESSONS.filter(function (x) { return x.id === id; })[0];
    if (!l) { go('#learn'); return; }
    $('lessonMeta').textContent = l._module + ' · lesson ' + l._n + ' of ' + LESSONS.length +
      ' · ' + l.mins + ' min · ' + l.level;
    $('lessonBody').innerHTML =
      '<label>' + esc(l._module.toUpperCase()) + '</label>' +
      '<h1>' + esc(l.title) + '</h1>' +
      '<p class="lead">' + esc(l.summary) + '</p>' +
      md(l.body);

    var x = '';
    if (l.keyPoints && l.keyPoints.length) {
      x += '<div class="callout good"><b>Key points</b><ul style="margin:8px 0 0;padding-left:1.1em">' +
        l.keyPoints.map(function (k) { return '<li>' + inline(k) + '</li>'; }).join('') + '</ul></div>';
    }
    if (l.pitfalls && l.pitfalls.length) {
      x += '<h2>Common pitfalls</h2><div class="failList">' +
        l.pitfalls.map(function (p) {
          return '<div class="failRow"><b>' + esc(p.t) + '</b><small>' + esc(p.d) + '</small></div>';
        }).join('') + '</div>';
    }
    if (l.quiz && l.quiz.length) {
      x += '<h2>Check yourself</h2>' + l.quiz.map(function (q, qi) {
        return '<div class="quizCard" data-lq="' + qi + '"><div class="quizQ">' + esc(q.q) + '</div>' +
          q.options.map(function (o, oi) {
            return '<div class="choice" data-loi="' + oi + '">' + esc(o.t) + '</div>';
          }).join('') + '<div class="explain hide"></div></div>';
      }).join('');
    }
    if (l.lab) {
      x += '<h2>Lab · ' + esc(l.lab.title) + '</h2><div class="panel"><ol style="margin:0;padding-left:1.2em">' +
        l.lab.steps.map(function (s) { return '<li>' + inline(s) + '</li>'; }).join('') + '</ol></div>';
    }
    if (l.refs && l.refs.length) {
      x += '<h2>Sources</h2><div class="srcList">' + l.refs.map(function (r) {
        return '<div class="srcItem"><b>' + esc(r[0]) + '</b>' +
          '<a href="' + esc(r[1]) + '" target="_blank" rel="noopener">' + esc(r[1]) + '</a></div>';
      }).join('') + '</div>';
    }
    $('lessonExtras').innerHTML = x;

    /* quiz wiring */
    $$('[data-lq]').forEach(function (card) {
      var q = l.quiz[+card.dataset.lq];
      card.querySelectorAll('.choice').forEach(function (ch) {
        ch.onclick = function () {
          if (card.dataset.done) return;
          card.dataset.done = '1';
          var o = q.options[+ch.dataset.loi];
          card.querySelectorAll('.choice').forEach(function (e2) {
            var eo = q.options[+e2.dataset.loi];
            if (eo.ok) e2.classList.add('correct');
            else if (e2 === ch) e2.classList.add('wrong');
            else e2.classList.add('dim');
          });
          var ex = card.querySelector('.explain');
          ex.classList.remove('hide');
          ex.innerHTML = '<b>' + (o.ok ? '✓ Correct.' : '✗ Not quite.') + '</b> ' + esc(o.why) +
            (o.ok ? '' : '<br><br><b>The better answer:</b> ' +
              esc(q.options.filter(function (z) { return z.ok; })[0].why));
          recordAnswer('lesson:' + l.id, o.ok);
        };
      });
    });

    /* actions */
    $('bookmarkBtn').textContent = S.marks[l.id] ? '★' : '☆';
    $('bookmarkBtn').onclick = function () {
      S.marks[l.id] = !S.marks[l.id]; save();
      $('bookmarkBtn').textContent = S.marks[l.id] ? '★' : '☆';
      toast(S.marks[l.id] ? 'Bookmarked' : 'Bookmark removed');
    };
    $('completeBtn').textContent = S.done[l.id] ? '✓ Completed' : 'Mark complete';
    $('completeBtn').onclick = function () {
      S.done[l.id] = !S.done[l.id]; touchStreak(); save();
      $('completeBtn').textContent = S.done[l.id] ? '✓ Completed' : 'Mark complete';
      buildNav(); refreshStats();
      toast(S.done[l.id] ? 'Marked complete' : 'Marked incomplete');
    };
    $('tutorBtn').onclick = function () {
      var p = 'You are a senior AI systems engineer mentoring me.\n\n' +
        'Topic: ' + l.title + '\nSummary: ' + l.summary + '\n\n' +
        'Key points I just read:\n' + l.keyPoints.map(function (k) { return '- ' + k; }).join('\n') +
        '\n\nMy stack: (describe your stack here).\n\n' +
        'Please:\n1. Ask me two diagnostic questions about how my current system handles this.\n' +
        '2. Point out the most likely mistake I am making, with the evidence you would look for.\n' +
        '3. Give me one concrete change I can make this week, with the code shape.\n' +
        '4. Tell me how I would measure whether it worked.';
      copy(p, 'Tutor prompt copied — paste it into your assistant');
    };
    var speaking = false;
    $('speakBtn').onclick = function () {
      if (!('speechSynthesis' in window)) { toast('Speech not available in this browser'); return; }
      if (speaking) { speechSynthesis.cancel(); speaking = false; $('speakBtn').textContent = '🔊 Read aloud'; return; }
      var text = l.title + '. ' + l.summary + '. ' +
        l.body.replace(/\{\{[^}]+\}\}/g, '').replace(/```[\s\S]*?```/g, ' code example omitted. ')
          .replace(/[#*`|>-]/g, ' ');
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.onend = function () { speaking = false; $('speakBtn').textContent = '🔊 Read aloud'; };
      speechSynthesis.speak(u);
      speaking = true; $('speakBtn').textContent = '⏹ Stop';
    };

    var prev = LESSONS[l._n - 2], next = LESSONS[l._n];
    $('prevBtn').style.visibility = prev ? '' : 'hidden';
    $('nextBtn').style.visibility = next ? '' : 'hidden';
    if (prev) { $('prevBtn').textContent = '← ' + prev.title; $('prevBtn').onclick = function () { go('#lesson/' + prev.id); }; }
    if (next) { $('nextBtn').textContent = next.title + ' →'; $('nextBtn').onclick = function () { go('#lesson/' + next.id); }; }
    touchStreak();
  }

  function copy(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(msg); },
        function () { fallbackCopy(text, msg); });
    } else fallbackCopy(text, msg);
  }
  function fallbackCopy(text, msg) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(msg); } catch (e) { toast('Copy failed'); }
    document.body.removeChild(ta);
  }

  function recordAnswer(scope, ok) {
    S.answers[scope] = S.answers[scope] || { right: 0, total: 0 };
    S.answers[scope].total++;
    if (ok) S.answers[scope].right++;
    save();
  }

  /* ---------------- context hub ---------------- */
  var patFilter = 'all';
  function renderContext() {
    $('ceIntro').innerHTML = [
      ['Select', 'Decide what enters. Retrieval, memory lookup, file selection, tool filtering.'],
      ['Compress', 'Reduce tokens while preserving decision-relevant information. Compaction, extraction, eviction.'],
      ['Isolate', 'Move work into a separate context that returns only its conclusion. Sub-agents, scratch files.'],
      ['Order', 'Arrange for caching and for attention. Stable first, task last, best evidence adjacent.']
    ].map(function (x) {
      return '<div><b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>';
    }).join('');

    /* budget simulator (reuse the labs one) */
    var lab = (global.LABS || []).filter(function (x) { return x.id === 'budget'; })[0];
    if (lab) { $('ceBudget').innerHTML = lab.html(); lab.init(); }

    var ops = ['all', 'select', 'compress', 'isolate', 'order'];
    $('patternFilter').innerHTML = ops.map(function (o) {
      return '<button class="chip' + (o === patFilter ? ' active' : '') + '" data-pf="' + o + '">' +
        (o === 'all' ? 'All ' + (global.PATTERNS || []).length : o) + '</button>';
    }).join('');
    var pats = (global.PATTERNS || []).filter(function (p) {
      return patFilter === 'all' || p.op === patFilter;
    });
    $('patternList').innerHTML = pats.map(function (p) {
      return '<div class="patternCard"><div class="pTop"><h3>' + esc(p.name) + '</h3>' +
        '<span class="pTag">' + p.op + '</span></div>' +
        '<p class="pProb">' + esc(p.problem) + '</p><dl>' +
        '<dt>Mechanism</dt><dd>' + esc(p.mechanism) + '</dd>' +
        '<dt>Cost</dt><dd>' + esc(p.cost) + '</dd>' +
        '<dt>Failure you inherit</dt><dd>' + esc(p.failure) + '</dd>' +
        '<dt>Use when</dt><dd>' + esc(p.use) + '</dd></dl></div>';
    }).join('');
    $$('[data-pf]').forEach(function (b) {
      b.onclick = function () { patFilter = b.dataset.pf; renderContext(); };
    });

    var ce = MODULES.filter(function (m) { return m.slug === 'context'; })[0];
    $('ceLessons').innerHTML = ce.lessons.map(function (l) {
      return '<div class="lessonRow" data-lesson="' + l.id + '">' +
        '<span class="num">' + String(l._n).padStart(2, '0') + '</span>' +
        '<span class="lTitle"><b>' + esc(l.title) + '</b><small>' + esc(l.summary) + '</small></span>' +
        '<span class="mins">' + l.mins + 'm</span>' +
        '<span class="tick">' + (S.done[l.id] ? '✓' : '') + '</span></div>';
    }).join('');
    $$('#ceLessons [data-lesson]').forEach(function (e) {
      e.onclick = function () { go('#lesson/' + e.dataset.lesson); };
    });
  }

  /* ---------------- cases ---------------- */
  var caseFilter = { tag: 'all', q: '' };
  function renderCases() {
    var tags = ['all'].concat(CASES.tags());
    $('caseFilter').innerHTML = tags.map(function (t) {
      return '<button class="chip' + (t === caseFilter.tag ? ' active' : '') + '" data-cf="' + esc(t) + '">' +
        (t === 'all' ? 'All ' + CASES.all().length : esc(t)) + '</button>';
    }).join('');
    var q = caseFilter.q.toLowerCase();
    var list = CASES.all().filter(function (c) {
      if (caseFilter.tag !== 'all' && c.tags.indexOf(caseFilter.tag) < 0) return false;
      if (!q) return true;
      return (c.title + ' ' + c.platform + ' ' + c.brief + ' ' + c.tags.join(' ') + ' ' + c.notes)
        .toLowerCase().indexOf(q) >= 0;
    });
    $('caseGrid').innerHTML = CASES.grid(list);
    $$('[data-cf]').forEach(function (b) {
      b.onclick = function () { caseFilter.tag = b.dataset.cf; renderCases(); };
    });
    $$('[data-case]').forEach(function (e) {
      e.onclick = function () { go('#case/' + e.dataset.case); };
    });
  }

  function renderCase(id) {
    var c = CASES.byId(id);
    if (!c) { go('#cases'); return; }
    $('caseMeta').textContent = 'Case ' + c.num + ' of ' + CASES.all().length + ' · ' + c.platform;
    $('caseBody').innerHTML = CASES.detail(c);
    CASES.wire(c);
    $('caseBookmark').textContent = S.marks['case:' + c.id] ? '★' : '☆';
    $('caseBookmark').onclick = function () {
      S.marks['case:' + c.id] = !S.marks['case:' + c.id]; save();
      $('caseBookmark').textContent = S.marks['case:' + c.id] ? '★' : '☆';
    };
    var all = CASES.all(), idx = all.indexOf(c);
    var prev = all[idx - 1], next = all[idx + 1];
    $('casePrev').style.visibility = prev ? '' : 'hidden';
    $('caseNext').style.visibility = next ? '' : 'hidden';
    if (prev) { $('casePrev').textContent = '← ' + prev.title; $('casePrev').onclick = function () { go('#case/' + prev.id); }; }
    if (next) { $('caseNext').textContent = next.title + ' →'; $('caseNext').onclick = function () { go('#case/' + next.id); }; }
    touchStreak();
  }

  /* ---------------- labs ---------------- */
  var activeLab = null;
  function renderLabs(which) {
    var labs = global.LABS || [];
    activeLab = which || activeLab || labs[0].id;
    $('labTabs').innerHTML = labs.map(function (l) {
      return '<button class="labTab' + (l.id === activeLab ? ' active' : '') + '" data-lab="' + l.id + '">' +
        esc(l.name) + '</button>';
    }).join('');
    var lab = labs.filter(function (l) { return l.id === activeLab; })[0];
    $('labStage').innerHTML = '<div class="simCard"><h2>' + esc(lab.title) + '</h2>' +
      '<p>' + esc(lab.desc) + '</p>' + lab.html() + '</div>';
    try { lab.init(); } catch (e) { console.warn('lab init', lab.id, e); }
    $$('[data-lab]').forEach(function (b) {
      b.onclick = function () { renderLabs(b.dataset.lab); };
    });
    touchStreak();
  }

  /* ---------------- workshop ---------------- */
  var wFilter = 'all';
  function renderWorkshop() {
    var W = global.WORKSHOP || [];
    var cats = ['all'].concat(W.map(function (w) { return w.cat; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }));
    $('workshopFilter').innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === wFilter ? ' active' : '') + '" data-wf="' + esc(c) + '">' +
        (c === 'all' ? 'All ' + W.length : esc(c)) + '</button>';
    }).join('');
    var list = W.filter(function (w) { return wFilter === 'all' || w.cat === wFilter; });
    $('workshopList').innerHTML = list.map(function (w) {
      var gi = W.indexOf(w);
      return '<div class="quizCard" data-wq="' + gi + '">' +
        '<span class="pill">' + esc(w.cat) + '</span>' +
        '<div class="quizQ" style="margin-top:8px">' + esc(w.q) + '</div>' +
        w.o.map(function (o, oi) {
          return '<div class="choice" data-woi="' + oi + '">' + esc(o.t) + '</div>';
        }).join('') + '<div class="explain hide"></div></div>';
    }).join('');
    $$('[data-wf]').forEach(function (b) {
      b.onclick = function () { wFilter = b.dataset.wf; renderWorkshop(); };
    });
    $$('[data-wq]').forEach(function (card) {
      var w = W[+card.dataset.wq];
      card.querySelectorAll('.choice').forEach(function (ch) {
        ch.onclick = function () {
          if (card.dataset.done) return;
          card.dataset.done = '1';
          var o = w.o[+ch.dataset.woi];
          card.querySelectorAll('.choice').forEach(function (e2) {
            var eo = w.o[+e2.dataset.woi];
            if (eo.ok) e2.classList.add('correct');
            else if (e2 === ch) e2.classList.add('wrong');
            else e2.classList.add('dim');
          });
          var ex = card.querySelector('.explain');
          ex.classList.remove('hide');
          ex.innerHTML = '<b>' + (o.ok ? '✓ Correct.' : '✗ Not quite.') + '</b> ' + esc(o.why) +
            (o.ok ? '' : '<br><br><b>The better answer:</b> ' +
              esc(w.o.filter(function (z) { return z.ok; })[0].why));
          recordAnswer('workshop', o.ok);
          workshopScore();
        };
      });
    });
    workshopScore();
  }
  function workshopScore() {
    var a = S.answers.workshop || { right: 0, total: 0 };
    $('workshopScore').innerHTML = a.total
      ? '<b>' + a.right + ' / ' + a.total + '</b><span class="meta">answered correctly (' +
      Math.round((a.right / a.total) * 100) + '%). Wrong answers are the useful ones — read why the plausible option fails.</span>'
      : '<span class="meta">Answer a question to start scoring.</span>';
  }

  /* ---------------- reference ---------------- */
  var refTab = 'glossary', refQ = '';
  function renderReference() {
    $$('[data-ref]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.ref === refTab);
      b.onclick = function () { refTab = b.dataset.ref; renderReference(); };
    });
    var q = refQ.toLowerCase(), h = '';
    if (refTab === 'glossary') {
      var g = (global.GLOSSARY || []).filter(function (x) {
        return !q || (x.t + ' ' + x.d + ' ' + x.g).toLowerCase().indexOf(q) >= 0;
      });
      h = '<div class="glossGrid">' + g.map(function (x) {
        return '<div class="glossItem"><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small>' +
          '<span class="gTag">' + esc(x.g) + '</span></div>';
      }).join('') + '</div>';
      if (!g.length) h = '<p class="lead">No matching terms.</p>';
    } else if (refTab === 'cheatsheets') {
      h = (global.CHEATSHEETS || []).filter(function (c) {
        return !q || (c.title + JSON.stringify(c.rows)).toLowerCase().indexOf(q) >= 0;
      }).map(function (c) {
        return '<div class="panel" style="margin-bottom:14px"><h3 style="margin-top:0">' + esc(c.title) + '</h3>' +
          '<table class="specTable">' + c.rows.map(function (r) {
            return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>';
          }).join('') + '</table></div>';
      }).join('');
    } else if (refTab === 'formulas') {
      h = '<div class="glossGrid">' + (global.FORMULAS || []).filter(function (f) {
        return !q || (f.t + f.f + f.n).toLowerCase().indexOf(q) >= 0;
      }).map(function (f) {
        return '<div class="glossItem"><b>' + esc(f.t) + '</b>' +
          '<pre style="margin:6px 0;font-size:12.5px;background:var(--bg2);border:1px solid var(--line);' +
          'border-radius:8px;padding:8px;overflow-x:auto"><code>' + esc(f.f) + '</code></pre>' +
          '<small>' + esc(f.n) + '</small></div>';
      }).join('') + '</div>';
    } else {
      h = '<p class="lead">Every idea in this course traces to one of these. The site itself is fully offline — this list tells you where to verify what it claims.</p>' +
        '<div class="srcList">' + (global.SOURCES || []).filter(function (s) {
          return !q || (s.t + s.o + s.d).toLowerCase().indexOf(q) >= 0;
        }).map(function (s) {
          return '<div class="srcItem"><b>' + esc(s.t) + '</b>' +
            '<small>' + esc(s.o) + ' — ' + esc(s.d) + '</small>' +
            '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.u) + '</a></div>';
        }).join('') + '</div>';
    }
    $('refBody').innerHTML = h;
  }

  /* ---------------- companion library ---------------- */
  function renderLibrary() {
    var P = global.STUDY_PATH;
    var h = '';

    h += '<div class="panel" style="margin-bottom:18px">' +
      '<b>How it fits together.</b> Read a module here, then work its stage in the library — ' +
      'the external material is practice, not introduction. Progress is tracked separately in each; ' +
      'they are two tools that link to each other, not one app.</div>';

    h += '<h2 class="sectionTitle">Run it</h2>' +
      '<pre class="setupBlock"><code>git clone https://github.com/harshadmehmood/ai-engineering-academy.git\n' +
      'cd ai-engineering-academy/tools\n\n' +
      './setup.sh   # clones three courses, builds the index (~230 MB)\n' +
      './start.sh   # serves both locally and opens them connected</code></pre>' +
      '<p class="lead" id="libStatus"></p>';

    if (!P) {
      h += '<div class="callout warn"><b>Study path not loaded.</b> ' +
        '<code>tools/curriculum.js</code> could not be read from this copy, so the stage ' +
        'breakdown below is unavailable. Everything else on this page still applies.</div>';
      $('libraryBody').innerHTML = h;
      probeLibrary();
      return;
    }

    var totalItems = P.stages.reduce(function (n, st) { return n + st.items.length; }, 0);
    h += '<h2 class="sectionTitle">The seven stages</h2>' +
      '<p class="lead">' + totalItems + ' external lessons and notebooks, one stage per module above. ' +
      'Each carries a note on why it is there.</p>';

    h += '<div class="stageList">' + P.stages.map(function (st) {
      var mod = MODULES[st.n - 1];
      var flag = st.priority ? '<span class="pill ok">highest value</span>'
        : st.sparse ? '<span class="pill warn">thin — the academy carries this</span>' : '';
      return '<div class="libStage">' +
        '<span class="libN">' + st.n + '</span>' +
        '<div class="libMain">' +
        '<b>' + esc(mod ? mod.title : st.academy) + '</b> ' + flag +
        '<small>' + esc(st.goal) + '</small>' +
        '<span class="libCount">' + st.items.length + ' external item' +
        (st.items.length === 1 ? '' : 's') + '</span></div>' +
        '<a class="libGo" href="' + esc(st.academyHash) + '">Module ' + st.n + ' →</a>' +
        '</div>';
    }).join('') + '</div>';

    h += '<h2 class="sectionTitle">What it does not do</h2>' +
      '<ul class="lead"><li>It ships no course content — you clone the courses; it indexes titles and paths only.</li>' +
      '<li>It cannot run on this hosted site: it reads files from your own disk.</li>' +
      '<li>Notebooks needing a cloud API key are readable offline, not runnable. It labels which is which.</li></ul>';

    $('libraryBody').innerHTML = h;
    $$('#libraryBody .libGo').forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); go(a.getAttribute('href')); };
    });
    probeLibrary();
  }

  /* Tell the reader whether a working library is actually reachable from here. */
  function probeLibrary() {
    var el = $('libStatus');
    if (!el) return;
    if (location.protocol === 'file:') {
      el.innerHTML = 'You are reading this from disk, so the library cannot be reached — ' +
        'a <code>file://</code> page cannot load one served over HTTP. Run <code>./start.sh</code> ' +
        'and open <code>localhost:8777/academy/</code> for a copy that links straight through.';
      return;
    }
    el.textContent = 'Checking for a library on this server…';
    var cands = ['../library/', 'tools/library/', 'library/'];
    (function probe(i) {
      if (i >= cands.length) {
        el.innerHTML = 'No library found on this server. Follow the steps above to set one up.';
        return;
      }
      fetch(cands[i].replace(/library\/$/, 'library-index.js'))
        .then(function (r) {
          if (!r.ok) throw new Error('no index');
          el.innerHTML = '<a class="primary tkBtn" href="' + cands[i] + '">Open the library →</a>' +
            '<span class="meta" style="margin-left:12px">Running locally and indexed.</span>';
        })
        .catch(function () { probe(i + 1); });
    })(0);
  }

  /* ---------------- progress ---------------- */
  function renderProgress() {
    var d = doneCount(), pct = Math.round((d / LESSONS.length) * 100);
    var perMod = MODULES.map(function (m) {
      var done = m.lessons.filter(function (l) { return S.done[l.id]; }).length;
      return [m.title, done, m.lessons.length];
    });
    var marks = Object.keys(S.marks).filter(function (k) { return S.marks[k]; });
    var totalAns = Object.keys(S.answers).reduce(function (a, k) {
      return { r: a.r + S.answers[k].right, t: a.t + S.answers[k].total };
    }, { r: 0, t: 0 });

    var h = '<div class="stats"><div><b>' + pct + '%</b><small>Complete</small></div>' +
      '<div><b>' + d + '/' + LESSONS.length + '</b><small>Lessons</small></div>' +
      '<div><b>' + doneMins() + 'm</b><small>of ' + TOTAL_MINS + 'm</small></div>' +
      '<div><b>' + (S.streak || 0) + '</b><small>Day streak</small></div></div>';

    h += '<h2 class="sectionTitle">By module</h2><div class="barViz">' +
      perMod.map(function (p) {
        var pc = p[2] ? (p[1] / p[2]) : 0;
        return '<div class="barRow"><span class="bLabel" style="width:190px">' + esc(p[0]) + '</span>' +
          '<span class="bTrack"><span class="bFill" style="width:' + (pc * 100) + '%"></span></span>' +
          '<span class="bVal">' + p[1] + '/' + p[2] + '</span></div>';
      }).join('') + '</div>';

    h += '<h2 class="sectionTitle">Quiz accuracy</h2><div class="panel">' +
      (totalAns.t ? '<b style="font-size:22px">' + totalAns.r + ' / ' + totalAns.t + '</b> ' +
        '<span class="meta">(' + Math.round((totalAns.r / totalAns.t) * 100) + '%) across lessons, cases and the workshop.</span>'
        : '<span class="meta">No questions answered yet.</span>') + '</div>';

    h += '<h2 class="sectionTitle">Bookmarks</h2>';
    if (!marks.length) h += '<p class="lead">Nothing bookmarked yet. Use ☆ on any lesson or case study.</p>';
    else {
      h += '<div>' + marks.map(function (k) {
        if (k.indexOf('case:') === 0) {
          var c = CASES.byId(k.slice(5));
          if (!c) return '';
          return '<div class="lessonRow" data-goto="#case/' + c.id + '">' +
            '<span class="num">C' + c.num + '</span><span class="lTitle"><b>' + esc(c.title) +
            '</b><small>' + esc(c.platform) + '</small></span></div>';
        }
        var l = LESSONS.filter(function (x) { return x.id === k; })[0];
        if (!l) return '';
        return '<div class="lessonRow" data-goto="#lesson/' + l.id + '">' +
          '<span class="num">' + String(l._n).padStart(2, '0') + '</span>' +
          '<span class="lTitle"><b>' + esc(l.title) + '</b><small>' + esc(l.summary) + '</small></span></div>';
      }).join('') + '</div>';
    }

    h += '<h2 class="sectionTitle">Your data</h2><div class="panel">' +
      '<p class="meta">Progress is stored only in this browser\'s local storage. Nothing is uploaded anywhere. ' +
      'Export to move it to another machine.</p>' +
      '<div class="simRow"><button class="secondary" id="expBtn">Export progress</button>' +
      '<button class="secondary" id="impBtn">Import progress</button>' +
      '<button class="secondary" id="resetBtn">Reset everything</button></div>' +
      '<textarea id="ioBox" class="simInput hide" style="margin-top:10px"></textarea></div>';

    $('progressBody').innerHTML = h;
    $$('[data-goto]').forEach(function (e) {
      e.onclick = function () { go(e.dataset.goto); };
    });
    $('expBtn').onclick = function () {
      $('ioBox').classList.remove('hide');
      $('ioBox').value = JSON.stringify(S);
      $('ioBox').select();
      copy(JSON.stringify(S), 'Progress copied to clipboard');
    };
    $('impBtn').onclick = function () {
      var box = $('ioBox');
      if (box.classList.contains('hide')) {
        box.classList.remove('hide'); box.value = ''; box.placeholder = 'Paste exported progress, then press Import again';
        box.focus(); return;
      }
      try {
        var v = JSON.parse(box.value);
        if (!v || typeof v !== 'object') throw new Error('bad');
        S = Object.assign({ done: {}, marks: {}, answers: {} }, v);
        save(); buildNav(); refreshStats(); renderProgress();
        toast('Progress imported');
      } catch (e) { toast('Could not parse that'); }
    };
    $('resetBtn').onclick = function () {
      if (!confirm('Erase all progress, bookmarks and quiz history from this browser?')) return;
      S = { done: {}, marks: {}, answers: {}, streak: 0, last: null, theme: S.theme, mode: 25 };
      save(); buildNav(); refreshStats(); renderProgress(); toast('Reset');
    };
  }

  /* ---------------- command palette ---------------- */
  var pIndex = null, pSel = 0, pRows = [];
  function buildIndex() {
    if (pIndex) return pIndex;
    pIndex = [];
    LESSONS.forEach(function (l) {
      pIndex.push({ type: 'lesson', label: l.title, sub: l._module, href: '#lesson/' + l.id, hay: (l.title + ' ' + l.summary + ' ' + l.keyPoints.join(' ')).toLowerCase() });
    });
    CASES.all().forEach(function (c) {
      pIndex.push({ type: 'case', label: c.title, sub: c.platform, href: '#case/' + c.id, hay: (c.title + ' ' + c.platform + ' ' + c.tags.join(' ') + ' ' + c.brief).toLowerCase() });
    });
    (global.LABS || []).forEach(function (l) {
      pIndex.push({ type: 'lab', label: l.title, sub: 'Interactive lab', href: '#labs/' + l.id, hay: (l.title + ' ' + l.desc).toLowerCase() });
    });
    (global.PATTERNS || []).forEach(function (p) {
      pIndex.push({ type: 'pattern', label: p.name, sub: p.op, href: '#context', hay: (p.name + ' ' + p.problem + ' ' + p.mechanism).toLowerCase() });
    });
    (global.GLOSSARY || []).forEach(function (g) {
      pIndex.push({ type: 'term', label: g.t, sub: g.d.slice(0, 70) + '…', href: '#reference', hay: (g.t + ' ' + g.d).toLowerCase() });
    });
    return pIndex;
  }
  function openPalette() {
    $('palette').classList.remove('hide');
    $('paletteInput').value = ''; $('paletteInput').focus();
    paletteSearch('');
  }
  function closePalette() { $('palette').classList.add('hide'); }
  function paletteSearch(q) {
    q = q.trim().toLowerCase();
    var idx = buildIndex();
    pRows = (q ? idx.filter(function (r) { return r.hay.indexOf(q) >= 0; }) : idx.slice(0, 12)).slice(0, 40);
    pSel = 0;
    $('paletteResults').innerHTML = pRows.length ? pRows.map(function (r, i) {
      return '<div class="pRes' + (i === 0 ? ' sel' : '') + '" data-pi="' + i + '">' +
        '<span class="pType">' + r.type + '</span>' +
        '<span class="pTxt"><b>' + esc(r.label) + '</b> <span class="meta">' + esc(r.sub) + '</span></span></div>';
    }).join('') : '<div class="pRes"><span class="pTxt meta">No matches</span></div>';
    $$('[data-pi]').forEach(function (e) {
      e.onclick = function () { closePalette(); go(pRows[+e.dataset.pi].href); };
    });
  }
  function paletteMove(d) {
    if (!pRows.length) return;
    pSel = (pSel + d + pRows.length) % pRows.length;
    $$('.pRes').forEach(function (e, i) { e.classList.toggle('sel', i === pSel); });
    var el = $$('.pRes')[pSel];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  /* ---------------- router ---------------- */
  var PAGES = ['home', 'learn', 'lesson', 'context', 'cases', 'case', 'labs', 'workshop', 'reference', 'library', 'progress'];
  function show(page) {
    PAGES.forEach(function (p) {
      var el = $('page-' + p);
      if (el) el.classList.toggle('hide', p !== page);
    });
    $$('.bottombar button').forEach(function (b) {
      var t = (b.dataset.goto || '').replace('#', '');
      b.classList.toggle('active', t === page || (page === 'lesson' && t === 'learn') ||
        (page === 'case' && t === 'cases'));
    });
    window.scrollTo(0, 0);
  }

  function route() {
    var h = location.hash.replace(/^#/, '') || 'home';
    var parts = h.split('/');
    var page = parts[0], arg = parts[1];
    switch (page) {
      case 'learn': show('learn'); renderLearn(); break;
      case 'lesson': show('lesson'); renderLesson(arg); break;
      case 'context': show('context'); renderContext(); break;
      case 'cases': show('cases'); renderCases(); break;
      case 'case': show('case'); renderCase(arg); break;
      case 'labs': show('labs'); renderLabs(arg); break;
      case 'workshop': show('workshop'); renderWorkshop(); break;
      case 'reference': show('reference'); renderReference(); break;
      case 'library': show('library'); renderLibrary(); break;
      case 'progress': show('progress'); renderProgress(); break;
      default: show('home'); renderHome();
    }
    $$('#nav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + h);
    });
    if (window.innerWidth < 1100) setDrawer(false);
  }
  function go(href) {
    if (location.hash === href) route();
    else location.hash = href;
  }

  /* ---------------- boot ---------------- */
  function boot() {
    document.documentElement.setAttribute('data-theme', S.theme || 'dark');
    buildNav();
    refreshStats();

    $('menuBtn').onclick = function () { setDrawer(!$('drawer').classList.contains('open')); };
    $('drawerClose').onclick = function () { setDrawer(false); };
    $('scrim').onclick = function () { setDrawer(false); };
    $('themeBtn').onclick = function () {
      S.theme = (S.theme === 'dark') ? 'light' : 'dark'; save();
      document.documentElement.setAttribute('data-theme', S.theme);
      route();   // re-render so generated SVGs pick up new variables cleanly
    };
    $('cmdBtn').onclick = openPalette;
    $('palette').onclick = function (e) { if (e.target.id === 'palette') closePalette(); };
    $('paletteInput').oninput = function () { paletteSearch(this.value); };

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea';
      if (!$('palette').classList.contains('hide')) {
        if (e.key === 'Escape') { closePalette(); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { paletteMove(1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { paletteMove(-1); e.preventDefault(); }
        else if (e.key === 'Enter' && pRows[pSel]) { closePalette(); go(pRows[pSel].href); e.preventDefault(); }
        return;
      }
      if (typing) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { openPalette(); e.preventDefault(); }
      if (e.key === 'j' || e.key === 'ArrowRight') { var n = $('nextBtn'); if (n && n.offsetParent && !$('page-lesson').classList.contains('hide')) n.click(); }
      if (e.key === 'k' || e.key === 'ArrowLeft') { var p = $('prevBtn'); if (p && p.offsetParent && !$('page-lesson').classList.contains('hide')) p.click(); }
    });

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-goto]') : null;
      if (t && t.dataset.goto && t.tagName !== 'A') { go(t.dataset.goto); }
    });

    $('curriculumSearch').oninput = function () { curFilter.q = this.value; renderLearn(); };
    $$('#levelFilter .chip').forEach(function (b) {
      b.onclick = function () {
        curFilter.level = b.dataset.level;
        $$('#levelFilter .chip').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active'); renderLearn();
      };
    });
    $('caseSearch').oninput = function () { caseFilter.q = this.value; renderCases(); };
    $('refSearch').oninput = function () { refQ = this.value; renderReference(); };

    window.addEventListener('hashchange', route);
    route();
  }

  global.APP = { md: md, go: go, toast: toast, recordAnswer: recordAnswer, lessons: LESSONS, modules: MODULES };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
