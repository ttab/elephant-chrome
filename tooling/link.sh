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

APP_REACT="$APP_PATH/node_modules/react"
APP_REACT_DOM="$APP_PATH/node_modules/react-dom"
APP_TYPES_REACT="$APP_PATH/node_modules/@types/react"
APP_TYPES_REACT_DOM="$APP_PATH/node_modules/@types/react-dom"

if [ ! -d "$APP_REACT" ]; then
  echo "⚠ React not found in app's node_modules."
  exit 1
fi

if [ ! -d "$APP_REACT_DOM" ]; then
  echo "⚠ ReactDOM not found in app's node_modules."
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

echo "🧹 Removing $LIB_NAME react, react-dom and @types..."
rm -rf "$LIB_PATH/node_modules/react"
rm -rf "$LIB_PATH/node_modules/react-dom"
rm -rf "$LIB_PATH/node_modules/@types/react"
rm -rf "$LIB_PATH/node_modules/@types/react-dom"

echo "🔗 Linking react, react-dom and @types from $APP_NAME to $LIB_NAME..."
ln -s "$APP_REACT" "$LIB_PATH/node_modules/react"
ln -s "$APP_REACT_DOM" "$LIB_PATH/node_modules/react-dom"
ln -s "$APP_TYPES_REACT" "$LIB_PATH/node_modules/@types/react"
ln -s "$APP_TYPES_REACT_DOM" "$LIB_PATH/node_modules/@types/react-dom"

echo "🧹 Removing vite cache..."
rm -rf "$APP_PATH/node_modules/.vite"

echo "👍 $LIB_NAME is linked with react and react-dom from the app."
