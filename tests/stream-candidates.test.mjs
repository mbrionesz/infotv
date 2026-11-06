import test from 'node:test';import assert from 'node:assert/strict';
import {streamCandidates} from '../browser/stream-candidates.js';
test('CDN failover uses each CDN credential and refuses implicit credential sharing',()=>{
 const source='https://first.example/live.m3u8';const headers={'Content-Auth':'primary'};
 const result=streamCandidates(source,{headers,backupUrls:['https://unsafe.example/live.m3u8',{url:'https://second.example/live.m3u8',headers:{'Content-Auth':'second'}},'javascript:alert(1)','https://first.example/other.m3u8']});
 assert.equal(result.length,3);assert.equal(result[1].headers['Content-Auth'],'second');assert.equal(result.some(item=>item.url.includes('unsafe')),false);assert.deepEqual(result[2].headers,headers);
});
