#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${SCRIPT_DIR:h}"
APP_DIR="$PROJECT_ROOT/BlogImage.app"
CONTENTS_DIR="$APP_DIR/Contents"

mkdir -p "$CONTENTS_DIR/MacOS" "$CONTENTS_DIR/Resources" /tmp/blogimage-swift-module-cache

/usr/bin/swiftc \
  -parse-as-library \
  -O \
  -module-cache-path /tmp/blogimage-swift-module-cache \
  -framework SwiftUI \
  -framework AppKit \
  "$SCRIPT_DIR/RenderService.swift" \
  "$SCRIPT_DIR/BlogImageApp.swift" \
  -o "$CONTENTS_DIR/MacOS/BlogImage"

/bin/cp "$SCRIPT_DIR/Info.plist" "$CONTENTS_DIR/Info.plist"
/bin/cp "$SCRIPT_DIR/AppIcon.icns" "$CONTENTS_DIR/Resources/AppIcon.icns"
/usr/bin/codesign --force --deep --sign - "$APP_DIR"

print "Built: $APP_DIR"
