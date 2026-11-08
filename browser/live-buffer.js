// Gate playback, not downloads. Preserve explicit pause and cancel on channel changes.
export function createLiveBuffer(video,{now=()=>performance.now(),onState=()=>{},onRejected=()=>{}}={}){
 const play=video.play,pause=video.pause,playDescriptor=Object.getOwnPropertyDescriptor(video,'play'),pauseDescriptor=Object.getOwnPropertyDescriptor(video,'pause');let desired=false,userPaused=false,played=false,waiting=true,blocked=false,pending=false,disposed=false,suspended=false,target=3,since=now(),waiters=[],lastRelease={releaseCount:0},abortRetries=0,handling='buffer-gate';
 function seconds(){try{for(let i=0;i<video.buffered.length;i++){const start=video.buffered.start(i),end=video.buffered.end(i),time=video.currentTime;if(time>=start-0.1&&time<=end)return Math.max(0,end-time);if(!played&&time<start)return end-start;}}catch(_){}return 0;}
 function hasForwardGap(){try{if(seconds()>0)return false;for(let i=0;i<video.buffered.length;i++)if(video.buffered.start(i)>video.currentTime+0.1)return true;}catch(_){}return false;}
 function state(extra={}){onState(Object.assign({waiting,handling,abortRetries,targetSeconds:target,bufferSeconds:Math.round(seconds()*100)/100,userPaused},lastRelease,extra));}
 function settle(error){const list=waiters;waiters=[];for(const item of list)error?item.reject(error):item.resolve();}
 function check(){
  if(disposed||suspended||!desired||blocked||pending)return;
  const forwardGap=played&&hasForwardGap();if(forwardGap)handling='hls-gap';
  const buffered=seconds(),limited=now()-since>=(played?12000:6000)&&buffered>=0.5;
  if(waiting&&buffered+0.05<target&&!limited&&!forwardGap){state();return;}
  if(!video.paused){waiting=false;settle();return;}
  pending=true;waiting=false;lastRelease={releaseCount:lastRelease.releaseCount+1,limited:!!limited,releaseTargetSeconds:target,releasedBufferSeconds:Math.round(buffered*100)/100};state();
  let result;try{result=play.call(video);}catch(error){result=Promise.reject(error);}
  Promise.resolve(result).then(()=>{pending=false;abortRetries=0;if(!disposed)settle();},error=>{pending=false;if(disposed)return;if(error&&error.name==='AbortError'&&desired&&!userPaused&&abortRetries<3){abortRetries++;waiting=true;state();return;}blocked=true;settle(error);onRejected(error);});
 }
 function request(){
  if(disposed)return Promise.reject(new DOMException('Closed','AbortError'));
  if(userPaused){since=now();target=played?6:3;waiting=true;}
  desired=true;userPaused=false;blocked=false;
  const result=new Promise((resolve,reject)=>waiters.push({resolve,reject}));check();return result;
 }
 function stopByUser(){desired=false;userPaused=true;waiting=false;settle(new DOMException('Paused','AbortError'));pause.call(video);state();}
 let seekUntil=0;function seeking(){seekUntil=now()+1500;}
 function stalled(){
  if(!desired||!played||video.paused)return;
  // Keep the media clock running: HLS gap recovery requires an unpaused element.
  // Pausing here can strand Samsung MSE across a segment gap indefinitely.
  handling=hasForwardGap()?'hls-gap':'hls-recovery';waiting=false;state();
 }
 function playing(){played=true;waiting=false;handling='playing';state();}
 video.play=request;video.pause=stopByUser;
 video.addEventListener('seeking',seeking);video.addEventListener('waiting',stalled);video.addEventListener('playing',playing);video.addEventListener('progress',check);
 const timer=setInterval(check,250);
 return {check,suspend(){suspended=true;pause.call(video);handling='background';state();},resume(autoplay=true){suspended=false;return autoplay?request():Promise.resolve();},get waiting(){return waiting&&desired;},get userPaused(){return userPaused;},destroy(){disposed=true;clearInterval(timer);video.removeEventListener('seeking',seeking);video.removeEventListener('waiting',stalled);video.removeEventListener('playing',playing);video.removeEventListener('progress',check);if(playDescriptor)Object.defineProperty(video,'play',playDescriptor);else delete video.play;if(pauseDescriptor)Object.defineProperty(video,'pause',pauseDescriptor);else delete video.pause;settle(new DOMException('Closed','AbortError'));}};
}
