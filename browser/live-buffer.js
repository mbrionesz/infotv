// Gate playback, not downloads. Preserve explicit pause and cancel on channel changes.
export function createLiveBuffer(video,{now=()=>performance.now(),onState=()=>{},onRejected=()=>{}}={}){
 const play=video.play,pause=video.pause;let desired=false,userPaused=false,played=false,waiting=true,blocked=false,pending=false,disposed=false,target=3,since=now(),waiters=[],lastRelease={releaseCount:0};
 function seconds(){try{for(let i=0;i<video.buffered.length;i++){const start=video.buffered.start(i),end=video.buffered.end(i),time=video.currentTime;if(time>=start-0.1&&time<=end)return Math.max(0,end-time);if(!played&&time<start)return end-start;}}catch(_){}return 0;}
 function state(extra={}){onState(Object.assign({waiting,targetSeconds:target,bufferSeconds:Math.round(seconds()*100)/100,userPaused},lastRelease,extra));}
 function settle(error){const list=waiters;waiters=[];for(const item of list)error?item.reject(error):item.resolve();}
 function check(){
  if(disposed||!desired||blocked||pending)return;
  const buffered=seconds(),limited=now()-since>=(played?12000:6000)&&buffered>=0.5;
  if(waiting&&buffered+0.05<target&&!limited){state();return;}
  if(!video.paused){waiting=false;settle();return;}
  pending=true;waiting=false;lastRelease={releaseCount:lastRelease.releaseCount+1,limited:!!limited,releaseTargetSeconds:target,releasedBufferSeconds:Math.round(buffered*100)/100};state();
  let result;try{result=play.call(video);}catch(error){result=Promise.reject(error);}
  Promise.resolve(result).then(()=>{pending=false;if(!disposed)settle();},error=>{pending=false;if(disposed)return;blocked=true;settle(error);onRejected(error);});
 }
 function request(){
  if(disposed)return Promise.reject(new DOMException('Closed','AbortError'));
  if(userPaused){since=now();target=played?6:3;waiting=true;}
  desired=true;userPaused=false;blocked=false;
  const result=new Promise((resolve,reject)=>waiters.push({resolve,reject}));check();return result;
 }
 function stopByUser(){desired=false;userPaused=true;waiting=false;settle(new DOMException('Paused','AbortError'));pause.call(video);state();}
 function stalled(){if(!desired||!played||video.paused)return;target=6;since=now();waiting=true;pause.call(video);state();}
 function playing(){played=true;waiting=false;state();}
 video.play=request;video.pause=stopByUser;
 video.addEventListener('waiting',stalled);video.addEventListener('playing',playing);video.addEventListener('progress',check);
 const timer=setInterval(check,250);
 return {check,get waiting(){return waiting&&desired;},get userPaused(){return userPaused;},destroy(){disposed=true;clearInterval(timer);video.removeEventListener('waiting',stalled);video.removeEventListener('playing',playing);video.removeEventListener('progress',check);video.play=play;video.pause=pause;settle(new DOMException('Closed','AbortError'));}};
}
