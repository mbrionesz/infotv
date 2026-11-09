import test from 'node:test';import assert from 'node:assert/strict';import {formatMediaInfo,createFrameMeter} from '../browser/media-info.js';
test('info uses actual dimensions and distinguishes declared, measured and unavailable fps',()=>{
 const base={media:{width:1920,height:1080,measuredFps:23.976},codecs:{video:{codec:'avc1.64002a'},audio:{codec:'mp4a.40.2'}}};
 assert.match(formatMediaInfo(base),/1920×1080 · 23,98 FPS medidos · H.264 · AAC/);
 assert.match(formatMediaInfo({...base,level:{fps:25}}),/25,00 FPS declarados/);assert.match(formatMediaInfo({}),/FPS sin datos/);
});
test('frame meter samples presentation counters without a per-frame callback loop',()=>{
 let callback,id=0;const video={paused:false,readyState:4,requestVideoFrameCallback:fn=>{callback=fn;return ++id;},cancelVideoFrameCallback:()=>{}};const meter=createFrameMeter(video);
 meter.sample();callback(1000,{presentedFrames:24});assert.equal(meter.read().measuredFps,null);meter.sample();callback(3000,{presentedFrames:72});assert.equal(meter.read().measuredFps,24);assert.equal(id,2);video.paused=true;meter.sample();assert.equal(meter.read().measuredFps,null);meter.destroy();
});
test('frame meter leaves unsupported TVs unavailable and cancels pending callback on close',()=>{
 const unsupported=createFrameMeter({paused:false,readyState:4});unsupported.sample();assert.equal(unsupported.read().fpsMethod,'unavailable');unsupported.destroy();const stub=createFrameMeter({paused:false,readyState:4,requestVideoFrameCallback:()=>{throw new Error('Not supported');}});stub.sample();assert.equal(stub.read().measuredFps,null);stub.destroy();let canceled;const meter=createFrameMeter({paused:false,readyState:4,requestVideoFrameCallback:()=>17,cancelVideoFrameCallback:id=>canceled=id});meter.sample();meter.destroy();assert.equal(canceled,17);
});

test('frame aspect recognizes decoded dimensions without claiming to detect encoded black bars',async()=>{const {frameAspect}=await import('../browser/media-info.js');assert.equal(frameAspect(1920,1080).label,'16:9');assert.equal(frameAspect(2520,1080).label,'21:9');assert.equal(frameAspect(3840,1608).label,'2.39:1');assert.equal(frameAspect(1920,800).label,'2.40:1');assert.equal(frameAspect(1920,1080).embeddedBars,'unknown');assert.equal(frameAspect(0,0),null);assert.equal(frameAspect(Infinity,1080),null);assert.match(formatMediaInfo({media:{width:3840,height:1608}}),/Fotograma 2.39:1/);});
