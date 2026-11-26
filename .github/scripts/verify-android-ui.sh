#!/usr/bin/env bash
set -euo pipefail
# Run PiP before tests change the emulator's display size/density. Repeated global
# display overrides can stall Android's PiP transition on the software renderer.
android_qa_repository=$(git rev-parse --show-toplevel)
cd "$android_qa_repository/android"
mkdir -p qa-evidence/pip
android_qa_cleanup() {
  android_qa_exit=$?
  timeout -k 5s 15s adb pull /data/local/tmp/xuperandroid-qa qa-screenshots || true
  if [ "$android_qa_exit" -ne 0 ]; then
    timeout -k 5s 15s adb shell dumpsys activity activities > qa-evidence/activity-state.txt || true
    android_qa_pid=$(timeout -k 5s 15s adb shell pidof -s com.matiasb.xuperandroid | tr -d '\r' || true)
    if [[ "$android_qa_pid" =~ ^[0-9]+$ ]]; then
      timeout -k 5s 15s adb logcat -d --pid="$android_qa_pid" > qa-evidence/app-logcat.txt || true
    fi
  fi
  exit "$android_qa_exit"
}
trap android_qa_cleanup EXIT

# Dismiss Android's one-time immersive tutorial in the test image. It owns a
# separate focusable system window and can intercept hardware keys/PiP taps.
adb shell settings put secure immersive_mode_confirmations confirmed
# Exercise the device IME even though the emulator exposes a hardware keyboard.
adb shell settings put secure show_ime_with_hard_keyboard 1
android_qa_pip_status=0
if [ "${XUPER_QA_SUITE:-complete}" != functional ]; then
# PiP is a WindowManager transition. Run it with the platform animation clocks
# enabled; disabling those clocks can strand Android 15's leave-PiP animation.
for scale in window_animation_scale transition_animation_scale animator_duration_scale; do
  adb shell settings put global "$scale" 1
done
android_qa_pip_status=0
timeout -k 15s 240s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.annotation=com.matiasb.xuperandroid.PipPlatformTest || android_qa_pip_status=$?
python3 - <<'PY' || android_qa_pip_status=1
from pathlib import Path
import xml.etree.ElementTree as E
rows=[E.parse(p).getroot().attrib for p in Path('app/build/outputs/androidTest-results/connected/debug').glob('TEST-*.xml')]
assert sum(int(r.get('tests',0)) for r in rows)==1, rows
assert all(int(r.get('failures',0))+int(r.get('errors',0))+int(r.get('skipped',0))==0 for r in rows), rows
PY
cp -a app/build/reports/androidTests qa-evidence/pip/reports
cp -a app/build/outputs/androidTest-results qa-evidence/pip/results
# A failed native window transition may invalidate the emulator graphics context.
# Fail promptly rather than run further tests against that damaged instance.
if [ "$android_qa_pip_status" -ne 0 ]; then exit "$android_qa_pip_status"; fi
for scale in window_animation_scale transition_animation_scale animator_duration_scale; do
  adb shell settings put global "$scale" 0
done

if [ "${XUPER_QA_SUITE:-complete}" = pip ]; then exit "$android_qa_pip_status"; fi
fi

# Keep viewport captures after functional tests: global wm overrides can steal window focus.
timeout -k 15s 360s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.notAnnotation=com.matiasb.xuperandroid.PipPlatformTest,com.matiasb.xuperandroid.ViewportCaptureTest,com.matiasb.xuperandroid.PortalProbe
python3 - <<'CHECK'
from pathlib import Path
import xml.etree.ElementTree as E
rows=[E.parse(p).getroot().attrib for p in Path('app/build/outputs/androidTest-results/connected/debug').glob('TEST-*.xml')]
assert sum(int(r.get('tests',0)) for r in rows)==19, rows
assert all(int(r.get('failures',0))+int(r.get('errors',0))+int(r.get('skipped',0))==0 for r in rows), rows
CHECK
mkdir -p qa-evidence/functional
cp -a app/build/reports/androidTests qa-evidence/functional/reports
cp -a app/build/outputs/androidTest-results qa-evidence/functional/results

timeout -k 15s 180s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.annotation=com.matiasb.xuperandroid.ViewportCaptureTest
python3 - <<'CHECK'
from pathlib import Path
import xml.etree.ElementTree as E
rows=[E.parse(p).getroot().attrib for p in Path('app/build/outputs/androidTest-results/connected/debug').glob('TEST-*.xml')]
assert sum(int(r.get('tests',0)) for r in rows)==1, rows
assert all(int(r.get('failures',0))+int(r.get('errors',0))+int(r.get('skipped',0))==0 for r in rows), rows
CHECK
mkdir -p qa-evidence/captures
cp -a app/build/reports/androidTests qa-evidence/captures/reports
cp -a app/build/outputs/androidTest-results qa-evidence/captures/results

if [ "${XUPER_PORTAL_PROBE:-0}" = 1 ]; then
  # This produces a redacted diagnostic, not an assertion that the real portal is available.
  timeout -k 15s 180s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.annotation=com.matiasb.xuperandroid.PortalProbe -Pandroid.testInstrumentationRunnerArguments.allowPortalNetwork=true
fi

# Preserve functional/capture evidence even when PiP failed, without passing CI.
exit "$android_qa_pip_status"
