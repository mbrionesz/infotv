import MP4Box from 'mp4box';
import {createVodReader} from './vod-range.js';
import language from '../companion/lib/audio-language.js';
export function openMp4(video,url,headers,{onError,onReady,onRead,preferredAudio,audioIndex,audioLabels,onAudioTracks}={}){
 const reader=createVodReader(url,headers,onRead),file=MP4Box.createFile(),media=new MediaSource(),objectURL=URL.createObjectURL(media);
 let closed=false,generation=0,offset=0,total=Infinity,ready=false,eof=false,pumping=false,tracks=[],timer,queuedBytes=0,seekTime=null,aheadLimit=25,backKeep=15;
 const fail=error=>{if(!closed){onError(error.message||String(error));}};
 function ahead(){for(let i=0;i<video.buffered.length;i++)if(video.currentTime>=video.buffered.start(i)&&video.currentTime<=video.buffered.end(i))return video.buffered.end(i)-video.currentTime;return 0;}
 function drain(track){
  if(closed||track.sb.updating)return;
  if(track.reset){track.reset=false;if(track.sb.buffered.length){track.sb.remove(0,track.sb.buffered.end(track.sb.buffered.length-1));return;}}
  if(track.queue.length){const part=track.queue.shift();queuedBytes-=part.buffer.byteLength;track.pending=part;try{track.sb.appendBuffer(part.buffer);}catch(error){fail(error);}return;}
  if(video.currentTime>backKeep+5&&track.sb.buffered.length&&track.sb.buffered.start(0)<video.currentTime-backKeep-5){try{track.sb.remove(0,video.currentTime-backKeep);}catch(_){}return;}
  if(eof&&tracks.every(t=>!t.sb.updating&&!t.queue.length)&&media.readyState==='open'){try{media.endOfStream();}catch(_){}}
 }
 async function pump(){
  if(closed||pumping||eof||ready&&(ahead()>aheadLimit||queuedBytes>8*1024*1024))return;
  pumping=true;const run=generation;
  try{const result=await reader.read(offset);if(closed||run!==generation)return;total=result.total;result.data.fileStart=offset;const next=file.appendBuffer(result.data);offset=Number.isSafeInteger(next)&&next>=0&&next!==offset?next:offset+result.data.byteLength;if(offset>=total){file.flush();eof=true;tracks.forEach(drain);}}
  catch(error){if(!closed&&run===generation&&error.name!=='AbortError')fail(error);}
  finally{pumping=false;if(!closed&&!eof&&!(ready&&(ahead()>aheadLimit||queuedBytes>8*1024*1024)))timer=setTimeout(pump,0);}
 }
 file.onError=message=>fail(new Error('MP4: '+message));
 file.onReady=info=>{
  if(closed)return;ready=true;media.duration=info.duration/info.timescale;const bytesPerSecond=total/media.duration;if(Number.isFinite(bytesPerSecond)&&bytesPerSecond>0){aheadLimit=Math.max(3,Math.min(25,16*1024*1024/bytesPerSecond));backKeep=Math.max(1,Math.min(15,8*1024*1024/bytesPerSecond));}
  const audio=info.audioTracks||[],hints=String(audioLabels||'').split(/[,\/]/),choices=audio.map((track,i)=>({language:language.languageOf(track.language)?track.language:hints[i]||'',name:[track.name,hints[i],track.language].filter(Boolean).join(' ')}));let selectedIndex=Number.isInteger(audioIndex)&&audioIndex>=0&&audioIndex<audio.length?audioIndex:language.chooseAudioTrack(choices,preferredAudio||'es');if(selectedIndex<0)selectedIndex=0;const preferred=audio[selectedIndex];if(onAudioTracks)onAudioTracks(choices,selectedIndex);
  const selected=[(info.videoTracks||[])[0],preferred].filter(Boolean);
  if(!selected.length)return fail(new Error('MP4 sin pistas reproducibles'));
  try{for(const track of selected){const mime=(track.video?'video':'audio')+'/mp4; codecs="'+track.codec+'"';if(!MediaSource.isTypeSupported(mime))throw new Error('Códec '+track.codec+' no compatible con MediaSource de este TV');const entry={id:track.id,sb:media.addSourceBuffer(mime),queue:[],pending:null,reset:false};entry.sb.addEventListener('updateend',()=>{if(closed)return;if(entry.pending&&entry.pending.samples!==undefined)file.releaseUsedSamples(entry.id,entry.pending.samples);entry.pending=null;drain(entry);});entry.sb.addEventListener('error',()=>fail(new Error('El TV rechazó un bloque MP4')));tracks.push(entry);file.setSegmentOptions(track.id,entry,{nbSamples:track.video?48:96,rapAlignement:true});}
   for(const init of file.initializeSegmentation()){init.user.queue.push({buffer:init.buffer});queuedBytes+=init.buffer.byteLength;drain(init.user);}file.start();onReady&&onReady(Object.assign({},info,{videoTracks:(info.videoTracks||[]).slice(0,1),audioTracks:preferred?[preferred]:[]}));
  }catch(error){fail(error);}
 };
 file.onSegment=(id,track,buffer,samples)=>{if(closed)return;track.queue.push({buffer,samples});queuedBytes+=buffer.byteLength;if(queuedBytes>24*1024*1024)return fail(new Error('El MP4 requiere demasiada memoria de vídeo'));drain(track);};
 function seeking(){if(!ready||closed)return;const time=video.currentTime;if(time>=media.duration-0.05)return;for(let i=0;i<video.buffered.length;i++)if(time>=video.buffered.start(i)&&time<video.buffered.end(i)-0.1)return;if(seekTime!==null&&Math.abs(seekTime-time)<0.1)return;seekTime=time;generation++;reader.abort();eof=false;file.stop();let seek;try{seek=file.seek(time,true);}catch(error){fail(error);return;}if(!Number.isSafeInteger(seek.offset)||seek.offset<0||seek.offset>=total){fail(new Error("Posición MP4 no disponible"));return;}offset=seek.offset;for(const track of tracks){queuedBytes-=track.queue.reduce((sum,p)=>sum+p.buffer.byteLength,0);track.queue=[];track.reset=true;if(track.sb.updating)try{track.sb.abort();}catch(_){}drain(track);}file.start();if(!pumping)pump();}
 video.addEventListener('seeking',seeking);media.addEventListener('sourceopen',()=>{if(!closed)pump();},{once:true});video.src=objectURL;
 const interval=setInterval(()=>{tracks.forEach(drain);pump();},250);
 return {destroy(){if(closed)return;closed=true;generation++;reader.close();clearInterval(interval);clearTimeout(timer);video.removeEventListener('seeking',seeking);file.stop();file.onReady=file.onSegment=file.onError=null;for(const track of tracks)track.queue=[];URL.revokeObjectURL(objectURL);}};
}
