#!/bin/sh
export PATH="$HOME/local/node-v22.16.0-darwin-arm64/bin:$PATH"
cd "$(dirname "$0")"
exec npx vite --host
