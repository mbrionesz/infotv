import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import http from 'node:http';
const require=createRequire(import.meta.url);const {createResolver}=require('../../desktop/dns.cjs'),{createMediaProxy,mediaSources}=require('../../desktop/media-proxy.cjs');
test('stalled secure resolvers do not hold a working Windows DNS fallback hostage',{timeout:1500},async()=>{
 let aborted=false;const resolver=createResolver({query:(_p,_h,signal)=>new Promise(()=>{signal.addEventListener('abort',()=>aborted=true);}),system:async()=>({address:'104.21.77.97'}),systemDelayMs:10,secureTimeoutMs:5000,systemTimeoutMs:100});
 const result=await resolver.resolve('video.example');assert.equal(result.mode,'system-fallback');assert.equal(aborted,true);
});
test('stalled Windows DNS and secure DNS both end with a bounded diagnostic',async()=>{
 const resolver=createResolver({query:()=>new Promise(()=>{}),system:()=>new Promise(()=>{}),systemDelayMs:1,secureTimeoutMs:25,systemTimeoutMs:20});
 await assert.rejects(resolver.resolve('unreachable.example'),error=>error.code==='DNS_UNAVAILABLE');
});
test('an invalid private Windows DNS answer cannot win over a secure public answer',async()=>{
 const resolver=createResolver({query:async()=>{await new Promise(r=>setTimeout(r,20));return ['104.21.77.97'];},system:async()=>({address:'127.0.0.1'}),systemDelayMs:1});
 assert.equal((await resolver.resolve('video.example')).mode,'secure-dns');
});
test('native media candidates never copy credentials across origins',()=>{
 const sources=mediaSources({url:'https://primary.example/video.ts',headers:{'Content-Auth':'primary'},backupUrls:['https://other.example/video.ts',{url:'https://backup.example/video.ts',headers:{'Content-Auth':'backup'}}]});
 assert.equal(sources.length,2);assert.equal(sources[1].headers['Content-Auth'],'backup');
});
for(const failure of ['dns','connect','http'])test('native proxy uses an authorized alternate after '+failure+' failure and retains the requested byte range',async()=>{
 let received;const origin=http.createServer((request,response)=>{received=request.headers;response.writeHead(206,{'Content-Range':'bytes 40-43/100','Content-Length':4});response.end(Buffer.from([4,3,2,1]));});
 await new Promise(r=>origin.listen(0,'127.0.0.1',r));
 const proxy=await createMediaProxy({stream:{url:'http://bad.example/video.ts',headers:{'Content-Auth':'primary'},backupUrls:[{url:'http://good.example/video.ts',headers:{'Content-Auth':'backup'}}]},resolver:{resolve:async host=>{if(host==='bad.example'&&failure==='dns')throw Object.assign(Error('failed'),{code:'DNS_UNAVAILABLE'});return {ip:'127.0.0.1',mode:'test'};}},modules:{http:{request:(options,callback)=>{
  if(options.hostname==='bad.example'&&failure==='connect'){const {EventEmitter}=require('node:events');const req=new EventEmitter();req.setTimeout=()=>{};req.destroy=()=>{};req.end=()=>queueMicrotask(()=>req.emit('error',Object.assign(Error('failed'),{code:'ECONNREFUSED'})));return req;}
  if(options.hostname==='bad.example'&&failure==='http'){return http.request({...options,port:origin.address().port},response=>{Object.defineProperty(response,'statusCode',{value:503});callback(response);});}
  return http.request({...options,port:origin.address().port},callback);
 }}}});
 try{const response=await fetch(proxy.url,{headers:{Range:'bytes=40-43'}});assert.equal(response.status,206);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[4,3,2,1]);assert.equal(received['content-auth'],'backup');assert.equal(received.range,'bytes=40-43');assert.equal(proxy.snapshot().sourceAttempt,2);assert.equal(proxy.snapshot().host,'good.example');assert.equal(proxy.snapshot().bytes,4);assert.doesNotMatch(JSON.stringify(proxy.snapshot()),/primary|backup/);}finally{proxy.close();origin.closeAllConnections();await new Promise(r=>origin.close(r));}
});
test('authorization rejection requests renewal and never tries another origin with those credentials',async()=>{
 let backups=0,renewals=0;const origin=http.createServer((_q,r)=>{r.writeHead(403);r.end();});await new Promise(r=>origin.listen(0,'127.0.0.1',r));
 const proxy=await createMediaProxy({stream:{url:'http://primary.example/video.ts',headers:{'Content-Auth':'primary'},backupUrls:[{url:'http://backup.example/video.ts',headers:{'Content-Auth':'backup'}}]},resolver:{resolve:async host=>{if(host==='backup.example')backups++;return {ip:'127.0.0.1'};}},onAuthFailure:()=>renewals++,modules:{http:{request:(options,callback)=>http.request({...options,port:origin.address().port},callback)}}});
 try{assert.equal((await fetch(proxy.url)).status,403);assert.equal(backups,0);assert.equal(renewals,1);}finally{proxy.close();origin.closeAllConnections();await new Promise(r=>origin.close(r));}
});

test('closing the proxy during DNS lookup never opens a remote connection afterwards',async()=>{
 let finishDns,attempts=0;
 const proxy=await createMediaProxy({stream:{url:'http://primary.example/video.ts'},resolver:{resolve:()=>new Promise(r=>finishDns=r)},modules:{http:{request(){attempts++;throw Error('Should not connect after close');}}}});
 const fetching=fetch(proxy.url).catch(()=>null);
 for(let i=0;i<100&&!finishDns;i++)await new Promise(r=>setTimeout(r,2));
 assert.ok(finishDns);proxy.close();finishDns({ip:'127.0.0.1'});
 await fetching;await new Promise(r=>setTimeout(r,10));assert.equal(attempts,0);
});
