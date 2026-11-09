import {estimateTsDuration} from './ts-duration.js';
import mpegts from 'mpegts.js';
import {createVodReader} from './vod-range.js';
import {createTsSeekState} from './ts-seek.js';
export function openTs(video,url,headers,{onError,onRead,duration=0,onReady,onNotice,preferredAudio,audioIndex,audioLabels,onAudioTracks,refreshSource,resumeHint,onSeekIndex,onDuration}={}){
 const source={url,headers};const renew=refreshSource?async()=>{const fresh=await refreshSource();source.url=fresh.url;source.headers=fresh.headers||{};return fresh;}:null;
 let durationStarted=false,durationReader=null,destroyed=false;
 function probeDuration(first,total){if(duration||durationStarted||!onDuration)return;durationStarted=true;if(total<=first.byteLength){const found=estimateTsDuration(first,first);if(found)onDuration(found);return;}durationReader=createVodReader(source.url,source.headers,()=>{});const length=Math.min(512*1024,total),start=total-length;durationReader.read(start,length).then(result=>{if(!destroyed&&result.total===total){const found=estimateTsDuration(first,result.data);if(found)onDuration(found);}},()=>{}).finally(()=>{if(durationReader)durationReader.close();durationReader=null;});}
 const seekState=createTsSeekState(resumeHint,onSeekIndex,new URL(url).pathname);
 class Loader{
  constructor(){this.type='authorized-range';this.status=0;this.needStashBuffer=true;this.reader=null;this.run=0;}
  isWorking(){return this.status===1||this.status===2;}
  open(data,range){this.abort();const run=++this.run;this.status=1;this.reader=createVodReader(source.url,source.headers,onRead,renew);const reader=this.reader;let offset=range.from||0,received=0;const start=offset;
   const loop=async()=>{try{while(run===this.run){const result=await reader.read(offset);if(run!==this.run)return;if(offset===0){seekState.identify(result.data,result.total);probeDuration(result.data,result.total);}this.status=2;if(!received&&this.onContentLengthKnown)this.onContentLengthKnown(result.total-start);received+=result.data.byteLength;if(this.onDataArrival)this.onDataArrival(result.data,offset,received);if(run!==this.run)return;offset+=result.data.byteLength;if(offset>=result.total||range.to>=0&&offset>range.to){this.status=4;if(this.onComplete)this.onComplete(start,offset-1);return;}await new Promise(resolve=>setTimeout(resolve,0));}}catch(error){if(run!==this.run)return;this.status=3;if(this.onError)this.onError('Exception',{code:error.status||0,msg:error.message});}};loop();
  }
  abort(){this.run++;if(this.reader)this.reader.close();this.reader=null;this.status=0;}
  destroy(){this.abort();this.onDataArrival=this.onError=this.onComplete=null;}
 }
 let lastTime=0,restoring=false;function remember(){if(!video.seeking)lastTime=video.currentTime;}function guardSeek(event){const time=video.currentTime;for(let i=0;i<video.buffered.length;i++)if(time>=video.buffered.start(i)&&time<video.buffered.end(i)-0.05)return;if(!video.buffered.length)return;if(seekState.canSeek(time))return;event.stopImmediatePropagation();if(restoring)return;restoring=true;let safe=lastTime;let contained=false;for(let i=0;i<video.buffered.length;i++)if(safe>=video.buffered.start(i)&&safe<video.buffered.end(i)-0.05)contained=true;if(!contained)safe=video.buffered.start(0)+0.1;video.currentTime=safe;restoring=false;if(onNotice)onNotice('Esta señal MPEG-TS permite avanzar solo dentro del tramo ya cargado.');}
 const player=mpegts.createPlayer({type:'mpegts',url,isLive:false,duration:duration?duration*1000:undefined},{xuperTsDuration:Math.max(duration||0,resumeHint&&resumeHint.position+30||0)*1000,xuperTsSeek:seekState,accurateSeek:true,xuperAudioLanguage:preferredAudio||'es',xuperAudioIndex:audioIndex,xuperAudioLabels:audioLabels||'',onXuperAudio:onAudioTracks,enableWorker:false,customLoader:Loader,enableStashBuffer:true,stashInitialSize:128*1024,lazyLoad:true,lazyLoadMaxDuration:25,lazyLoadRecoverDuration:10,autoCleanupSourceBuffer:true,autoCleanupMaxBackwardDuration:30,autoCleanupMinBackwardDuration:15});
 video.addEventListener('seeking',guardSeek,true);video.addEventListener('timeupdate',remember);
 player.on(mpegts.Events.ERROR,(type,detail,info)=>onError('MPEG-TS: '+(info&&info.msg||detail||type)));
 player.on(mpegts.Events.MEDIA_INFO,info=>onReady&&onReady(info));try{player.attachMediaElement(video);player.load();}catch(error){video.removeEventListener('seeking',guardSeek,true);video.removeEventListener('timeupdate',remember);player.destroy();throw error;}
 return {bookmark:position=>seekState.bookmark(position),canSeek:time=>seekState.canSeek(time),destroy(){destroyed=true;if(durationReader)durationReader.close();video.removeEventListener('seeking',guardSeek,true);video.removeEventListener('timeupdate',remember);player.destroy();}};
}
