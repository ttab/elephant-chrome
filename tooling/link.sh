#!/usr/bin/env bash

# Usage: ./link-react.sh ../elephant-ui

set -e

LIB_PATH="$1"
LIB_NAME=$(node -p "require('$LIB_PATH/package.json').name")

APP_PATH="$(pwd)"
APP_NAME=$(node -p "require('$APP_PATH/package.json').name")

if [ -z "$LIB_PATH" ]; then
  echo "Usage: $0 <relative/path/to/library>"
  exit 1
fi

# Resolve absolute path
LIB_PATH="$(cd "$LIB_PATH" && pwd)"

APP_NODE_MODULES="$APP_PATH/node_modules"

if [ ! -d "$APP_NODE_MODULES" ]; then
  echo "⚠ node_modules not installed at $APP_NODE_MODULES."
  exit 1
fi

# In LIB_PATH, link the library globally
echo "📦 Making $LIB_NAME linkable..."
if ! (cd "$LIB_PATH" && npm link >/dev/null); then
  echo "npm link failed for $LIB_PATH" >&2
fi

# In APP_PATH, link the library into the app
echo "🔗 Linking $LIB_NAME into $APP_NAME..."
if ! (cd "$APP_PATH" && npm link "$LIB_NAME" >/dev/null); then
  echo "npm link failed for $LIB_NAME" >&2
fi

echo "🧹 Cleaning up duplicated peer dependencies..."
LINK_PACKAGES=(
  "react"
  "react-dom"
  "@types/react"
  "@types/react-dom"
  "@slate-yjs/core"
  "@slate-yjs/react"
  "slate"
  "slate-react"
  "slate-history"
  "yjs"
)

for PACKAGE in "${LINK_PACKAGES[@]}"; do
  SOURCE="$APP_NODE_MODULES/$PACKAGE"
  DEST="$LIB_PATH/node_modules/$PACKAGE"

  if [ ! -e "$SOURCE" ]; then
    echo "⚠ Skipping $PACKAGE; not found in app node_modules."
    continue
  fi

  echo "   - Linking $PACKAGE"
  rm -rf "$DEST"
  mkdir -p "$(dirname "$DEST")"
  ln -s "$SOURCE" "$DEST"
done

echo "🧹 Removing vite cache..."
rm -rf "$APP_PATH/node_modules/.vite"

echo "👍 $LIB_NAME is linked with react and react-dom from the app."
