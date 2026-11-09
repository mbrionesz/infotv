#!/usr/bin/env python3
"""Create a personal WGT with a locally supplied TMDB credential. Never publish it."""
import argparse, hashlib, json, os, re, zipfile
from pathlib import Path

def build(source, key_file, output):
    key = Path(key_file).read_text().strip()
    if not re.fullmatch(r'[A-Za-z0-9._-]{20,2048}', key):
        raise ValueError('Invalid credential format')
    fingerprint = hashlib.sha256(key.encode()).hexdigest()[:16]
    script = ('try{if(localStorage.getItem("xt.tmdbProvision")!==' + json.dumps(fingerprint) + '){'
              'localStorage.setItem("xt.tmdbToken",' + json.dumps(key) + ');'
              'localStorage.setItem("xt.tmdbProvision",' + json.dumps(fingerprint) + ');}}catch(_){}')
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as base, zipfile.ZipFile(output, 'w') as target:
        for entry in base.infolist():
            data = base.read(entry.filename)
            if entry.filename == 'index.html':
                data = data.decode().replace('<script src="js/bootstrap.js">', '<script src="js/tmdb-personal.js"></script>\n<script src="js/bootstrap.js">', 1).encode()
            target.writestr(entry, data)
        target.writestr('js/tmdb-personal.js', script, compress_type=zipfile.ZIP_DEFLATED)
    os.chmod(output, 0o600)
    return output

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--key-file', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    artifact = build(args.source, args.key_file, args.output)
    print(json.dumps({'artifact': str(artifact), 'private': True, 'sha256': hashlib.sha256(artifact.read_bytes()).hexdigest()}))
