#!/bin/zsh
cd "$(dirname "$0")"

LOCAL_NODE_DIR="$PWD/work/node-v24-16-0"

if [ ! -x "$LOCAL_NODE_DIR/bin/npm" ]; then
  echo "Local Node/npm was not found in work/node-v24-16-0."
  echo "Install Node.js from https://nodejs.org/ or ask Codex to recreate the local runtime."
  exit 1
fi

export PATH="$LOCAL_NODE_DIR/bin:$PATH"
export HOME="$PWD/work/home"
export XDG_CONFIG_HOME="$PWD/work/xdg"

mkdir -p "$HOME" "$XDG_CONFIG_HOME" "$PWD/work/npm-cache"

if [ ! -d "$PWD/node_modules" ]; then
  npm install --cache "$PWD/work/npm-cache"
fi

npm run dev --cache "$PWD/work/npm-cache"
