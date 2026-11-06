import test from 'node:test';
import assert from 'node:assert/strict';
import {dnsQuestion,dnsAnswers,createDnsDiagnostic,resolvers} from '../browser/dns-diagnostic.js';
test('DoH validates question, flags and bounded records before accepting IPv4',()=>{
 const q=dnsQuestion('example.com');const response=new Uint8Array([...q,192,12,0,1,0,1,0,0,0,60,0,4,1,2,3,4]);response[2]=129;response[3]=128;response[7]=1;
 assert.deepEqual(dnsAnswers(response.buffer,q),{ips:['1.2.3.4'],ttl:60});
 const wrong=q.slice();wrong[13]=120;assert.throws(()=>dnsAnswers(response.buffer,wrong));
 response[3]=131;assert.throws(()=>dnsAnswers(response.buffer,q));
 assert.throws(()=>dnsQuestion('https://example.com/path'));assert.throws(()=>dnsQuestion('a'.repeat(64)+'.com'));
});
test('six DoH requests race, cancel losers, honor TTL and retain system routing',async()=>{
 let calls=0,canceled=0,time=0;
 const diag=createDnsDiagnostic({now:()=>time,query:ip=>{calls++;return {cancel:()=>canceled++,promise:ip===resolvers[1]?Promise.resolve({ips:['1.2.3.4'],ttl:60}):Promise.reject(new Error('offline'))};}});
 const result=await diag.lookup('example.com');assert.equal(calls,6);assert.equal(canceled,6);assert.equal(result.routing,'system-dns');assert.equal(result.status,'answered');
 assert.equal((await diag.lookup('example.com')).cached,true);assert.equal(calls,6);
 time=61000;await diag.lookup('example.com');assert.equal(calls,12);
});
test('DoH timeout and failed resolvers enter five-minute cooldown without blocking app traffic',async()=>{
 let calls=0,time=0;const diag=createDnsDiagnostic({now:()=>time,timeout:10,query:()=>{calls++;return {cancel:()=>{},promise:new Promise(()=>{})};}});
 assert.equal((await diag.lookup('example.com')).status,'unavailable');assert.equal(calls,6);
 assert.equal((await diag.lookup('example.net')).status,'cooldown');assert.equal(calls,6);
 time=300001;await diag.lookup('example.net');assert.equal(calls,12);
});
