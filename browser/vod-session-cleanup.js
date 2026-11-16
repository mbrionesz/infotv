export function nearlyFinishedVod(context={}){
 const {position,duration,durationEstimated=false,live=false}=context||{};
 return !live&&!durationEstimated&&Number.isFinite(position)&&Number.isFinite(duration)&&duration>0&&duration<=43200&&position>=duration*.95&&position<=duration+5;
}
// Session-only data. Never erase the user's library, catalog or poster cache.
export function createVodSessionCleanup({release=()=>{},flush=()=>Promise.resolve(),now=Date.now}={}){
 let count=0,last=null;
 return {finish(context){if(!nearlyFinishedVod(context))return false;release(context);count++;last={at:now(),position:context.position,duration:context.duration};Promise.resolve().then(flush).catch(()=>{});return true;},snapshot:()=>({count,last:last&&Object.assign({},last)})};
}
export function releaseMp4Parser(file,tracks){
 try{file.stop();}catch(_){}
 file.onReady=file.onSegment=file.onSamples=file.onError=null;
 for(const track of tracks){track.queue.length=0;track.pending=null;}
 for(const track of file.moov&&file.moov.traks||[])try{file.releaseUsedSamples(track.tkhd.track_id,Math.min(track.samples.length,Math.max(track.lastValidSample||0,(track.nextSample||0)+1)));}catch(_){}
 if(file.stream&&Array.isArray(file.stream.buffers))file.stream.buffers.length=0;
 for(const name of ['fragmentedTracks','extractedTracks'])if(Array.isArray(file[name]))file[name].length=0;
}
