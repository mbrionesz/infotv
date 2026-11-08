// Compare only media playlists from the same loader URL and playback session.
// Never rewrite sequence numbers or signed segment URLs to hide an inconsistency.
export function playlistTimelineIssue(previous,next,atMs){
 if(!previous||!previous.segments||!next.segments||!Number.isSafeInteger(previous.mediaSequence)||!Number.isSafeInteger(next.mediaSequence))return null;
 const delta=next.mediaSequence-previous.mediaSequence;
 if(delta<0)return {kind:'media-sequence-regression',previous:previous.mediaSequence,received:next.mediaSequence};
 const duration=Math.max(1,Number(previous.targetDuration)||Number(next.targetDuration)||1);
 const elapsed=Math.max(0,atMs-previous.atMs)/1000;
 // Allow missed reloads and genuine long gaps. A 5s reload cannot add hours.
 const allowance=Math.max(18,previous.segments*3,Math.ceil(elapsed/duration)+previous.segments*2);
 if(delta>allowance)return {kind:'media-sequence-jump',previous:previous.mediaSequence,received:next.mediaSequence,allowance};
 if(Number.isSafeInteger(previous.discontinuitySequence)&&Number.isSafeInteger(next.discontinuitySequence)&&next.discontinuitySequence<previous.discontinuitySequence)return {kind:'discontinuity-sequence-regression',previous:previous.discontinuitySequence,received:next.discontinuitySequence};
 return null;
}
export function clockOutsideBuffer(sample){
 return Number.isFinite(sample.bufferEnd)&&sample.bufferEnd>0&&Number.isFinite(sample.time)&&sample.time>sample.bufferEnd+30;
}
