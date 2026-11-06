import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probeManifest,httpsAlternative} from '../browser/stream-probe.js';
test('HTTP fallback upgrades the same CDN and preserves the path/query; never downgrades TLS or rewrites IP hosts',()=>{
  assert.equal(httpsAlternative('http://cdn.example.com/live/a.m3u8?x=1'),'https://cdn.example.com/live/a.m3u8?x=1');
  assert.equal(httpsAlternative('https://cdn.example.com/live/a.m3u8'),'');assert.equal(httpsAlternative('http://127.0.0.1:8000/a.m3u8'),'');
});
test('manifest probe distinguishes authorization, invalid payload and network failures without leaking URLs',async()=>{
  const original=globalThis.XMLHttpRequest,oldWindow=globalThis.window;let fixture={};let instance;
  class XHR{
    constructor(){instance=this;this.headers={};}
    open(){}setRequestHeader(key,value){this.headers[key]=value;}
    send(){queueMicrotask(()=>{this.status=fixture.status;this.responseText=fixture.text;if(fixture.network)this.onerror();else this.onload();});}
    abort(){this.onabort();}
  }
  globalThis.XMLHttpRequest=XHR;
  try{
    fixture={status:403,text:'private'};
    await assert.rejects(probeManifest('https://example.com/live.m3u8?token=secret',{'Content-Auth':'test','User-Agent':'reserved'}).promise,error=>error.status===403&&error.kind==='http'&&!error.message.includes('secret'));
    assert.equal(instance.headers['Content-Auth'],'test');assert.equal(instance.headers['User-Agent'],undefined);
    fixture={status:200,text:'<html>Denied</html>'};await assert.rejects(probeManifest('https://example.com/live').promise,error=>error.kind==='invalid-playlist');
    fixture={network:true};await assert.rejects(probeManifest('https://example.com/live').promise,error=>error.kind==='network-or-cors');
    fixture={status:200,text:'#EXTM3U\n#EXT-X-ENDLIST'};assert.equal((await probeManifest('https://example.com/live').promise).status,200);
    let calls=0;globalThis.window={XuperNativeTransport:{snapshot:()=>({available:true}),request:async()=>{calls++;return null;}}};
    assert.equal((await probeManifest('https://example.com/live').promise).status,200);assert.equal(calls,1);
  }finally{globalThis.XMLHttpRequest=original;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}
});
