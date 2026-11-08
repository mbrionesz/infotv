import test from 'node:test';import assert from 'node:assert/strict';import {createTsSeekState,observeTsSeek} from '../browser/ts-seek.js';
const bytes=new Uint8Array(80000).fill(71).buffer;
const audio={samples:[{dts:1000}]};const video={samples:[{isKeyframe:true,dts:1000,file_position:188},{isKeyframe:true,dts:91000,file_position:800000}]};
test('TS bookmark contains a verified file fingerprint and an exact indexed byte anchor',()=>{
 const state=createTsSeekState();state.identify(bytes,1000000);state.observe(audio,video);const info={};assert.equal(state.attach(info),true);state.publish();const hint=state.bookmark(91.5);assert.equal(hint.filePosition,800000);assert.equal(hint.dts,91000);assert.equal(hint.position,91.5);assert.equal(hint.fingerprint.length,64);assert.equal(JSON.stringify(hint).includes('url'),false);
 const resumed=createTsSeekState(hint);resumed.identify(bytes,1000000);resumed.observe(audio,{samples:[video.samples[0]]});resumed.publish();assert.equal(resumed.canSeek(91.5),true);assert.equal(resumed.canSeek(50),false,'Do not pretend an unindexed large gap is covered');assert.equal(resumed.snapshot().savedAnchorVerified,true);
});
test('changed or malformed files cannot reuse a saved TS byte offset',()=>{
 const original=createTsSeekState();original.identify(bytes,1000000);original.observe(audio,video);const hint=original.bookmark(91.5);
 for(const [body,total] of [[new Uint8Array(80000).fill(72).buffer,1000000],[bytes,1000001]]){const state=createTsSeekState(hint);state.identify(body,total);state.observe(audio,{samples:[video.samples[0]]});state.publish();assert.equal(state.snapshot().savedAnchorVerified,false);assert.equal(state.canSeek(91.5),false);}
 const bad=createTsSeekState({...hint,filePosition:1000001});bad.identify(bytes,1000000);assert.equal(bad.snapshot().savedAnchorAvailable,false);
});
test('TS sample observation publishes seek metadata once and keeps a bounded index',()=>{
 const state=createTsSeekState();state.identify(bytes,10000000);let emitted=0;const demuxer={config_:{xuperTsSeek:state},media_info_:{},onMediaInfo(info){emitted++;assert.equal(info.hasKeyframesIndex,true);}};
 const samples=Array.from({length:5000},(_,i)=>({isKeyframe:true,dts:1000+i*2000,file_position:188+i*188}));observeTsSeek(demuxer,audio,{samples});observeTsSeek(demuxer,audio,{samples:samples.slice(-2)});assert.equal(emitted,1);assert.ok(state.snapshot().indexedPoints<=4096);
});
