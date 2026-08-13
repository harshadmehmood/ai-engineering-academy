#!/usr/bin/env bash
# ============================================================
# smoke.sh — render every route in headless Chrome and assert
# the page actually produced content.
#
#   ./scripts/smoke.sh                  # auto-detect Chrome
#   CHROME=/path/to/chrome ./scripts/smoke.sh
#
# No npm dependencies: uses whatever Chrome/Chromium is on the
# machine. GitHub-hosted Ubuntu runners ship with one.
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- locate a browser ---
if [ -z "${CHROME:-}" ]; then
  for c in google-chrome google-chrome-stable chromium chromium-browser \
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell"; do
    if command -v "$c" >/dev/null 2>&1; then CHROME="$c"; break; fi
    if [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
if [ -z "${CHROME:-}" ]; then
  echo "✗ No Chrome/Chromium found. Set CHROME=/path/to/chrome" >&2
  exit 1
fi
echo "browser: $CHROME"

render() {
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
            --virtual-time-budget=6000 --dump-dom "file://$ROOT/index.html$1" 2>/dev/null
}

# --- build the route list from the data files ---
ROUTES=$(node -e "
global.window=global;
['data-curriculum-a','data-curriculum-b','data-curriculum-c','data-cases-a','data-cases-b','labs']
  .forEach(f=>require('$ROOT/js/'+f+'.js'));
const r=['#home','#learn','#context','#cases','#labs','#workshop','#reference','#progress'];
[].concat(window.CURRICULUM_A,window.CURRICULUM_B,window.CURRICULUM_C)
  .forEach(m=>m.lessons.forEach(l=>r.push('#lesson/'+l.id)));
[].concat(window.CASES_A,window.CASES_B).forEach(c=>r.push('#case/'+c.id));
window.LABS.forEach(l=>r.push('#labs/'+l.id));
console.log(r.join(' '));
")

total=0; bad=0
for route in $ROUTES; do
  total=$((total+1))
  dom=$(render "$route")
  size=${#dom}

  problem=""
  [ "$size" -lt 12000 ] && problem="$problem tiny-dom($size)"
  # template tokens must never survive into rendered prose
  prose=$(printf '%s' "$dom" | perl -0pe 's/<pre.*?<\/pre>//gs' 2>/dev/null || printf '%s' "$dom")
  printf '%s' "$prose" | grep -q '{{' && problem="$problem unrendered-token"
  printf '%s' "$prose" | grep -q '\*\*'  && problem="$problem unrendered-bold"

  if [ -n "$problem" ]; then
    echo "  ✗ $route —$problem"
    bad=$((bad+1))
  fi
done

echo ""
if [ "$bad" -gt 0 ]; then
  echo "✗ $bad of $total routes failed"
  exit 1
fi
echo "✓ all $total routes rendered cleanly"
