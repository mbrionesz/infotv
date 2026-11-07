export function createLiveLatency(enabled=true,{now=()=>performance.now()}={}){
 let stalls=0,disabled=false,lastSeek=-Infinity,seekTimes=[];
 const state={mode:'stable',targetSegments:3,stalls:0,reason:'',alignmentSeeks:0,alignment:'waiting-metadata'};
 return {state,update(hls,video,live,allowSeek=true){
  const eligible=enabled&&live&&video.videoHeight===720&&video.videoWidth<=1280&&!disabled;
  state.targetSegments=eligible?1:3;state.experimental=!!eligible;state.mode=eligible?'720p-low-delay':'stable';hls.config.liveSyncDurationCount=state.targetSegments;
  const details=hls.latestLevelDetails;
  const edge=details&&details.live&&Number.isFinite(details.edge)?details.edge+Math.max(0,details.age||0):null;
  state.seconds=edge===null?null:Math.round(Math.max(0,edge-video.currentTime)*100)/100;
  state.measurementMethod=edge===null?'unavailable':'playlist-edge-plus-age';
  state.engineTargetSeconds=Number.isFinite(hls.targetLatency)?Math.round(hls.targetLatency*100)/100:null;
  const target=hls.liveSyncPosition;
  state.engineSyncPosition=Number.isFinite(target)?Math.round(target*100)/100:null;
  if(!eligible){state.alignment='stable-profile';return;}
  if(!allowSeek){state.alignment='settling-playback';return;}
  if(!details||!details.live||video.readyState<2){state.alignment='waiting-metadata';return;}
  if(video.paused||video.seeking){state.alignment=video.paused?'paused':'seeking';return;}
  if(!Number.isFinite(target)){state.alignment='waiting-target';return;}
  const advance=target-video.currentTime;
  if(advance<=1){state.alignment='aligned';return;}
  const time=now();seekTimes=seekTimes.filter(at=>time-at<60000);
  if(time-lastSeek<10000){state.alignment='settling';return;}
  if(seekTimes.length>=3){state.alignment='seek-budget';return;}
  state.alignment='waiting-buffer';
  for(let i=0;i<video.buffered.length;i++)if(target>=video.buffered.start(i)&&target+0.5<=video.buffered.end(i)){
   state.lastSeekFrom=video.currentTime;state.lastSeekTo=target;state.lastSeekAdvance=Math.round(advance*100)/100;
   video.currentTime=target;state.alignmentSeeks++;state.alignment='seek-requested';lastSeek=time;seekTimes.push(time);break;
  }
 },stall(){state.stalls=++stalls;if(stalls>=2){disabled=true;state.reason='repeated-stalls';}}};
}
