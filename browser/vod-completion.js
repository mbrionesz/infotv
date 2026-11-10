// End-of-file must be confirmed by the reader, never inferred from a network stall.
export function createVodCompletion(video,onEnded,{now=Date.now}={}){
 let eof=false,done=false,lastEnd=-1,stableAt=0;
 return {reset(){eof=false;done=false;lastEnd=-1;stableAt=0;},complete(){eof=true;stableAt=now();},check(){
  if(!eof||done||video.seeking||video.paused||!video.buffered.length)return false;
  const end=video.buffered.end(video.buffered.length-1);
  if(!Number.isFinite(end)||end<=1)return false;
  if(Math.abs(end-lastEnd)>.02){lastEnd=end;stableAt=now();return false;}
  if(now()-stableAt<1500||video.currentTime<end-.2)return false;
  done=true;onEnded?.();return true;
 }};
}
