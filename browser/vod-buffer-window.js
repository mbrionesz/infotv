// Bound progressive VOD buffering by both time and average media size. Hysteresis keeps
// downloads from restarting for every tiny clock advance at the high mark.
export function createVodBufferWindow({maxAhead=40,resumeAhead=20,initialAhead=maxAhead}={}){
 let high=initialAhead,low=Math.min(resumeAhead,high*.6),back=15,waiting=false;
 return {configure(total,duration){const rate=total/duration;if(Number.isFinite(rate)&&rate>0){high=Math.max(3,Math.min(maxAhead,16*1024*1024/rate));low=Math.min(resumeAhead,high*.6);back=Math.max(1,Math.min(15,8*1024*1024/rate));}},shouldRead(ahead,queuedBytes=0){if(queuedBytes>8*1024*1024)return false;if(ahead>high)waiting=true;if(waiting&&ahead>low)return false;waiting=false;return true;},reset(){waiting=false;},get policy(){return {maxAhead:high,resumeAhead:low,backKeep:back};}};
}
