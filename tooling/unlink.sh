#!/usr/bin/env bash

# Usage: ./unlink-react.sh ../elephant-ui

set -e

LIB_PATH="$1"
if [ -z "$LIB_PATH" ]; then
  echo "Usage: $0 <relative/path/to/library>"
  exit 1
fi

LIB_PATH="$(cd "$LIB_PATH" && pwd)"
APP_PATH="$(pwd)"
LIB_NAME=$(node -p "require('$LIB_PATH/package.json').name")

# Using npm install of npm unlink, this will restore to package.json version of previously linked
# package. npm unlink will _remove_ the previously linked package.
echo "📦 Reinstalling $LIB_NAME from registry in $APP_PATH..."
(cd "$APP_PATH" && npm install)

echo "📦 Reinstalling dependencies in $LIB_PATH..."
(cd "$LIB_PATH" && npm install)

echo "📦 Reinstalling dependencies in $APP_PATH..."
if ! (cd "$APP_PATH" && npm install &>/dev/null); then
  echo "npm install failed in $APP_PATH" >&2
  (cd "$APP_PATH" && npm ci)
fi

echo "👍 Unlink complete. $LIB_NAME and $APP_PATH restored."
