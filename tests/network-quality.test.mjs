import test from 'node:test';
import assert from 'node:assert/strict';
import {measureInternet} from '../browser/network-quality.js';
import {requestSignal} from '../browser/request-signal.js';
test('internet test measures three HTTP samples and a bounded 4 MiB download',async()=>{
 let time=0;const urls=[];
 const report=await measureInternet({now:()=>time,xhrFactory:()=>({open(method,url){assert.equal(method,'GET');urls.push(new URL(url));},send(){time+=50;this.status=200;const bytes=Number(urls.at(-1).searchParams.get('bytes'));this.response=new ArrayBuffer(bytes);if(bytes)time+=950;queueMicrotask(()=>this.onload());}})});
 assert.deepEqual(urls.map(u=>Number(u.searchParams.get('bytes'))),[0,0,0,4194304]);assert.equal(report.latencyMs,50);assert.equal(report.jitterMs,0);assert.equal(report.downloadMbps,33.6);assert.match(report.note,/No mide/);
});
test('network failure stops testing and does not fabricate a green measurement',async()=>{
 let calls=0;await assert.rejects(measureInternet({xhrFactory:()=>({open(){},send(){calls++;queueMicrotask(()=>this.onerror());}})}),/No medible/);assert.equal(calls,1);
});
test('closing diagnostics aborts a pending download and prevents further requests',async()=>{
 const signal=requestSignal();let xhr,aborted=false;
 const pending=measureInternet({signal,xhrFactory:()=>xhr={open(){},send(){},abort(){aborted=true;}}});signal.abort();await assert.rejects(pending,/cancelada/);assert.ok(aborted);
});
test('short download is rejected rather than reported as an internet speed',async()=>{
 await assert.rejects(measureInternet({xhrFactory:()=>({open(){},send(){this.status=200;this.response=new ArrayBuffer(20);queueMicrotask(()=>this.onload());}})}),/incompleta/);
});
