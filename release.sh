#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
CHECK_ONLY=false
ALLOW_DIRTY=false
PHASE="initialization"

usage() {
  cat <<'EOF'
Usage: ./release.sh [--check] [--allow-dirty]

  --check        Run the local gate without Cloudflare authentication or deployment.
  --allow-dirty  Permit a dirty worktree in --check mode only.
EOF
}

die() {
  printf '\nRelease stopped during %s: %s\n' "$PHASE" "$*" >&2
  exit 1
}

on_error() {
  local status=$?
  printf '\nRelease failed during %s (exit %s).\n' "$PHASE" "$status" >&2
  if [[ "$CHECK_ONLY" == false ]]; then
    printf '%s\n' 'Production may be partially updated. Fix the cause and rerun this exact commit.' >&2
    printf '%s\n' 'Do not roll back D1 migrations automatically; Worker versions can be rolled back independently.' >&2
  fi
  exit "$status"
}
trap on_error ERR

while (($#)); do
  case "$1" in
    --check) CHECK_ONLY=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; die "unknown option: $1" ;;
  esac
  shift
done

if [[ "$ALLOW_DIRTY" == true && "$CHECK_ONLY" == false ]]; then
  die '--allow-dirty is restricted to --check; production releases always require a clean worktree.'
fi

cd "$ROOT"

section() {
  PHASE="$1"
  printf '\n==> %s\n' "$PHASE"
}

run_in() {
  local directory=$1
  shift
  local label="${directory#"$ROOT"/}"
  [[ "$directory" == "$ROOT" ]] && label='.'
  printf '  [%s] ' "$label"
  printf '%q ' "$@"
  printf '\n'
  (cd "$directory" && "$@")
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

workspace_fingerprint() {
  {
    git diff --binary HEAD
    while IFS= read -r -d '' file; do
      shasum -a 256 "$file"
    done < <(git ls-files --others --exclude-standard -z)
  } | shasum -a 256 | awk '{print $1}'
}

retry() {
  local attempts=$1
  local delay=$2
  shift 2
  local attempt=1
  until "$@"; do
    if ((attempt >= attempts)); then return 1; fi
    printf '  Attempt %s/%s failed; retrying in %ss.\n' "$attempt" "$attempts" "$delay" >&2
    sleep "$delay"
    attempt=$((attempt + 1))
  done
}

section 'repository checks'
require_command git
require_command node
require_command npm
require_command uv
require_command shasum
require_command curl

[[ "$(git rev-parse --show-toplevel)" == "$ROOT" ]] || die 'release.sh must run from its own repository.'
[[ "$(git branch --show-current)" == main ]] || die 'production releases must come from main.'

if [[ "$ALLOW_DIRTY" == false && -n "$(git status --porcelain=v1)" ]]; then
  git status --short >&2
  die 'the worktree must be clean, including untracked files.'
fi

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
((NODE_MAJOR >= 24)) || die "Node.js 24 or newer is required; found $(node --version)."
START_FINGERPRINT="$(workspace_fingerprint)"
RELEASE_SHA="$(git rev-parse HEAD)"
RELEASE_SHORT_SHA="$(git rev-parse --short=12 HEAD)"
RELEASE_SUBJECT="$(git log -1 --pretty=%s)"
RELEASE_MESSAGE="diagram.zip ${RELEASE_SHORT_SHA}: ${RELEASE_SUBJECT}"

NPM_DIRECTORIES=("$ROOT")
while IFS= read -r lockfile; do
  directory="$(cd "$(dirname "$lockfile")" && pwd -P)"
  [[ "$directory" == "$ROOT" ]] || NPM_DIRECTORIES+=("$directory")
done < <(find apps/docs services renderers/browser-run renderers/edge -name package-lock.json -not -path '*/node_modules/*' -print | sort)

PYTHON_DIRECTORIES=()
while IFS= read -r config; do
  PYTHON_DIRECTORIES+=("$(cd "$(dirname "$config")" && pwd -P)")
done < <(find renderers/python -mindepth 2 -maxdepth 2 -name wrangler.jsonc -print | sort)

BROWSER_FRAME_DIRECTORIES=()
while IFS= read -r config; do
  BROWSER_FRAME_DIRECTORIES+=("$(cd "$(dirname "$config")" && pwd -P)")
done < <(find renderers/browser-run/frames -mindepth 2 -maxdepth 2 -name wrangler.jsonc -print | sort)

BROWSER_RUN_DIRECTORY="$ROOT/renderers/browser-run"

EDGE_CONFIG_COUNT="$(find renderers/edge/config/units -maxdepth 1 -name '*.jsonc' | wc -l | tr -d ' ')"
DEPLOYMENT_COUNT=$((EDGE_CONFIG_COUNT + ${#PYTHON_DIRECTORIES[@]} + ${#BROWSER_FRAME_DIRECTORIES[@]} + 5))
WRANGLER_CONFIG_COUNT="$(find apps services renderers \
  -path '*/node_modules' -prune -o \
  -path 'renderers/edge/config' -prune -o \
  -name wrangler.jsonc -print | wc -l | tr -d ' ')"
PRODUCTION_CONFIG_COUNT=$((WRANGLER_CONFIG_COUNT + EDGE_CONFIG_COUNT))
[[ "$PRODUCTION_CONFIG_COUNT" == "$DEPLOYMENT_COUNT" ]] || \
  die "release ownership covers ${DEPLOYMENT_COUNT} deployments, but ${PRODUCTION_CONFIG_COUNT} production Wrangler configs exist."
printf '  Commit: %s (%s)\n' "$RELEASE_SHORT_SHA" "$RELEASE_SUBJECT"
printf '  Discovered: %s edge + %s Python + %s Browser Run frames + Browser Run/catalog/API/shell/docs = %s deployments\n' \
  "$EDGE_CONFIG_COUNT" "${#PYTHON_DIRECTORIES[@]}" "${#BROWSER_FRAME_DIRECTORIES[@]}" "$DEPLOYMENT_COUNT"

section 'locked dependency installation'
for directory in "${NPM_DIRECTORIES[@]}"; do
  run_in "$directory" npm ci
done
for directory in "${PYTHON_DIRECTORIES[@]}"; do
  run_in "$directory" uv lock --check
  run_in "$directory" uv sync --locked
done

WRANGLER="$ROOT/renderers/edge/node_modules/.bin/wrangler"
[[ -x "$WRANGLER" ]] || die 'the locked Wrangler installation is unavailable.'
[[ "$($WRANGLER --version)" == 4.* ]] || die 'Wrangler 4.x is required.'

section 'generated types and static checks'
run_in "$ROOT/services/api" "$ROOT/services/api/node_modules/.bin/wrangler" types --check
run_in "$ROOT/services/shell" "$ROOT/services/shell/node_modules/.bin/wrangler" types --check
run_in "$ROOT/renderers/edge" "$WRANGLER" types ../catalog/worker-configuration.d.ts --config ../catalog/wrangler.jsonc --check
run_in "$ROOT/services/api" npm run check
run_in "$ROOT/services/shell" npm run check
run_in "$ROOT/renderers/edge" npm run check
run_in "$BROWSER_RUN_DIRECTORY" npm run check

section 'tests and production builds'
run_in "$ROOT" npm test
run_in "$ROOT" npm run build:editor
run_in "$ROOT" npm run build:docs
run_in "$BROWSER_RUN_DIRECTORY" npm test
for directory in "${PYTHON_DIRECTORIES[@]}"; do
  run_in "$directory" uv run pytest -q
  run_in "$directory" uv run pywrangler sync --force
done
for directory in "${BROWSER_FRAME_DIRECTORIES[@]}"; do
  if node -e 'const fs=require("node:fs"); const p=JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.exit(p.scripts?.test ? 0 : 1)' "$directory/package.json"; then
    run_in "$directory" npm test
  else
    run_in "$directory" npm run build
  fi
done

section 'artifact and deployment dry runs'
run_in "$ROOT/renderers/edge" npm run check:licenses
run_in "$ROOT/renderers/catalog" "$WRANGLER" deploy --dry-run --strict --config wrangler.jsonc
run_in "$ROOT/services/api" "$ROOT/services/api/node_modules/.bin/wrangler" deploy --dry-run --strict --config wrangler.jsonc
run_in "$ROOT/services/shell" "$ROOT/services/shell/node_modules/.bin/wrangler" deploy --dry-run --strict --config wrangler.jsonc
run_in "$BROWSER_RUN_DIRECTORY" "$BROWSER_RUN_DIRECTORY/node_modules/.bin/wrangler" deploy --dry-run --strict --config wrangler.jsonc
for directory in "${BROWSER_FRAME_DIRECTORIES[@]}"; do
  run_in "$directory" "$WRANGLER" deploy --dry-run --strict --config wrangler.jsonc
done

section 'generated-file drift check'
END_FINGERPRINT="$(workspace_fingerprint)"
if [[ "$START_FINGERPRINT" != "$END_FINGERPRINT" ]]; then
  git status --short >&2
  die 'the release gate changed tracked or untracked repository content; regenerate and review it before release.'
fi

if [[ "$CHECK_ONLY" == true ]]; then
  printf '\nRelease gate passed for %s. No remote commands were run.\n' "$RELEASE_SHORT_SHA"
  exit 0
fi

section 'Cloudflare authentication and remote preflight'
run_in "$ROOT/renderers/edge" "$WRANGLER" whoami
run_in "$ROOT/services/api" "$ROOT/services/api/node_modules/.bin/wrangler" d1 migrations list diagramzip --remote --config wrangler.jsonc

[[ -t 0 ]] || die 'production confirmation requires an interactive terminal.'
printf '\nDeploy %s to production across %s Cloudflare deployments? [y/N] ' "$RELEASE_SHORT_SHA" "$DEPLOYMENT_COUNT"
read -r answer
[[ "$answer" == y || "$answer" == Y ]] || die 'production release cancelled.'

export DIAGRAMZIP_RELEASE_MESSAGE="$RELEASE_MESSAGE"

section 'edge renderer deployment'
run_in "$ROOT/renderers/edge" npm run deploy:edge

section 'Python renderer deployment'
run_in "$ROOT/renderers/edge" npm run deploy:python

section 'private Browser Run deployment'
run_in "$BROWSER_RUN_DIRECTORY" "$BROWSER_RUN_DIRECTORY/node_modules/.bin/wrangler" deploy --strict --message "$RELEASE_MESSAGE" --config wrangler.jsonc

section 'browser-backed renderer deployment'
for directory in "${BROWSER_FRAME_DIRECTORIES[@]}"; do
  run_in "$directory" "$WRANGLER" deploy --strict --message "$RELEASE_MESSAGE" --config wrangler.jsonc
done

section 'renderer catalog deployment'
run_in "$ROOT/renderers/catalog" "$WRANGLER" deploy --strict --message "$RELEASE_MESSAGE" --config wrangler.jsonc

section 'D1 migrations and API deployment'
run_in "$ROOT/services/api" "$ROOT/services/api/node_modules/.bin/wrangler" d1 migrations apply diagramzip --remote --config wrangler.jsonc
run_in "$ROOT/services/api" "$ROOT/services/api/node_modules/.bin/wrangler" deploy --strict --message "$RELEASE_MESSAGE" --config wrangler.jsonc

section 'editor shell deployment'
run_in "$ROOT/services/shell" "$ROOT/services/shell/node_modules/.bin/wrangler" deploy --strict --message "$RELEASE_MESSAGE" --config wrangler.jsonc

section 'documentation deployment'
run_in "$ROOT/apps/docs" "$ROOT/apps/docs/node_modules/.bin/wrangler" pages deploy build \
  --project-name diagramzip-docs \
  --branch main \
  --commit-hash "$RELEASE_SHA" \
  --commit-message "$RELEASE_SUBJECT" \
  --commit-dirty=false

section 'production smoke tests'
retry 3 5 run_in "$ROOT/renderers/edge" npm run smoke:renderers
retry 3 5 env DIAGRAMZIP_RENDER_URL=https://diagram.zip node "$ROOT/renderers/catalog/scripts/smoke.mjs"
retry 6 5 curl --fail --silent --show-error --output /dev/null https://diagram.zip/api/v1/health
retry 6 5 curl --fail --silent --show-error --output /dev/null https://diagram.zip/healthz
retry 6 5 curl --fail --silent --show-error --output /dev/null https://docs.diagram.zip/

printf '\nRelease %s completed: %s deployments and all public smoke tests passed.\n' \
  "$RELEASE_SHORT_SHA" "$DEPLOYMENT_COUNT"
