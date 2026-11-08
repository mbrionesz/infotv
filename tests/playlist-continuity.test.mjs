import test from 'node:test';import assert from 'node:assert/strict';import {createPlaylistContinuity} from '../browser/playlist-continuity.js';
const base='https://video.example/live/main.m3u8';
function list(n,files,extra=''){return '#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:'+n+'\n'+extra+files.map(f=>'#EXTINF:5.000,\n'+f+'\n').join('');}
function accept(c,text){const p=c.inspect(text,base);c.accept(p);return p;}
test('two shared segments anchor a server regression without changing URLs',()=>{
 const c=createPlaylistContinuity();accept(c,list(10356,['a.ts','b.ts','c.ts','d.ts']));const p=accept(c,list(8905,['b.ts','c.ts','d.ts','e.ts']));assert.equal(p.changed,true);assert.equal(p.effectiveSequence,10357);assert.equal(p.shared,3);assert.ok(p.data.includes('#EXT-X-MEDIA-SEQUENCE:10357'));assert.ok(p.data.includes('e.ts'));
 assert.equal(accept(c,list(10555,['c.ts','d.ts','e.ts','f.ts'])).effectiveSequence,10358);
});
test('same server sequence with a sliding window also advances the canonical sequence',()=>{
 const c=createPlaylistContinuity();accept(c,list(20,['a.ts','b.ts','c.ts']));assert.equal(accept(c,list(20,['b.ts','c.ts','d.ts'])).effectiveSequence,21);
});
test('absence of overlap or a single anchor never invents continuity',()=>{
 const c=createPlaylistContinuity();accept(c,list(100,['a.ts','b.ts','c.ts']));for(const files of [['x.ts','y.ts','z.ts'],['c.ts','d.ts','e.ts']]){const p=c.inspect(list(1,files),base);assert.equal(p.changed,false);assert.equal(p.effectiveSequence,1);}
});
test('conflicting order, duration or discontinuity is rejected',()=>{
 const c=createPlaylistContinuity();accept(c,list(100,['a.ts','b.ts','c.ts']));assert.equal(c.inspect(list(1,['b.ts','a.ts','c.ts']),base).reject,true);assert.equal(c.inspect(list(1,['a.ts','b.ts','c.ts']).replace('5.000','4.000'),base).reject,true);assert.equal(c.inspect(list(1,['a.ts','b.ts','c.ts'],'#EXT-X-DISCONTINUITY-SEQUENCE:1\n'),base).reject,true);
});
test('only authentication query parameters are ignored; segment IDs and host remain significant',()=>{
 const c=createPlaylistContinuity();accept(c,list(100,['part.ts?id=1&token=a','part.ts?id=2&token=a','part.ts?id=3&token=a']));assert.equal(c.inspect(list(1,['part.ts?id=2&token=b','part.ts?id=3&token=b','part.ts?id=4&token=b']),base).effectiveSequence,101);assert.equal(c.inspect(list(1,['part.ts?id=7','part.ts?id=8','part.ts?id=9']),base).changed,false);assert.equal(c.inspect(list(1,['https://other.example/part.ts?id=2','https://other.example/part.ts?id=3']),base).changed,false);
});
test('implicit AES IV cannot be renumbered; explicit IV and tags are preserved',()=>{
 for(const explicit of [false,true]){const c=createPlaylistContinuity();const key='#EXT-X-KEY:METHOD=AES-128,URI="key.bin"'+(explicit?',IV=0x000102030405060708090a0b0c0d0e0f':'')+'\n';accept(c,list(100,['a.ts','b.ts','c.ts'],key));const p=c.inspect(list(1,['a.ts','b.ts','c.ts'],key),base);assert.equal(p.changed,explicit);assert.equal(p.reject,!explicit);assert.ok(p.data.includes(key));}
});
test('unsupported byte ranges, VOD, duplicate URIs and unaccepted candidates do not poison history',()=>{
 const c=createPlaylistContinuity(6);accept(c,list(100,['a.ts','b.ts','c.ts']));c.inspect(list(1,['x.ts','y.ts','z.ts']),base);assert.equal(c.inspect(list(1,['x.ts','y.ts','z.ts']),base).shared,0);
 for(const text of [list(1,['a.ts','b.ts'])+'#EXT-X-ENDLIST\n',list(1,['a.ts','b.ts'],'#EXT-X-BYTERANGE:10@0\n'),list(1,['a.ts','b.ts'],'#EXT-X-MAP:URI="init.mp4"\n'),list(1,['a.ts','a.ts'])])assert.equal(c.inspect(text,base).changed,false);
 accept(c,list(103,['d.ts','e.ts','f.ts']));accept(c,list(106,['g.ts','h.ts','i.ts']));assert.equal(c.size,6);
});
