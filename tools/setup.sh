#!/usr/bin/env bash
# ============================================================
# setup.sh — clone the three courses the study path maps against,
# then build the index.
#
#   ./setup.sh          # clone what's missing, build, done
#   ./setup.sh --update # also git pull each course first
#
# Shallow clones, ~230 MB total. Nothing is modified afterwards.
# ============================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
export LIBRARY_ROOT="$(pwd)"

UPDATE=0
[ "${1:-}" = "--update" ] && UPDATE=1

# name|repo|why
COURSES=(
  "llm-zoomcamp|https://github.com/DataTalksClub/llm-zoomcamp.git|Production RAG, evaluation, monitoring"
  "agents-course|https://github.com/huggingface/agents-course.git|Agent fundamentals and frameworks"
  "anthropic-courses|https://github.com/anthropics/courses.git|Prompt evaluations and tool use"
)

echo "AI Academy Library — setup"
echo ""

for row in "${COURSES[@]}"; do
  IFS='|' read -r dir repo why <<< "$row"
  if [ -d "$dir/.git" ]; then
    if [ "$UPDATE" = "1" ]; then
      printf "  updating %-20s " "$dir"
      if git -C "$dir" pull --quiet --ff-only 2>/dev/null; then echo "✓"; else echo "skipped (local changes)"; fi
    else
      printf "  %-20s already cloned\n" "$dir"
    fi
  else
    printf "  cloning  %-20s %s\n" "$dir" "$why"
    if ! git clone --depth 1 --quiet "$repo" "$dir"; then
      echo "    ✗ clone failed — check your connection and try again" >&2
    fi
  fi
done

echo ""
if ! command -v node >/dev/null 2>&1; then
  echo "✗ node not found — install Node to build the index." >&2
  exit 1
fi
node build-index.js

echo ""
echo "Ready. Run ./start.sh to open the library."
echo "The study path is the place to begin: it maps these courses onto"
echo "the seven academy modules, in order."
