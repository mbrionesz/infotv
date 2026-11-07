import test from 'node:test';import assert from 'node:assert/strict';import {createLiveBuffer} from '../browser/live-buffer.js';
class Video extends EventTarget{
 constructor(){super();this.paused=true;this.currentTime=0;this.seconds=0;this.calls=0;this.buffered={length:1,start:()=>0,end:()=>this.seconds};}
 play(){this.calls++;this.paused=false;this.dispatchEvent(new Event('playing'));return Promise.resolve();}
 pause(){this.paused=true;}
}
test('live playback waits for 1 second and refills 6 after waiting',async()=>{
 const video=new Video();let state;const gate=createLiveBuffer(video,{onState:value=>state=value});
 try{const started=video.play();video.seconds=0.5;gate.check();assert.equal(video.calls,0);video.seconds=1;gate.check();await started;assert.equal(video.calls,1);video.seconds=0.1;video.dispatchEvent(new Event('waiting'));assert.equal(video.paused,true);video.seconds=5;gate.check();assert.equal(video.calls,1);video.seconds=6;gate.check();await Promise.resolve();assert.equal(video.calls,2);assert.equal(state.releaseTargetSeconds,6);assert.equal(state.limited,false);}finally{gate.destroy();}
});
test('explicit pause cancels buffering and never auto resumes',async()=>{
 const video=new Video();const gate=createLiveBuffer(video);
 try{const pending=video.play();video.pause();await assert.rejects(pending,{name:'AbortError'});video.seconds=8;gate.check();assert.equal(video.calls,0);assert.equal(gate.userPaused,true);await video.play();assert.equal(video.calls,1);}finally{gate.destroy();}
});
test('short live windows have a bounded initial fallback instead of waiting forever',async()=>{
 const video=new Video();let time=0,state;const gate=createLiveBuffer(video,{now:()=>time,onState:value=>state=value});
 try{video.seconds=0.5;const pending=video.play();assert.equal(video.calls,0);time=6001;gate.check();await pending;assert.equal(state.limited,true);assert.equal(video.calls,1);}finally{gate.destroy();}
});
test('closing a channel rejects pending play and restores original controls',async()=>{
 const video=new Video(),play=video.play,pause=video.pause;const gate=createLiveBuffer(video);const pending=video.play();gate.destroy();await assert.rejects(pending,{name:'AbortError'});assert.equal(video.play,play);assert.equal(video.pause,pause);
});
test('buffer gate leaves a real forward hole to HLS instead of disabling its gap controller',async()=>{
 const video=new Video();let state;const gate=createLiveBuffer(video,{onState:value=>state=value});
 try{video.seconds=8;await video.play();video.currentTime=40.393;video.buffered={length:2,start:i=>[25.254923,45.321411][i],end:i=>[40.266985,50.314985][i]};video.dispatchEvent(new Event('waiting'));assert.equal(video.paused,false);assert.equal(state.handling,'hls-gap');assert.equal(gate.waiting,false);}finally{gate.destroy();}
});
test('waiting with ten buffered seconds does not add pause/play churn',async()=>{
 const video=new Video();const gate=createLiveBuffer(video);
 try{video.seconds=10;await video.play();video.dispatchEvent(new Event('waiting'));assert.equal(video.paused,false);assert.equal(video.calls,1);}finally{gate.destroy();}
});
test('an interrupted internal play retries without a permanently blocked gate',async()=>{
 const video=new Video();let count=0;video.play=function(){if(++count===1)return Promise.reject(new DOMException('Interrupted','AbortError'));this.paused=false;this.dispatchEvent(new Event('playing'));return Promise.resolve();};
 const gate=createLiveBuffer(video);
 try{video.seconds=8;const pending=video.play();await Promise.resolve();gate.check();await pending;assert.equal(count,2);assert.equal(video.paused,false);}finally{gate.destroy();}
});

test('a buffered seek does not refill six seconds; an actual later empty-buffer stall still does',async()=>{
 const video=new Video();let time=0,state;const gate=createLiveBuffer(video,{now:()=>time,onState:v=>state=v});
 try{video.seconds=5;await video.play();video.dispatchEvent(new Event('seeking'));video.dispatchEvent(new Event('waiting'));assert.equal(video.paused,false);assert.equal(state.handling,'seek-buffered');time=2000;video.seconds=0;video.dispatchEvent(new Event('waiting'));assert.equal(video.paused,true);assert.equal(state.targetSeconds,6);}finally{gate.destroy();}
});
