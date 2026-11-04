#!/bin/zsh
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")" || exit 1
GAME_URL='http://127.0.0.1:5194/'
if curl -fsS http://127.0.0.1:5194/ >/dev/null 2>&1 && curl -fsS http://127.0.0.1:5197/api/health >/dev/null 2>&1; then
  open "$GAME_URL"
  exit 0
fi
if ! command -v node >/dev/null; then
  print 'Node.js 22.12 ou plus récent est nécessaire. Installe-le depuis nodejs.org.'
  read '?Appuie sur Entrée pour fermer.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
(
  for attempt in {1..60}; do
    if curl -fsS http://127.0.0.1:5194/ >/dev/null 2>&1; then
      open "$GAME_URL"
      exit 0
    fi
    sleep .25
  done
) &
print 'G4 Ever — garde cette fenêtre ouverte. Ctrl+C pour arrêter.'
exec node scripts/dev.mjs
