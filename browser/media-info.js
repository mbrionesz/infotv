export function frameAspect(width,height){width=Number(width);height=Number(height);if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;const ratio=width/height,candidates=[[16/9,'16:9'],[4/3,'4:3'],[21/9,'21:9'],[2.39,'2.39:1'],[2.4,'2.40:1'],[1.85,'1.85:1'],[2,'2:1'],[1,'1:1']];const closest=candidates.slice().sort((a,b)=>Math.abs(a[0]-ratio)-Math.abs(b[0]-ratio))[0];return {ratio:Math.round(ratio*10000)/10000,label:Math.abs(closest[0]-ratio)/ratio<0.006?closest[1]:ratio.toFixed(2)+':1',source:'decoded-frame',embeddedBars:'unknown'};}
export function formatMediaInfo(d={}){
 const media=d.media||{},level=d.level||{},codecs=d.codecs||{};
 const width=media.width||level.width,height=media.height||level.height;
 const resolution=width&&height?width+'×'+height:'Resolución sin datos';
 const declared=Number(level.fps),measured=Number(media.measuredFps);
 const fps=Number.isFinite(declared)&&declared>0?declared.toFixed(2).replace('.',',')+' FPS declarados':Number.isFinite(measured)&&measured>0?measured.toFixed(2).replace('.',',')+' FPS medidos':'FPS sin datos';
 function codec(value){return /^avc1/i.test(value)?'H.264':/^hev1|^hvc1/i.test(value)?'HEVC':/^mp4a/i.test(value)?'AAC':/^ec-3/i.test(value)?'E-AC-3':/^ac-3/i.test(value)?'AC-3':value||'';}
 const video=codec(codecs.video&&codecs.video.codec),audio=codec(codecs.audio&&codecs.audio.codec);
 const aspect=frameAspect(width,height);return [resolution,fps,video,audio,aspect?'Fotograma '+aspect.label:''].filter(Boolean).join(' · ');
}
// One frame callback per health sample, not a per-frame JavaScript loop.
export function createFrameMeter(video){
 let pending=null,previous=null,fps=null,disposed=false;
 function sample(){
  if(video.paused||video.readyState<3){previous=null;fps=null;return;}
  if(typeof video.requestVideoFrameCallback!=='function'||pending!==null)return;
  try{pending=video.requestVideoFrameCallback((time,metadata)=>{
   pending=null;if(disposed)return;
   if(video.paused||video.readyState<3){previous=null;fps=null;return;}
   const next={time,frames:metadata.presentedFrames};
   if(previous){const dt=next.time-previous.time,frames=next.frames-previous.frames;fps=dt>=500&&dt<=6000&&frames>0?Math.round(frames*100000/dt)/100:null;}
   previous=next;
  });}catch(_){pending=null;previous=null;fps=null;}
 }
 return {sample,read:()=>({measuredFps:fps,fpsMethod:fps===null?'unavailable':'presented-frame-counters'}),destroy(){disposed=true;if(pending!==null&&typeof video.cancelVideoFrameCallback==='function')try{video.cancelVideoFrameCallback(pending);}catch(_){}pending=null;}};
}
