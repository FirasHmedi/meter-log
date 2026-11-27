#!/usr/bin/env bash
# Runs inside the Android emulator job of .github/workflows/android.yml.
set -euo pipefail

PKG=com.pomwik.meterlog
mkdir -p screenshots

adb install -r apk/*.apk
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 12
adb exec-out screencap -p > screenshots/01-meters-empty.png

# Tap the "Add a meter" button, fixed at the bottom of the screen.
SIZE=$(adb shell wm size | sed -E 's/.*: ([0-9]+)x([0-9]+).*/\1 \2/')
W=${SIZE% *}
H=${SIZE#* }
adb shell input tap $((W / 2)) $((H - H / 12))
sleep 4
adb exec-out screencap -p > screenshots/02-new-meter.png

# Same first screen in dark mode.
adb shell am force-stop "$PKG"
adb shell cmd uimode night yes
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 8
adb exec-out screencap -p > screenshots/03-meters-dark.png

ls -l screenshots
