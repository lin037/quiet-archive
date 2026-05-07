#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-.venv}"
CACHE_DIR="${CACHE_DIR:-.deploy-cache}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ missing command: $1" >&2
    exit 127
  fi
}

file_hash() {
  "${PYTHON_BIN}" - "$1" <<'PY'
import hashlib
import pathlib
import sys

file_path = pathlib.Path(sys.argv[1])
file_hash = hashlib.sha256()

with file_path.open("rb") as file_obj:
    for chunk in iter(lambda: file_obj.read(1024 * 1024), b""):
        file_hash.update(chunk)

print(file_hash.hexdigest())
PY
}

read_cached_hash() {
  if [ -f "$1" ]; then
    cat "$1"
  fi
}

load_node_env() {
  if [ -s "${HOME}/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "${HOME}/.nvm/nvm.sh"
    nvm use 22 >/dev/null 2>&1 || true
  fi
}

prepare_python_env() {
  local requirements_hash
  local requirements_hash_file
  local cached_hash
  local venv_created

  requirements_hash_file="${CACHE_DIR}/requirements.sha256"
  venv_created="0"

  if [ ! -x "${VENV_DIR}/bin/python" ] || [ ! -f "${VENV_DIR}/bin/activate" ]; then
    echo "▶ creating python venv"
    rm -rf "${VENV_DIR}"
    if ! "${PYTHON_BIN}" -m venv "${VENV_DIR}"; then
      echo "✗ failed to create python venv" >&2
      echo "  On Ubuntu/Debian, run: sudo apt install -y python3-venv" >&2
      exit 127
    fi
    venv_created="1"
  fi

  # shellcheck disable=SC1091
  . "${VENV_DIR}/bin/activate"

  requirements_hash="$(file_hash scripts/requirements.txt)"
  cached_hash="$(read_cached_hash "${requirements_hash_file}")"

  if [ "${venv_created}" = "0" ] && [ "${requirements_hash}" = "${cached_hash}" ]; then
    echo "▶ python deps unchanged, skip install"
    return
  fi

  echo "▶ installing python deps"
  python -m pip install --upgrade pip
  python -m pip install -r scripts/requirements.txt
  printf '%s\n' "${requirements_hash}" > "${requirements_hash_file}"
}

install_node_deps() {
  local package_hash
  local package_hash_file
  local cached_hash

  package_hash_file="${CACHE_DIR}/package-lock.sha256"
  package_hash="$(file_hash package-lock.json)"
  cached_hash="$(read_cached_hash "${package_hash_file}")"

  if [ -d node_modules ] && [ "${package_hash}" = "${cached_hash}" ]; then
    echo "▶ node deps unchanged, skip install"
    return
  fi

  echo "▶ installing node deps"
  npm ci
  printf '%s\n' "${package_hash}" > "${package_hash_file}"
}

cd "${PROJECT_DIR}"

load_node_env

require_command npm
require_command "${PYTHON_BIN}"

mkdir -p "${CACHE_DIR}"

prepare_python_env
install_node_deps

echo "▶ building static site"
# 注意：不要 rm -rf dist，只清空内部。
# 因为 dist/ 目录可能被 docker bind mount 挂载到容器（如 nginx），
# 删除目录本身会让容器内的挂载指向失效的 inode，导致 404/403。
if [ -d dist ]; then
  find dist -mindepth 1 -delete
fi
npm run build

if [ ! -f dist/index.html ]; then
  echo "✗ build finished but dist/index.html was not found" >&2
  exit 1
fi

echo "▶ updating dist permissions"
find dist -type d -exec chmod 755 {} \;
find dist -type f -exec chmod 644 {} \;

echo "✓ deployed at $(date -Iseconds)"
