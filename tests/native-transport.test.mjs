import test from 'node:test';import assert from 'node:assert/strict';
import {createNativeTransport} from '../browser/dnsx.js';
function workers({dns={ip:'203.0.113.7',ttl:600,resolver:'8.8.8.8'},available=true}={}){
 const calls=[];return {calls,factory:()=>{const worker={terminate(){},postMessage(message){calls.push(message);queueMicrotask(()=>worker.onmessage({data:{id:message.id,result:message.method==='dns'?dns:{status:200,headers:'Content-Type: text/plain',body:new TextEncoder().encode('ok').buffer}}}));}};queueMicrotask(()=>worker.onmessage({data:{ready:available,reason:'unsupported'}}));return worker;}};
}
test('native HTTP uses resolved IP while preserving URL hostname and per-request headers; DNS is deduplicated and cached',async()=>{
 const mock=workers(),transport=createNativeTransport({workerFactory:mock.factory});
 try{
  const results=await Promise.all([transport.request({url:'https://cdn.example/live.m3u8',headers:{'Content-Auth':'secret-a'}}),transport.request({url:'https://cdn.example/segment.ts',headers:{'Content-Auth':'secret-a'}})]);
  assert.equal(results[0].status,200);assert.equal(mock.calls.filter(call=>call.method==='dns').length,1);
  for(const call of mock.calls.filter(call=>call.method==='http')){assert.equal(call.options.ip,'203.0.113.7');assert.equal(call.options.host,'cdn.example');assert.ok(call.options.url.startsWith('https://cdn.example/'));assert.equal(call.options.headers,'Content-Auth: secret-a');}
  assert.equal(transport.snapshot().hosts[0].mode,'secure-dns');
  await assert.rejects(transport.request({url:'https://cdn.example/',headers:{Test:'a\r\nInjected: bad'}}));
 }finally{transport.dispose();}
});
test('native DNS failure falls back to system for five minutes; missing TV extension returns control to XHR',async()=>{
 const mock=workers({dns:{}}),transport=createNativeTransport({workerFactory:mock.factory});
 try{await transport.request({url:'https://one.example/a'});await transport.request({url:'https://two.example/a'});assert.equal(mock.calls.filter(call=>call.method==='dns').length,1);assert.ok(mock.calls.filter(call=>call.method==='http').every(call=>call.options.ip===''));assert.equal(transport.snapshot().hosts[0].mode,'system-fallback');}finally{transport.dispose();}
 const absent=workers({available:false}),fallback=createNativeTransport({workerFactory:absent.factory});try{assert.equal(await fallback.request({url:'https://example.com'}),null);assert.equal(fallback.snapshot().available,false);}finally{fallback.dispose();}
});
test('a failed native HTTP transfer returns control to XHR for the session and retains a safe cURL code',async()=>{
 let count=0;const mock=workers();const factory=()=>{const worker=mock.factory();const send=worker.postMessage;worker.postMessage=message=>{if(message.method==='http'){count++;queueMicrotask(()=>worker.onmessage({data:{id:message.id,error:'Native transfer failed',nativeCode:60}}));}else send(message);};return worker;};
 const transport=createNativeTransport({workerFactory:factory});
 try{
  assert.equal(await transport.request({url:'https://cdn.example/'}),null);
  assert.equal(transport.snapshot().available,false);assert.equal(transport.snapshot().nativeDisabled,true);assert.equal(transport.snapshot().lastFailure.code,60);
  assert.equal(await transport.request({url:'https://cdn.example/again'}),null);assert.equal(count,1);
  assert.deepEqual(transport.snapshot().dnsServers,['1.1.1.1','1.0.0.1','8.8.8.8','8.8.4.4','94.140.14.14','94.140.15.15']);
 }finally{transport.dispose();}
});
test('HTTP authorization errors remain HTTP errors and do not disable native DNS',async()=>{
 const mock=workers();const factory=()=>{const worker=mock.factory();const send=worker.postMessage;worker.postMessage=message=>{if(message.method==='http')queueMicrotask(()=>worker.onmessage({data:{id:message.id,result:{status:403,body:new ArrayBuffer(0),headers:''}}}));else send(message);};return worker;};
 const transport=createNativeTransport({workerFactory:factory});try{assert.equal((await transport.request({url:'https://cdn.example/'})).status,403);assert.equal(transport.snapshot().available,true);}finally{transport.dispose();}
});
