#!/usr/bin/env python3
"""Package the compiled autonomous widget. Signing is left to Apps2Samsung."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

def build(output=None):
    out = Path(output or ROOT / 'dist')
    out.mkdir(parents=True, exist_ok=True)
    app = ROOT / 'app'
    info = json.loads((app / 'vendor/build-info.json').read_text())
    sources = ['package.json', 'package-lock.json', 'tools/build-standalone.mjs', 'companion/lib/magis.js']
    sources += [str(p.relative_to(ROOT)) for p in (ROOT / 'browser').glob('*.js')]
    digest = hashlib.sha256()
    for name in sorted(sources):
        digest.update((name + '\0').encode())
        digest.update((ROOT / name).read_bytes())
    if info['sourceSha256'] != digest.hexdigest():
        raise RuntimeError('Bundle out of date. Run npm run build first.')
    assert info['hlsVersion'] == info['hlsWorkerVersion'] == json.loads((ROOT / 'package.json').read_text())['devDependencies']['hls.js']
    assert hashlib.sha256((app / 'vendor/hls-worker.js').read_bytes()).hexdigest() == info['hlsWorkerSha256']
    config = ET.parse(app / 'config.xml').getroot()
    application = config.find('{http://tizen.org/ns/widgets}application')
    assert application.attrib['required_version'] == '4.0'
    assert config.attrib['version'] == info['version'] == json.loads((ROOT / 'package.json').read_text())['version']
    version = info['version']
    widget = out / f'XuperTizen-{version}-alpha-Tizen4plus-UNSIGNED.wgt'
    def add(archive, file, name):
        entry = zipfile.ZipInfo(str(name).replace('\\', '/'), (2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, file.read_bytes())
    with zipfile.ZipFile(widget, 'w') as archive:
        for file in sorted(app.rglob('*')):
            if file.is_file() and not set(file.parts) & {'.buildResult', '__pycache__'}:
                add(archive, file, file.relative_to(app))
    kit = out / f'XuperTizen-{version}-source.zip'
    with zipfile.ZipFile(kit, 'w') as archive:
        for name in ['app', 'browser', 'native', 'companion', 'tools', 'docs', 'tests', '.github']:
            for file in sorted((ROOT / name).rglob('*')):
                if file.is_file() and not set(file.parts) & {'__pycache__', '.buildResult'}:
                    add(archive, file, Path('XuperTizen') / file.relative_to(ROOT))
        for name in ['README.md', 'LICENSE-UPSTREAM', 'package.json', 'package-lock.json', 'apps2samsung-source.json', '.gitignore', '.gitattributes']:
            add(archive, ROOT / name, Path('XuperTizen') / name)
        add(archive, widget, Path('XuperTizen/dist') / widget.name)
    sums = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (widget, kit)}
    (out / 'SHA256SUMS.json').write_text(json.dumps(sums, indent=2) + '\n')
    (out / 'release-info.json').write_text(json.dumps({
        'name': 'XuperTizen', 'version': version, 'channel': 'alpha', 'minimumTizen': '4.0',
        'hardwareValidation': 'v0.4.4-live-720p-worker-active-on-QN55QN70FAGXZS-v0.5.8-pending', 'providerValidation': 'v0.4.4-71s-playback-http200-one-reported-404-v0.5.8-pending',
        'standalone': True, 'pcRequiredAtRuntime': False, 'signed': False,
        'artifact': widget.name, 'sha256': sums[widget.name], 'hlsVersion': info['hlsVersion']
    }, indent=2) + '\n')
    return sums

if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--output')
    print(json.dumps(build(args.parse_args().output), indent=2))
