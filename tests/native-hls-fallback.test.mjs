import test from 'node:test';import assert from 'node:assert/strict';import {nativeHlsLoad} from '../browser/native-hls-loader.js';
test('native HLS fallback resets loader state before the real XHR loader starts',async()=>{
 const loader={stats:{loading:{start:0},aborted:false}};
 await new Promise((resolve,reject)=>nativeHlsLoad(loader,{request:async()=>null},{url:'https://example.com/a.m3u8'},{timeout:1000},{onError:()=>reject(new Error('Must fall back')),onTimeout:()=>reject(new Error('Timed out'))},{},()=>{try{assert.equal(loader.stats.loading.start,0);assert.equal(loader.stats.aborted,false);assert.equal(loader.nativeActive,false);assert.equal(loader.cancelNative,null);resolve();}catch(error){reject(error);}}));
});
