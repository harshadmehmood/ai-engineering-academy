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
cd "$(dirname "${BASH_SOURCE[0]}")"

PORT="${1:-8777}"

# Rebuild the index if any course has newer files than the index.
if command -v node >/dev/null 2>&1; then
  if [ ! -f library/index-data.js ] || \
     [ -n "$(find . -maxdepth 2 -name '*.md' -newer library/index-data.js -not -path './library/*' -print -quit 2>/dev/null)" ]; then
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
echo "AI Academy Library"
echo "  serving  $(pwd)"
echo "  at       $URL"
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

if command -v open >/dev/null 2>&1; then open "$URL"; fi
wait $SERVER_PID
