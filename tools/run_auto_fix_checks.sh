#!/usr/bin/env bash
set -euo pipefail

# run_auto_fix_checks.sh
# Creates a Python venv, installs dev tools, runs formatters/linters/tests
# Also runs frontend auto-fixes (Prettier + ESLint) using npm
# Usage:
#   ./tools/run_auto_fix_checks.sh [--commit]

COMMIT=false
if [ "${1:-}" = "--commit" ]; then
  COMMIT=true
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Using project root: $ROOT_DIR"

# 1) Frontend: run npm ci and auto-fix
if [ -d frontend ] && [ -f frontend/package.json ]; then
  echo "\n== FRONTEND: npm ci + Prettier + ESLint --fix =="
  (cd frontend && npm ci --no-audit --no-fund --legacy-peer-deps)
  (cd frontend && npx --yes prettier --write "src/**/*.{ts,tsx,css,md,json}")
  # For ESLint v9, rely on frontend/eslint.config.cjs
  (cd frontend && npx --yes eslint "src/**/*.{ts,tsx}" --fix) || true
else
  echo "No frontend or package.json found; skipping frontend steps"
fi

# 2) Python: venv + dev tools
VENV_DIR="$ROOT_DIR/.venv-auto-fix"
python3 -m venv "$VENV_DIR"
# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip setuptools wheel
python -m pip install black isort flake8 mypy pytest pre-commit

# Run formatters
echo "\n== PYTHON: black + isort =="
black . || true
isort . || true

# Run pre-commit hooks
echo "\n== PRE-COMMIT: run hooks (fixers) =="
pre-commit install || true
pre-commit run --all-files || true

# Run lints & typechecks
echo "\n== LINTS: flake8 + mypy =="
flake8 || true
mypy || true

# Run tests
echo "\n== TESTS: pytest =="
pytest -q || true

# Stage and optionally commit changes
if [ "$COMMIT" = true ]; then
  echo "\n== GIT: staging and committing fixes =="
  git add -A
  if git diff --staged --quiet; then
    echo "No changes to commit"
  else
    git commit -m "chore(ci): auto-apply formatting/lint fixes (run_auto_fix_checks)" || true
    git push -u origin HEAD || true
  fi
fi

echo "\nDone. Virtualenv at: $VENV_DIR (activate with: source $VENV_DIR/bin/activate)"
