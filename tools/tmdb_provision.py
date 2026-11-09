"""Provision a widget using a build-time credential, without editing source files."""
import hashlib
import json
import re
import zipfile
from pathlib import Path

def provision_widget(source, output, key, *, filename='js/tmdb-default.js', preserve_existing=True):
    if not re.fullmatch(r'[A-Za-z0-9._-]{20,2048}', key):
        raise ValueError('Invalid TMDB credential format')
    fingerprint = hashlib.sha256(key.encode()).hexdigest()[:16]
    assign = 'localStorage.setItem("xt.tmdbToken",' + json.dumps(key) + ');'
    if preserve_existing:
        assign = 'if(!localStorage.getItem("xt.tmdbToken")){' + assign + '}'
    default = ('if(typeof window!=="undefined")window.XuperTmdbDefaultToken=' + json.dumps(key) + ';') if preserve_existing else ''
    script = ('try{' + default + 'if(localStorage.getItem("xt.tmdbProvision")!==' + json.dumps(fingerprint) + '){'
              + assign + 'localStorage.setItem("xt.tmdbProvision",' + json.dumps(fingerprint)
              + ');}}catch(_){}')
    with zipfile.ZipFile(source) as base, zipfile.ZipFile(output, 'w') as target:
        for entry in base.infolist():
            if entry.filename == filename:
                continue
            data = base.read(entry.filename)
            if entry.filename == 'index.html':
                html = data.decode()
                tag = '<script src="' + filename + '"></script>'
                if tag not in html:
                    anchor = '<script src="js/bootstrap.js">'
                    if anchor not in html:
                        raise ValueError('Widget bootstrap anchor missing')
                    html = html.replace(anchor, tag + '\n' + anchor, 1)
                data = html.encode()
            target.writestr(entry, data)
        entry = zipfile.ZipInfo(filename, (2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        target.writestr(entry, script)
    return Path(output)
