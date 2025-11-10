#!/usr/bin/env bash
set -e

# Homebrew
if ! command -v brew >/dev/null 2>&1; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Node, Rust
if ! command -v node >/dev/null 2>&1; then brew install node; fi
if ! command -v rustc >/dev/null 2>&1; then curl https://sh.rustup.rs -sSf | sh -s -- -y; fi
if ! command -v pnpm >/dev/null 2>&1; then npm i -g pnpm; fi

# deps
pnpm i

# run
pnpm tauri:dev

