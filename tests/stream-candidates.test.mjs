import test from 'node:test';import assert from 'node:assert/strict';
import {streamCandidates,streamRoutes} from '../browser/stream-candidates.js';
test('CDN failover uses each CDN credential and refuses implicit credential sharing',()=>{
 const source='https://first.example/live.m3u8';const headers={'Content-Auth':'primary'};
 const result=streamCandidates(source,{headers,backupUrls:['https://unsafe.example/live.m3u8',{url:'https://second.example/live.m3u8',headers:{'Content-Auth':'second'}},'javascript:alert(1)','https://first.example/other.m3u8']});
 assert.equal(result.length,3);assert.equal(result[1].headers['Content-Auth'],'second');assert.equal(result.some(item=>item.url.includes('unsafe')),false);assert.deepEqual(result[2].headers,headers);
});

test('four distinct supplied candidates retain their own credentials and a fifth is bounded',()=>{
 const backups=['two','three','four','five'].map(id=>({url:'http://'+id+'.example/live.m3u8',headers:{'Content-Auth':id}}));
 const candidates=streamCandidates('http://one.example/live.m3u8',{headers:{'Content-Auth':'one'},backupUrls:backups});
 assert.equal(candidates.length,4);assert.equal(candidates[3].headers['Content-Auth'],'four');
 const routes=streamRoutes(candidates);assert.deepEqual(routes.slice(0,4).map(item=>item.cdnAttempt),[1,2,3,4]);
 assert.ok(routes.slice(0,4).every(item=>!item.httpsFallback));assert.ok(routes.slice(4).every(item=>item.httpsFallback));
 assert.equal(routes[7].headers['Content-Auth'],'four');assert.equal(routes[7].url,'https://four.example/live.m3u8');
});
test('explicit HTTPS candidates are not repeated as generated alternatives',()=>{
 const routes=streamRoutes([{url:'http://one.example/live.m3u8',headers:{}},{url:'https://one.example/live.m3u8',headers:{}}]);
 assert.equal(routes.length,2);assert.equal(routes[1].httpsFallback,false);
});
