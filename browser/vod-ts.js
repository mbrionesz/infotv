import mpegts from 'mpegts.js';
import {createVodReader} from './vod-range.js';
export function openTs(video,url,headers,{onError,onRead,duration=0,onReady,onNotice,preferredAudio,audioIndex,audioLabels,onAudioTracks}={}){
 class Loader{
  constructor(){this.type='authorized-range';this.status=0;this.needStashBuffer=true;this.reader=null;this.run=0;}
  isWorking(){return this.status===1||this.status===2;}
  open(data,range){this.abort();const run=++this.run;this.status=1;this.reader=createVodReader(url,headers,onRead);const reader=this.reader;let offset=range.from||0,received=0;const start=offset;
   const loop=async()=>{try{while(run===this.run){const result=await reader.read(offset);if(run!==this.run)return;this.status=2;if(this.onContentLengthKnown)this.onContentLengthKnown(result.total-start);received+=result.data.byteLength;if(this.onDataArrival)this.onDataArrival(result.data,offset,received);if(run!==this.run)return;offset+=result.data.byteLength;if(offset>=result.total||range.to>=0&&offset>range.to){this.status=4;if(this.onComplete)this.onComplete(start,offset-1);return;}await new Promise(resolve=>setTimeout(resolve,0));}}catch(error){if(run!==this.run)return;this.status=3;if(this.onError)this.onError('Exception',{code:error.status||0,msg:error.message});}};loop();
  }
  abort(){this.run++;if(this.reader)this.reader.close();this.reader=null;this.status=0;}
  destroy(){this.abort();this.onDataArrival=this.onError=this.onComplete=null;}
 }
 let lastTime=0,restoring=false;function remember(){if(!video.seeking)lastTime=video.currentTime;}function guardSeek(event){const time=video.currentTime;for(let i=0;i<video.buffered.length;i++)if(time>=video.buffered.start(i)&&time<video.buffered.end(i)-0.05)return;if(!video.buffered.length)return;event.stopImmediatePropagation();if(restoring)return;restoring=true;let safe=lastTime;let contained=false;for(let i=0;i<video.buffered.length;i++)if(safe>=video.buffered.start(i)&&safe<video.buffered.end(i)-0.05)contained=true;if(!contained)safe=video.buffered.start(0)+0.1;video.currentTime=safe;restoring=false;if(onNotice)onNotice('Esta señal MPEG-TS permite avanzar solo dentro del tramo ya cargado.');}
 const player=mpegts.createPlayer({type:'mpegts',url,isLive:false,duration:duration?duration*1000:undefined},{xuperAudioLanguage:preferredAudio||'es',xuperAudioIndex:audioIndex,xuperAudioLabels:audioLabels||'',onXuperAudio:onAudioTracks,enableWorker:false,customLoader:Loader,enableStashBuffer:true,stashInitialSize:128,lazyLoad:true,lazyLoadMaxDuration:25,lazyLoadRecoverDuration:10,autoCleanupSourceBuffer:true,autoCleanupMaxBackwardDuration:30,autoCleanupMinBackwardDuration:15});
 video.addEventListener('seeking',guardSeek,true);video.addEventListener('timeupdate',remember);
 player.on(mpegts.Events.ERROR,(type,detail,info)=>onError('MPEG-TS: '+(info&&info.msg||detail||type)));
 player.on(mpegts.Events.MEDIA_INFO,info=>onReady&&onReady(info));try{player.attachMediaElement(video);player.load();}catch(error){video.removeEventListener('seeking',guardSeek,true);video.removeEventListener('timeupdate',remember);player.destroy();throw error;}
 return {destroy(){video.removeEventListener('seeking',guardSeek,true);video.removeEventListener('timeupdate',remember);player.destroy();}};
}
