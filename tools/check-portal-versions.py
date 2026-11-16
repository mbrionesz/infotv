#!/usr/bin/env python3
"""Read public client configuration; never authenticate to the portal or apply it."""
import argparse, datetime, io, json, os, re, urllib.request, zipfile
from pathlib import Path

LG='cristianco7/XUPER-HYDRA-PORT-WEBOS'
SAMSUNG='tizenxupertv/TizenXuperTV'
LG_PATH='webos/services/com.webosflux.xuptertv.fidelity.service/magis.js'
LIMIT=12*1024*1024

def read(url,limit=LIMIT):
    if not url.startswith(('https://api.github.com/','https://raw.githubusercontent.com/','https://github.com/')):
        raise ValueError('Unexpected source')
    headers={'User-Agent':'XuperTizen-public-client-watch','Accept':'application/vnd.github+json' if 'api.github.com/' in url else '*/*'}
    token=os.environ.get('GITHUB_TOKEN','')
    if token and url.startswith('https://api.github.com/'):headers['Authorization']='Bearer '+token
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as response:
        data=response.read(limit+1)
    if len(data)>limit:raise ValueError('Public source too large')
    return data

def values(source):
    def field(names):
        for name in names:
            match=re.search(r'(?<![\w])'+name+r'\s*[:=]\s*["\']([^"\']{1,80})["\']',source)
            if match:return match.group(1)
        raise ValueError('Client version fields were not found')
    result={'apkVersion':field(['APK_VERSION','apkVersion']),'apkVer':field(['APK_VER_HEADER','apkVerHeader']),'spkgVer':field(['SPKG_VER','sysVersion'])}
    if not result['apkVersion'].isdigit() or not result['apkVer'].isdigit() or not re.fullmatch(r'[\d _:\-]+',result['spkgVer']):raise ValueError('Unexpected version format')
    return result

def collect(previous=None,fetch=read,now=None):
    now=now or datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
    result={'schemaVersion':1,'checkedAt':now,'sources':[],'note':'Public client configuration only. Not a portal-server version or proof of compatibility.'}
    for kind,repo in [('lg',LG),('samsung',SAMSUNG)]:
        item={'id':kind,'url':'https://github.com/'+repo,'status':'unavailable'}
        try:
            if kind=='lg':
                commit=json.loads(fetch('https://api.github.com/repos/'+repo+'/commits?path='+LG_PATH+'&per_page=1'))[0]
                revision=commit['sha'];content=fetch('https://raw.githubusercontent.com/'+repo+'/'+revision+'/'+LG_PATH).decode('utf-8')
                published=commit['commit']['committer']['date']
            else:
                release=json.loads(fetch('https://api.github.com/repos/'+repo+'/releases/latest'))
                asset=next(a for a in release['assets'] if a['name']=='TizenXuperTV.wgt')
                if asset['size']>LIMIT:raise ValueError('Public widget too large')
                with zipfile.ZipFile(io.BytesIO(fetch(asset['browser_download_url']))) as archive:
                    info=archive.getinfo('js/magis-client.js')
                    if info.file_size>3*1024*1024:raise ValueError('Client source too large')
                    content=archive.read(info).decode('utf-8')
                revision=release['tag_name'];published=release['published_at']
            item.update(status='ok',revision=revision,publishedAt=published,values=values(content),lastSuccessAt=now)
        except Exception as error:
            old=next((v for v in (previous or {}).get('sources',[]) if v.get('id')==kind),{})
            for key in ['values','revision','publishedAt','lastSuccessAt']:
                if key in old:item[key]=old[key]
            item['reason']=type(error).__name__
        result['sources'].append(item)
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',default='data/portal-client-watch.json');args=parser.parse_args();path=Path(args.output)
    try:previous=json.loads(path.read_text())
    except (OSError,ValueError):previous=None
    result=collect(previous);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'checkedAt':result['checkedAt'],'sources':[{'id':s['id'],'status':s['status'],'revision':s.get('revision')} for s in result['sources']]}))
