#!/usr/bin/env bash
# ============================================================
# start.sh — open the AI Academy Library.
#
# Serves this folder on localhost so the reader can load lesson
# files from disk. Nothing leaves your machine; no internet is
# used or required.
#
#   ./start.sh          # rebuild index if needed, serve, open
#   ./start.sh 9000     # use a different port
# ============================================================
set -uo pipefail
# Use the symlink's own location, not its resolved target: the course repos
# live beside the link, while the tool itself may live in another checkout.
cd "$(dirname "${BASH_SOURCE[0]}")"
export LIBRARY_ROOT="$(pwd)"

PORT="${1:-8777}"

# Rebuild the index if any course has newer files than the index.
if command -v node >/dev/null 2>&1; then
  if [ ! -f library-index.js ] || \
     [ -n "$(find . -maxdepth 2 -name '*.md' -newer library-index.js -not -path './library/*' -print -quit 2>/dev/null)" ]; then
    echo "Rebuilding index…"
    node build-index.js
    echo ""
  fi
else
  echo "note: node not found — using the existing index as-is."
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "✗ python3 not found. Install it, or serve this folder with any static server." >&2
  exit 1
fi

# Free the port if a previous run is still holding it.
if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
  echo "Port $PORT busy — stopping the previous server."
  lsof -ti tcp:"$PORT" | xargs kill 2>/dev/null
  sleep 1
fi

URL="http://localhost:$PORT/library/"

# If the academy is reachable from this root, the two link to each other.
ACADEMY_URL=""
for cand in academy .. ; do
  if [ -f "$cand/index.html" ] && grep -q "AI Systems Academy" "$cand/index.html" 2>/dev/null; then
    [ "$cand" = ".." ] && ACADEMY_URL="(serve the repo root to reach the academy)" \
                      || ACADEMY_URL="http://localhost:$PORT/$cand/"
    break
  fi
done

echo "AI Academy Library"
echo "  serving  $(pwd)"
echo "  library  $URL"
if [ -n "$ACADEMY_URL" ]; then
  echo "  academy  $ACADEMY_URL"
  echo "           both are on one origin, so they link to each other"
fi
echo "  offline  no internet is used"
echo ""
echo "Press Ctrl-C to stop."
echo ""

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; echo ""; echo "stopped."; exit 0' INT TERM

# wait for it to accept connections, then open
for _ in $(seq 1 40); do
  if curl -s -o /dev/null "http://127.0.0.1:$PORT/library/index.html"; then break; fi
  sleep 0.25
done

OPEN_URL="$URL"
[ -n "$ACADEMY_URL" ] && [ "${ACADEMY_URL#http}" != "$ACADEMY_URL" ] && OPEN_URL="$ACADEMY_URL"
if command -v open >/dev/null 2>&1; then open "$OPEN_URL"; fi
wait $SERVER_PID
