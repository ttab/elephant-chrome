#!/usr/bin/env bash

# Usage: ./unlink-react.sh ../elephant-ui

set -e

LIB_PATH="$1"
APP_PATH="$(pwd)"

if [ -z "$LIB_PATH" ]; then
  echo "Usage: $0 <relative/path/to/library>"
  exit 1
fi

# Resolve absolute path
LIB_PATH="$(cd "$LIB_PATH" && pwd)"
PKG_NAME=$(node -p "require('$LIB_PATH/package.json').name")

echo "🔗 Unlinking $PKG_NAME from the app..."
(cd "$APP_PATH" && npm unlink "$PKG_NAME")

echo "📦 Unlinking the library globally..."
(cd "$LIB_PATH" && npm unlink)

echo "🧹 Unlink complete for $PKG_NAME."
