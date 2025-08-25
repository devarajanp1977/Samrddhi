#!/usr/bin/env bash
# Installer for the 'samrddhi' convenience CLI
# Safe idempotent repair of broken symlink (/usr/local/bin or ~/.local/bin)
set -euo pipefail

TARGET_NAME="samrddhi"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_PATH="$SCRIPT_DIR/$TARGET_NAME"

if [ ! -f "$SOURCE_PATH" ]; then
  echo "ERROR: $SOURCE_PATH not found. Expected CLI script at repo root named '$TARGET_NAME'." >&2
  exit 1
fi

# Ensure script is executable
chmod +x "$SOURCE_PATH"

link_created="false"

link_into() {
  local dest_dir="$1"
  local dest="$dest_dir/$TARGET_NAME"
  if [ ! -d "$dest_dir" ]; then
    mkdir -p "$dest_dir"
  fi
  if [ -L "$dest" ] || [ -f "$dest" ]; then
    # If existing link points elsewhere, replace
    local current
    current=$(readlink -f "$dest" || true)
    if [ "$current" != "$SOURCE_PATH" ]; then
      echo "Replacing existing $dest (was $current)"
      rm -f "$dest"
    else
      echo "Link already correct at $dest"
      link_created="true"
      return
    fi
  fi
  ln -s "$SOURCE_PATH" "$dest"
  echo "Linked $dest -> $SOURCE_PATH"
  link_created="true"
}

# Prefer /usr/local/bin when writable (root or sudo)
if [ -w /usr/local/bin ]; then
  link_into /usr/local/bin
else
  echo "/usr/local/bin not writable; using user bin (~/.local/bin)."
  link_into "$HOME/.local/bin"
  if ! echo ":$PATH:" | grep -q ":$HOME/.local/bin:"; then
    echo "WARNING: $HOME/.local/bin not in PATH. Add the following to your shell profile:"
    echo "  export PATH=\"$HOME/.local/bin:\$PATH\""
  fi
fi

if [ "$link_created" = "true" ]; then
  echo "\nSUCCESS. Test with:  samrddhi status"
else
  echo "\nNo link created. Investigate permissions."
fi
