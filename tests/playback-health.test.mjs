import test from 'node:test';import assert from 'node:assert/strict';
import {mediaHealth,recoveryBudget} from '../browser/playback-health.js';
test('health measures only buffer at current playhead and reports dropped frames without claiming audio sync',()=>{
 const video={currentTime:12,buffered:{length:2,start:i=>[0,10][i],end:i=>[5,20][i]},videoWidth:1920,videoHeight:1080,playbackRate:1,paused:false,readyState:4,getVideoPlaybackQuality:()=>({totalVideoFrames:1000,droppedVideoFrames:50})};
 const sample=mediaHealth(video);assert.equal(sample.bufferSeconds,8);assert.equal(sample.droppedFrames,50);assert.equal(sample.totalFrames,1000);assert.equal(sample.width,1920);assert.equal(sample.audioDelay,undefined);
 video.currentTime=6;assert.equal(mediaHealth(video).bufferSeconds,0);
});
test('old TV frame counters and missing playback quality remain supported',()=>{
 const sample=mediaHealth({currentTime:0,webkitDecodedFrameCount:90,webkitDroppedFrameCount:3,paused:true});
 assert.equal(sample.totalFrames,90);assert.equal(sample.droppedFrames,3);assert.equal(sample.bufferSeconds,0);assert.equal(sample.paused,true);
});
test('recovery is bounded per rolling minute and replenishes for later independent outages',()=>{
 const budget=recoveryBudget();assert.equal(budget.take(0),1);assert.equal(budget.take(1000),2);assert.equal(budget.take(2000),3);assert.equal(budget.take(59000),0);assert.equal(budget.take(60000),3);assert.equal(budget.take(61000),3);assert.equal(budget.take(61001),0);
});
