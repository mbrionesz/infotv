// Estimated compressed-media budget, not a cap on the TV's total RAM.
// Extra pause reserve requires a known average bitrate; unknown TS keeps its target.
export function createVodBufferWindow({maxAhead=40,resumeAhead=20,initialAhead=maxAhead,pausedAhead=90}={}){
 let high=initialAhead,low=Math.min(resumeAhead,high*.6),back=15,waiting=false,paused=false,rate=0;
 function configure(){const bytes=(paused?24:16)*1024*1024;high=rate?Math.max(3,Math.min(paused?pausedAhead:maxAhead,bytes/rate)):initialAhead;low=Math.min(paused?Math.min(45,pausedAhead*.5):resumeAhead,high*.6);back=rate?Math.max(1,Math.min(15,8*1024*1024/rate)):15;}
 function setPaused(value){if(paused!==!!value){paused=!!value;waiting=false;configure();}}
 return {setPaused,configure(total,duration){const value=total/duration;if(Number.isFinite(value)&&value>0){rate=value;configure();}},shouldRead(ahead,queuedBytes=0,isPaused=false){setPaused(isPaused);if(queuedBytes>8*1024*1024)return false;if(ahead>high)waiting=true;if(waiting&&ahead>low)return false;waiting=false;return true;},reset(){waiting=false;},get policy(){return {maxAhead:high,resumeAhead:low,backKeep:back,paused,estimatedForwardBytes:(paused?24:16)*1024*1024,rateKnown:rate>0};}};
}
