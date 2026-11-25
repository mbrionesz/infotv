#!/usr/bin/env bash
set -euo pipefail
# Run PiP before tests change the emulator's display size/density. Repeated global
# display overrides can stall Android's PiP transition on the software renderer.
android_qa_repository=$(git rev-parse --show-toplevel)
cd "$android_qa_repository/android"
mkdir -p qa-evidence/pip
android_qa_cleanup() {
  android_qa_exit=$?
  adb pull /data/local/tmp/xuperandroid-qa qa-screenshots || true
  if [ "$android_qa_exit" -ne 0 ]; then
    adb shell dumpsys activity activities > qa-evidence/activity-state.txt || true
    android_qa_pid=$(adb shell pidof -s com.matiasb.xuperandroid | tr -d '\r' || true)
    if [[ "$android_qa_pid" =~ ^[0-9]+$ ]]; then
      adb logcat -d --pid="$android_qa_pid" > qa-evidence/app-logcat.txt || true
    fi
  fi
  exit "$android_qa_exit"
}
trap android_qa_cleanup EXIT

# PiP is a WindowManager transition. Run it with the platform animation clocks
# enabled; disabling those clocks can strand Android 15's leave-PiP animation.
for scale in window_animation_scale transition_animation_scale animator_duration_scale; do
  adb shell settings put global "$scale" 1
done
android_qa_pip_status=0
timeout 240s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.annotation=com.matiasb.xuperandroid.PipPlatformTest || android_qa_pip_status=$?
python3 - <<'PY' || android_qa_pip_status=1
from pathlib import Path
import xml.etree.ElementTree as E
rows=[E.parse(p).getroot().attrib for p in Path('app/build/outputs/androidTest-results/connected/debug').glob('TEST-*.xml')]
assert sum(int(r.get('tests',0)) for r in rows)==1, rows
assert all(int(r.get('failures',0))+int(r.get('errors',0))+int(r.get('skipped',0))==0 for r in rows), rows
PY
cp -a app/build/reports/androidTests qa-evidence/pip/reports
cp -a app/build/outputs/androidTest-results qa-evidence/pip/results
for scale in window_animation_scale transition_animation_scale animator_duration_scale; do
  adb shell settings put global "$scale" 0
done

# Keep viewport captures after functional tests: global wm overrides can steal window focus.
timeout 360s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.notAnnotation=com.matiasb.xuperandroid.PipPlatformTest,com.matiasb.xuperandroid.ViewportCaptureTest,com.matiasb.xuperandroid.PortalProbe
python3 - <<'CHECK'
from pathlib import Path
import xml.etree.ElementTree as E
rows=[E.parse(p).getroot().attrib for p in Path('app/build/outputs/androidTest-results/connected/debug').glob('TEST-*.xml')]
assert sum(int(r.get('tests',0)) for r in rows)==13, rows
assert all(int(r.get('failures',0))+int(r.get('errors',0))+int(r.get('skipped',0))==0 for r in rows), rows
CHECK
mkdir -p qa-evidence/functional
cp -a app/build/reports/androidTests qa-evidence/functional/reports
cp -a app/build/outputs/androidTest-results qa-evidence/functional/results

timeout 180s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.annotation=com.matiasb.xuperandroid.ViewportCaptureTest
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
  timeout 180s ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.annotation=com.matiasb.xuperandroid.PortalProbe -Pandroid.testInstrumentationRunnerArguments.allowPortalNetwork=true
fi

# Preserve functional/capture evidence even when PiP failed, without passing CI.
exit "$android_qa_pip_status"
