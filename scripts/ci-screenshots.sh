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

# With a large font the reading form is taller than the space left by the keyboard:
# it must scroll so that the Save button comes above the keyboard. Check screenshots only.
keyboard_check() { # lang meter_name
  adb shell settings put system font_scale 1.6
  launch
  tap "meter-1|$2"
  sleep 2
  tap "add-reading|Add a reading|Ajouter un relevé"
  sleep 3
  keyboard_shown || echo "Keyboard not shown for the keyboard check" >&2
  shot "check-$1-keyboard-large-font"
  adb shell input swipe 540 700 540 250 600
  sleep 2
  shot "check-$1-keyboard-large-font-scrolled"
  hide_keyboard
  adb shell input keyevent 4
  adb shell settings put system font_scale 1.0
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

# Home-screen widget: the provider must be registered; the deep link of a widget row must open the form.
check_widget() { # lang
  local lang=$1
  # Listed as ComponentInfo{com.pomwik.meterlog/com.pomwik.meterlog.widget.LogReading}
  if ! adb shell dumpsys appwidget | grep -E "$PKG/($PKG)?\.widget\.LogReading"; then
    adb shell dumpsys appwidget | head -40
    echo "Widget provider not registered"
    exit 1
  fi

  adb shell am force-stop "$PKG"
  adb shell am start -W -a android.intent.action.VIEW -d "meterlog://reading?meterId=1" "$PKG" >/dev/null
  sleep 6
  find_xy "reading-value|Number shown on the meter|Nombre affiché sur le compteur" >/dev/null
  shot "$lang-10-deep-link-reading"

  # Optional: ask the launcher to pin the widget, accept its prompt, then show the home screen.
  launch
  tap "settings|Settings|Réglages"
  sleep 2
  tap "add-widget"
  sleep 3
  shot "$lang-11-pin-prompt"
  if tap "add_button|Add to home screen|Add automatically|Ajouter à l’écran d’accueil|Ajouter à l'écran d'accueil|Ajouter automatiquement" 2>/dev/null; then
    sleep 3
    adb shell input keyevent 3
    sleep 4
    shot "$lang-12-widget-home"
  else
    echo "Launcher pin prompt not found: widget not placed on the home screen"
  fi
  adb shell dumpsys appwidget | grep -A3 "$PKG" || true
  check_crash
}

run en
check_widget en
set_locale fr-FR
run fr
check_widget fr
# Last, because changing the font scale saves the locale and can undo a later locale switch.
keyboard_check fr Maison

ls -l "$OUT"
