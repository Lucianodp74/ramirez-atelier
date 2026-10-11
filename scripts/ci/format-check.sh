#!/usr/bin/env bash
# Format check dei soli file modificati tra due commit.
#
# Uso: scripts/ci/format-check.sh <base> <head>
#
# Ogni errore di git interrompe lo script: se il confronto non è calcolabile
# (commit di base non disponibile, storia troncata) il controllo FALLISCE,
# non viene saltato. Un elenco vuoto è ammesso solo quando git ha risposto
# correttamente e nessun file supportato è cambiato.
set -euo pipefail

base="${1:?commit di base mancante}"
head="${2:?commit di arrivo mancante}"
estensioni='\.(cjs|cts|css|html|js|jsx|json|md|mdx|mjs|scss|ts|tsx|yml|yaml)$'

git cat-file -e "${base}^{commit}"
git cat-file -e "${head}^{commit}"

# Tre punti: solo ciò che il ramo ha cambiato rispetto all'antenato comune.
modificati="$(git diff --name-only --diff-filter=ACMR "${base}...${head}")"
files="$(printf '%s\n' "$modificati" | grep -E "$estensioni" || true)"

if [ -z "$files" ]; then
  echo "Nessun file supportato modificato tra ${base} e ${head}."
  exit 0
fi

echo "File controllati:"
printf '%s\n' "$files" | sed 's/^/  /'
printf '%s\n' "$files" | tr '\n' '\0' | xargs -0 npx prettier --check
