// Read counters only: no frame callback loop and no audio clock adjustment.
export function mediaHealth(video){
 let buffered=0;
 try{for(let i=0;i<video.buffered.length;i++)if(video.currentTime>=video.buffered.start(i)-0.1&&video.currentTime<=video.buffered.end(i))buffered=Math.max(0,video.buffered.end(i)-video.currentTime);}catch(_){}
 let quality=null;try{quality=video.getVideoPlaybackQuality&&video.getVideoPlaybackQuality();}catch(_){}
 return {time:Math.round(video.currentTime*100)/100,bufferSeconds:Math.round(buffered*100)/100,
 width:video.videoWidth||0,height:video.videoHeight||0,playbackRate:video.playbackRate||1,
 totalFrames:quality?quality.totalVideoFrames:video.webkitDecodedFrameCount||0,
 droppedFrames:quality?quality.droppedVideoFrames:video.webkitDroppedFrameCount||0,
 paused:!!video.paused,readyState:video.readyState||0};
}
export function recoveryBudget(limit=3,windowMs=60000){
 let attempts=[];
 return {take(now){attempts=attempts.filter(time=>now-time<windowMs);if(attempts.length>=limit)return 0;attempts.push(now);return attempts.length;}};
}
// Buffer quantity alone never proves playback progress. A partial buffer can stay
// unchanged forever after an MSE failure; only the media clock resets this timer.
export function createStallWatch(timeoutMs=12000){
 let lastTime=null,lastProgressAt=null;
 return {reset(now,time){lastTime=time;lastProgressAt=now;},check(sample,{now,started,hidden=false,userPaused=false}){
  if(lastProgressAt===null||!started||hidden||userPaused||Math.abs(sample.time-lastTime)>0.05){lastProgressAt=now;lastTime=sample.time;return false;}
  if(now-lastProgressAt<timeoutMs)return false;
  lastProgressAt=now;return true;
 }};
}
