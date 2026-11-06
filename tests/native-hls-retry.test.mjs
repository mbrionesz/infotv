import test from 'node:test';import assert from 'node:assert/strict';import {nativeHlsLoad,hlsRange} from '../browser/native-hls-loader.js';
test('ordinary HLS contexts omit Range; explicit byte ranges retain their exclusive end',()=>{
 for(const context of [{},{rangeStart:0,rangeEnd:0},{rangeStart:5,rangeEnd:0},{rangeStart:-1,rangeEnd:8}])assert.equal(hlsRange(context),'');
 assert.equal(hlsRange({rangeStart:0,rangeEnd:16}),'bytes=0-15');assert.equal(hlsRange({rangeStart:16,rangeEnd:32}),'bytes=16-31');
});
test('native live playlist retries a transient 404 without sending invalid ranges or resetting playback',async()=>{
 let calls=0,retries=0;const loader={stats:{loading:{start:0}}};
 await new Promise((resolve,reject)=>nativeHlsLoad(loader,{request:async options=>{
  calls++;assert.equal(options.headers.Range,undefined);return {status:calls===1?404:200,body:new TextEncoder().encode('#EXTM3U\n').buffer};
 }},{url:'https://example.com/live.m3u8',type:'level',rangeEnd:0},{timeout:1500},{onSuccess:()=>resolve(),onError:()=>reject(new Error('Did not retry')),onTimeout:()=>reject(new Error('Timeout'))},{},null,()=>retries++));
 assert.equal(calls,2);assert.equal(retries,1);assert.equal(loader.stats.retry,1);
});
test('native HLS preserves authorization failures and reports a real download interval to ABR',async()=>{
 let calls=0;const loader={stats:{loading:{start:0}}};
 await new Promise((resolve,reject)=>nativeHlsLoad(loader,{request:async()=>{calls++;return {status:403};}},{url:'https://example.com/key',responseType:'arraybuffer'},{timeout:1000},{onSuccess:()=>reject(new Error('Unauthorized')),onError:error=>{assert.equal(error.code,403);resolve();},onTimeout:reject},{}));assert.equal(calls,1);
 const second={stats:{loading:{start:0}}};
 await new Promise((resolve,reject)=>nativeHlsLoad(second,{request:async()=>{await new Promise(done=>setTimeout(done,20));return {status:200,body:new ArrayBuffer(16),metrics:{totalMs:20,firstByteMs:4}};}},{url:'https://example.com/a.ts',responseType:'arraybuffer',rangeStart:0,rangeEnd:16},{timeout:1000},{onSuccess:()=>resolve(),onError:reject,onTimeout:reject},{}));
 assert.ok(second.stats.loading.end-second.stats.loading.first>=10);assert.equal(second.stats.loaded,16);
});
test('canceling an HLS retry prevents another request and callback',async()=>{
 let calls=0;const loader={stats:{loading:{start:0}}};let retry;
 const retried=new Promise(resolve=>retry=resolve);
 nativeHlsLoad(loader,{request:async()=>{calls++;return {status:503};}},{url:'https://example.com/a.ts',responseType:'arraybuffer'},{timeout:1000},{onSuccess:()=>assert.fail('canceled'),onError:()=>assert.fail('canceled'),onTimeout:()=>assert.fail('canceled')},{},null,retry);
 await retried;loader.cancelNative();await new Promise(resolve=>setTimeout(resolve,250));assert.equal(calls,1);
});
