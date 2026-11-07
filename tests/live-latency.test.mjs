import test from 'node:test';import assert from 'node:assert/strict';import {createLiveLatency} from '../browser/live-latency.js';
function video(height=720){return {videoWidth:height===720?1280:1920,videoHeight:height,currentTime:10,paused:false,readyState:4,buffered:{length:1,start:()=>8,end:()=>25}};}
test('720p moves once to a buffered experimental one-segment target, leaving FHD and VOD stable',()=>{
 const h={config:{},liveSyncPosition:18},v=video(),p=createLiveLatency();p.update(h,v,true);assert.equal(h.config.liveSyncDurationCount,1);assert.equal(v.currentTime,18);h.liveSyncPosition=22;p.update(h,v,true);assert.equal(v.currentTime,18);
 for(const [height,live] of [[1080,true],[720,false]]){const h={config:{},liveSyncPosition:18},v=video(height);createLiveLatency().update(h,v,live);assert.equal(h.config.liveSyncDurationCount,3);assert.equal(v.currentTime,10);}
});
test('pause, unbuffered targets and opt-out never force a seek; two stalls restore stable distance',()=>{
 const h={config:{},liveSyncPosition:30},v=video(),p=createLiveLatency();p.update(h,v,true);assert.equal(v.currentTime,10);h.liveSyncPosition=18;v.paused=true;p.update(h,v,true);assert.equal(v.currentTime,10);v.paused=false;p.stall();p.stall();p.update(h,v,true);assert.equal(h.config.liveSyncDurationCount,3);assert.equal(p.state.reason,'repeated-stalls');assert.equal(v.currentTime,10);
 createLiveLatency(false).update(h,v,true);assert.equal(h.config.liveSyncDurationCount,3);
});
