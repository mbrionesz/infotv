import test from 'node:test';
import assert from 'node:assert/strict';
import {dnsQuestion,dnsAnswers,createDnsDiagnostic,resolvers,resolverEndpoints,queryDoh} from '../browser/dns-diagnostic.js';
test('DoH validates question, flags and bounded records before accepting IPv4',()=>{
 const q=dnsQuestion('example.com');const response=new Uint8Array([...q,192,12,0,1,0,1,0,0,0,60,0,4,1,2,3,4]);response[2]=129;response[3]=128;response[7]=1;
 assert.deepEqual(dnsAnswers(response.buffer,q),{ips:['1.2.3.4'],ttl:60});
 const wrong=q.slice();wrong[13]=120;assert.throws(()=>dnsAnswers(response.buffer,wrong));
 response[3]=131;assert.throws(()=>dnsAnswers(response.buffer,q));
 assert.throws(()=>dnsQuestion('https://example.com/path'));assert.throws(()=>dnsQuestion('a'.repeat(64)+'.com'));
});
test('all configured DoH requests race, cancel losers, honor TTL and retain system routing',async()=>{
 let calls=0,canceled=0,time=0;
 const diag=createDnsDiagnostic({now:()=>time,query:ip=>{calls++;return {cancel:()=>canceled++,promise:ip===resolvers[1]?Promise.resolve({ips:['1.2.3.4'],ttl:60}):Promise.reject(new Error('offline'))};}});
 const result=await diag.lookup('example.com');assert.equal(calls,resolvers.length);assert.equal(canceled,resolvers.length);assert.equal(result.routing,'system-dns');assert.equal(result.status,'answered');
 assert.equal((await diag.lookup('example.com')).cached,true);assert.equal(calls,resolvers.length);
 time=61000;await diag.lookup('example.com');assert.equal(calls,resolvers.length*2);
});
test('DoH timeout and failed resolvers enter five-minute cooldown without blocking app traffic',async()=>{
 let calls=0,time=0;const diag=createDnsDiagnostic({now:()=>time,timeout:10,query:()=>{calls++;return {cancel:()=>{},promise:new Promise(()=>{})};}});
 assert.equal((await diag.lookup('example.com')).status,'unavailable');assert.equal(calls,resolvers.length);
 assert.equal((await diag.lookup('example.net')).status,'cooldown');assert.equal(calls,resolvers.length);
 time=300001;await diag.lookup('example.net');assert.equal(calls,resolvers.length*2);
});

test('seventeen endpoints keep Quad9 and use verified wire paths for the three added providers',()=>{
 assert.equal(resolvers.length,17);assert.equal(new Set(resolvers).size,17);
 for(const ip of ['9.9.9.9','149.112.112.112','45.90.28.0','45.90.30.0','76.76.2.0','76.76.10.0','223.5.5.5','223.6.6.6'])assert.ok(resolvers.includes(ip));
 assert.ok(resolverEndpoints.filter(e=>e.provider==='Control D').every(e=>e.host==='freedns.controld.com'&&e.path==='/p0'));
});
test('browser diagnostics select the provider path and cancel without a Host or SNI override',async()=>{
 let seen;globalThis.XMLHttpRequest=class{open(method,url){seen={method,url,headers:{}};}setRequestHeader(k,v){seen.headers[k]=v;}send(){}abort(){this.onabort();}};
 try{const request=queryDoh('76.76.2.0',dnsQuestion('example.com'),5000);assert.ok(seen.url.startsWith('https://76.76.2.0/p0?dns='));assert.equal(seen.headers.Host,undefined);request.cancel();await assert.rejects(request.promise);}finally{delete globalThis.XMLHttpRequest;}
});

test('DNS.SB and Mullvad extend the existing configuration to nine providers without replacing endpoints',()=>{
 for(const ip of ['185.222.222.222','45.11.45.11','194.242.2.2'])assert.ok(resolvers.includes(ip));
 assert.equal(new Set(resolverEndpoints.map(e=>e.provider)).size,9);
 assert.ok(resolverEndpoints.filter(e=>e.provider==='DNS.SB').every(e=>e.host==='doh.dns.sb'&&e.path==='/dns-query'));
 assert.equal(resolverEndpoints.find(e=>e.provider==='Mullvad').host,'dns.mullvad.net');
});
