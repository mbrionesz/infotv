export function createLiveLatency(enabled=true){
 let stalls=0,positioned=false,disabled=false;
 const state={mode:'stable',targetSegments:3,stalls:0,reason:''};
 return {state,update(hls,video,live){
  const eligible=enabled&&live&&video.videoHeight===720&&video.videoWidth<=1280&&!disabled;
  state.targetSegments=eligible?2:3;state.mode=eligible?'720p-low-delay':'stable';hls.config.liveSyncDurationCount=state.targetSegments;
  if(!eligible||positioned||video.paused||video.readyState<2)return;
  const target=hls.liveSyncPosition;
  if(!Number.isFinite(target))return;
  if(target<=video.currentTime+1){positioned=true;return;}
  for(let i=0;i<video.buffered.length;i++)if(target>=video.buffered.start(i)&&target+0.5<=video.buffered.end(i)){video.currentTime=target;positioned=true;break;}
 },stall(){state.stalls=++stalls;if(stalls>=2){disabled=true;state.reason='repeated-stalls';}}};
}
