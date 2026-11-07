import test from 'node:test';import assert from 'node:assert/strict';import {probeCdns} from '../browser/cdn-probe.js';
test('CDN HEAD probes stay bounded, strip credentials and paths, and treat 404 as reachability only',async()=>{
 const calls=[];const transport={snapshot:()=>({available:true}),request:async o=>{calls.push(o);return {status:404,metrics:{connectMs:12,firstByteMs:25}};}};
 const report=await probeCdns(['https://cdn.example/private.m3u8?token=secret','https://cdn.example/duplicate',...Array.from({length:8},(_,i)=>'https://cdn'+i+'.example/private?token=secret'),'https://user:pass@other.example/'],transport);
 assert.equal(calls.length,6);assert.ok(calls.every(o=>o.method==='HEAD'&&!o.headers&&new URL(o.url).pathname==='/'&&!new URL(o.url).search&&o.diagnostic));assert.equal(report.results[0].httpStatus,404);assert.equal(report.results[0].state,'HTTP respondió');assert.equal(JSON.stringify(report).includes('secret'),false);assert.ok(report.kind.includes('no ICMP'));
});
test('failed HEAD is reported as unmeasurable rather than DNS poisoning or channel failure',async()=>{
 const report=await probeCdns(['https://cdn.example/a'],{snapshot:()=>({available:true}),request:async()=>{throw new Error('TLS');}});assert.equal(report.results[0].state,'No medible');assert.equal(report.results[0].httpStatus,0);
});
