// Windows-only decoder on an app-owned native surface. App controls and library retain their clock.
export function needsDesktopDecoder(stream,source=globalThis.MediaSource){return /h265|hevc|hvc1|hev1/i.test(stream.codec||stream.selectedTrack?.codec||'')&&!(source&&typeof source.isTypeSupported==='function'&&source.isTypeSupported('video/mp4; codecs="hvc1.1.1.L93.B0"'));}
export function openDesktopNative(video,stream,options){
 const bridge=window.XuperDesktop;let id=null,closed=false,timer=null,off=null,busy=false,ended=false,refreshing=false,notifiedClosed=false,pollFailures=0,cancelRenew=null;const state={time:Number(options.startTime)||0,duration:Number(stream.duration)||Number(options.declaredDuration)||0,paused:false,ready:false,tracks:[],width:0,height:0};
 const descriptors={},play=video.play,pause=video.pause;for(const key of ['currentTime','duration','paused','readyState','src','videoWidth','videoHeight'])descriptors[key]=Object.getOwnPropertyDescriptor(video,key);
 const command=(action,value)=>id&&!closed?bridge.mediaCommand(id,action,value).catch(()=>{}):Promise.resolve();
 Object.defineProperties(video,{currentTime:{configurable:true,get:()=>state.time,set:value=>{if(Number.isFinite(value)&&value>=0){seek(value).catch(()=>{});}}},duration:{configurable:true,get:()=>state.duration},paused:{configurable:true,get:()=>state.paused},readyState:{configurable:true,get:()=>state.ready?4:0},src:{configurable:true,get:()=>stream.url,set:()=>{}},videoWidth:{configurable:true,get:()=>state.width},videoHeight:{configurable:true,get:()=>state.height}});
 video.play=()=>{state.paused=false;video.dispatchEvent(new Event('play'));return command('pause',false);};video.pause=()=>{state.paused=true;video.dispatchEvent(new Event('pause'));command('pause',true);};
 const global=window.XuperWindowsMedia||(window.XuperWindowsMedia={});const seek=async value=>{if(!id||closed||!state.ready)throw Error('Espera a que el vídeo termine de abrir.');try{state.controlNotice='Buscando el minuto solicitado…';options.onState(state);const next=await bridge.mediaCommand(id,'seek',value);if(!closed){if(next&&next.id===id)apply(next);state.controlNotice='Salto confirmado';options.onState(state);}return next;}catch(error){const message='No se pudo confirmar el salto. '+String(error.message||error).replace(/^Error invoking remote method[^:]*: Error: /,'');if(!closed){state.controlNotice=message;options.onState(state);options.onNotice?.(message);}throw error;}};global.seek=seek;const subtitle=choice=>id&&!closed?bridge.mediaSubtitle(id,choice||null).catch(()=>{}):Promise.resolve();global.subtitle=subtitle;global.engine=bridge.nativeEngine||'vlc';let previousStyle='';const style=value=>{const key=JSON.stringify(value);if(key===previousStyle)return Promise.resolve();previousStyle=key;return command('subtitle-style',value);};if(bridge.nativeEngine==='libmpv')global.style=style;
 function apply(next){if(closed)return;const oldTime=state.time,oldDuration=state.duration;Object.assign(state,next);options.onState(state);if(state.duration!==oldDuration)video.dispatchEvent(new Event('durationchange'));if(state.time!==oldTime)video.dispatchEvent(new Event('timeupdate'));if(state.ended&&!ended){ended=true;video.dispatchEvent(new Event('ended'));}}
 function finishState(next){if(closed||notifiedClosed)return;notifiedClosed=true;clearInterval(timer);cancelRenew?.();apply(next);if(next.error)options.onError(next.error);else if(!next.ended)options.onClosed();}
 function reportError(message){if(closed||notifiedClosed)return;notifiedClosed=true;clearInterval(timer);options.onError(message);}
 async function renew(){
  if(refreshing||closed)return;refreshing=true;
  try{const fresh=await new Promise((resolve,reject)=>{let settled=false;const timeout=setTimeout(()=>done(Error('Tiempo de renovación agotado.')),18000);function done(error,value){if(settled)return;settled=true;clearTimeout(timeout);cancelRenew=null;error?reject(error):value?resolve(value):reject(Error('No se recibió un enlace renovado.'));}cancelRenew=()=>done(Error('Renovación cancelada.'));try{stream.refreshStream(done);}catch(error){done(error);}});if(closed||notifiedClosed)return;await bridge.refreshMedia(id,{url:fresh.url,headers:fresh.headers||{}});}
  catch(_){reportError('No se pudo renovar la autorización del vídeo.');}finally{refreshing=false;}
 }
 async function poll(){if(closed||notifiedClosed||!id||busy)return;busy=true;try{const next=await bridge.mediaState(id);pollFailures=0;if(next.closed){finishState(next);return;}apply(next);if(next.error&&!next.refreshRequired){reportError(next.error);return;}if(next.refreshRequired&&typeof stream.refreshStream==='function')await renew();}catch(_){if(++pollFailures>=3)reportError('No se pudo consultar el estado del reproductor.');}finally{busy=false;}}
 let previousLayout='';
 function layout(){
  if(closed||!bridge.mediaLayout)return;
  const rect=video.getBoundingClientRect(),screen=document.getElementById('screen-player');
  const occlusions=[];let bottom=rect.bottom,hidden=!!screen&&(getComputedStyle(screen).display==='none'||screen.hidden);
  // Keep HTML controls visible above the native surface. Menus get the complete
  // renderer surface; video continues behind them without losing the decoder.
  for(const selector of ['#player-infobar','#player-vod-infobar','.xt-player-chrome','.xt-next-episode','#player-playsetting-view','#dialog-playsettings','.xt-vod-recovery']){
   const overlay=document.querySelector(selector);if(!overlay)continue;
   const style=getComputedStyle(overlay),box=overlay.getBoundingClientRect();
   if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||box.height<2)continue;
   if(selector==='.xt-next-episode')occlusions.push({x:box.left-rect.left,y:box.top-rect.top,width:box.width,height:box.height});
   else if(selector==='#player-infobar'||selector==='#player-vod-infobar'||selector==='.xt-player-chrome')bottom=Math.min(bottom,box.top);
   else hidden=true;
  }
  const bounds={x:rect.left,y:rect.top,width:rect.width,height:rect.height,clipHeight:Math.max(0,bottom-rect.top),occlusions,hidden},key=JSON.stringify(bounds);
  if(key!==previousLayout){previousLayout=key;bridge.mediaLayout(bounds);}
 }
 const layoutTimer=setInterval(layout,150);window.addEventListener?.('resize',layout);layout();
 const ready=Promise.resolve().then(()=>bridge.startMedia({url:stream.url,headers:stream.headers||{},name:stream.name||'Reproducción',preferredAudio:options.preferredAudio,startTime:state.time,duration:state.duration,subtitle:window.__xuper?.subtitleForPlayback?.()||null,subtitleStyle:window.__xuper?.subtitleStyleForPlayback?.()||{font:0,size:0,color:0}})).then(result=>{id=result.id;if(closed){bridge.stopMedia(id);return;}off=bridge.onMediaClosed(next=>{if(next.id!==id||closed)return;finishState(next);});timer=setInterval(poll,500);poll();},error=>{if(!closed)options.onError(error.message||'No pudo iniciar el motor compatible.');});
 return {ready,get state(){return state;},subtitle,selectAudio(index){const track=state.tracks.filter(track=>track.type==='audio')[index];if(!track)return false;command('audio',track.id);return true;},destroy(){if(closed)return;closed=true;cancelRenew?.();clearInterval(timer);clearInterval(layoutTimer);window.removeEventListener?.('resize',layout);off?.();if(id)bridge.stopMedia(id);if(global.subtitle===subtitle)delete global.subtitle;if(global.seek===seek){delete global.seek;delete global.engine;}if(global.style===style){delete global.style;delete global.engine;}for(const key of Object.keys(descriptors)){delete video[key];if(descriptors[key])Object.defineProperty(video,key,descriptors[key]);}video.play=play;video.pause=pause;}};
}
