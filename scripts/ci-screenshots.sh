#!/usr/bin/env bash
# Runs inside the Android emulator job of .github/workflows/android.yml.
# Takes the same screenshots in English, then in French, with sample data typed through the UI.
# Tap targets are found with `uiautomator dump` (scripts/ui.py), never with fixed coordinates.
set -euo pipefail

PKG=com.pomwik.meterlog
OUT=screenshots
mkdir -p "$OUT"

UI="python3 scripts/ui.py"

shot() {
  adb exec-out screencap -p > "$OUT/$1.png"
  echo "screenshot $1"
}

find_xy() {
  local xy=""
  for _ in $(seq 1 10); do
    if xy=$($UI find "$1"); then echo "$xy"; return 0; fi
    sleep 1
  done
  echo "Not found on screen: $1" >&2
  $UI dump >&2 || true
  return 1
}

tap() {
  local xy
  xy=$(find_xy "$1")
  # shellcheck disable=SC2086
  adb shell input tap $xy
}

keyboard_shown() {
  adb shell dumpsys input_method | grep -qE "mInputShown=true"
}

hide_keyboard() {
  if keyboard_shown; then adb shell input keyevent 4; sleep 1; fi
  if keyboard_shown; then echo "Keyboard still shown" >&2; return 1; fi
}

launch() {
  adb shell am force-stop "$PKG"
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 8
}

check_crash() {
  if adb logcat -d | grep -q "FATAL EXCEPTION"; then
    adb logcat -d | grep -A30 "FATAL EXCEPTION"
    echo "App crashed"
    exit 1
  fi
}

# Previous-day taps are sent from inside the device: much faster than one adb call per tap.
add_reading() { # days_ago value
  tap "add-reading|Add a reading|Ajouter un relevé"
  sleep 2
  if [ "$1" -gt 0 ]; then
    local xy
    xy=$(find_xy "previous-day|Previous day|Jour précédent")
    adb shell "for i in \$(seq 1 $1); do input tap $xy; done"
  fi
  tap "reading-value|Number shown on the meter|Nombre affiché sur le compteur"
  adb shell input text "$2"
  hide_keyboard
}

save() {
  tap "save|Save|Enregistrer"
  sleep 2
}

run() { # lang
  local lang=$1 name price add_label
  if [ "$lang" = fr ]; then
    name=Maison; price="0,25"; add_label="Ajouter un compteur"
  else
    name=Home; price="0.25"; add_label="Add a meter"
  fi

  adb shell pm clear "$PKG" >/dev/null
  adb shell cmd uimode night no
  adb logcat -c
  launch
  # The UI must really be in the expected language.
  find_xy "$add_label" >/dev/null
  shot "$lang-01-meters-empty"

  tap "add-meter|$add_label"
  sleep 3
  adb shell input text "$name"
  hide_keyboard
  shot "$lang-02-new-meter"

  # The price field is the lowest one: with the keyboard open, it and the Save button must stay reachable.
  tap "meter-price|e.g. 0.25|ex. 0,25"
  sleep 2
  adb shell input text "$price"
  sleep 1
  shot "$lang-03-new-meter-keyboard"
  # Scroll the form while the keyboard is open: the Save button must come above the keyboard.
  adb shell input swipe 540 900 540 300 500
  sleep 1
  shot "$lang-03b-new-meter-keyboard-scrolled"
  hide_keyboard
  save

  add_reading 75 12000
  save
  add_reading 45 12310
  save
  if [ "$lang" = fr ]; then add_reading 15 "12655,5"; else add_reading 15 "12655.5"; fi
  save
  add_reading 0 12790
  shot "$lang-04-new-reading"
  save
  shot "$lang-05-meter"
  adb shell input swipe 540 1900 540 700 600
  sleep 2
  shot "$lang-06-meter-readings"

  launch
  shot "$lang-07-meters"
  tap "settings|Settings|Réglages"
  sleep 2
  shot "$lang-08-settings"

  adb shell cmd uimode night yes
  launch
  tap "meter-1|$name"
  sleep 3
  shot "$lang-09-meter-dark"
  adb shell cmd uimode night no

  check_crash
}

set_locale() { # e.g. fr-FR
  adb root >/dev/null 2>&1 || true
  adb wait-for-device
  adb shell setprop persist.sys.locale "$1"
  adb shell setprop ctl.restart zygote
  sleep 10
  adb wait-for-device
  until adb shell pm path android >/dev/null 2>&1; do sleep 2; done
  until [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 2; done
  sleep 25
  echo "Locale: $(adb shell getprop persist.sys.locale)"
}

adb shell wm size
adb shell wm density
adb install -r apk/*.apk

run en
set_locale fr-FR
run fr

ls -l "$OUT"
