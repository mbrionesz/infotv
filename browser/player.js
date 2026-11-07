import {ensureVodRuntime} from './vod-runtime.js';
import {createLiveLatency} from './live-latency.js';
import {createFrameMeter} from './media-info.js';
import {playlistShape,playlistReason,safeParserMessage} from './playlist-shape.js';
import {createLiveBuffer} from './live-buffer.js';
import {mediaHealth,recoveryBudget} from './playback-health.js';
import {playbackRejection,liveLoadPolicy} from './playback-policy.js';
import {nativeHlsLoad} from './native-hls-loader.js';
import Hls from 'hls.js';
import {MAX_CDN_CANDIDATES,streamCandidates,streamRoutes} from './stream-candidates.js';
export function toAvDisplayRect(rect,width=1920,height=1080){
  const x=Math.max(0,Math.min(1919,Math.round(rect.left*1920/width)));
  const y=Math.max(0,Math.min(1079,Math.round(rect.top*1080/height)));
  return [x,y,Math.max(1,Math.min(1920-x,Math.round(rect.width*1920/width))),Math.max(1,Math.min(1080-y,Math.round(rect.height*1080/height)))];
}

export function createPlayer(getStream) {
  let progressive=null;
  let video = null, hls = null, av = null, avObject = null, engine = '', url = '', serial = 0;
  let paused = true, currentTime = 0, ready = false, started = false, deadline = null, cleanupTimer = null, nativeTimer = null, totalDeadline=null;
  let restored = null, playingListener = null, canPlayListener=null,resumePlayback=null,healthTimer=null,recoveryTimer=null,sourceRefreshTimer=null,bufferGate=null,frameMeter=null;
  const diagnostics = { engine: '', stage:'idle',error: '', recoveries: 0, hlsVersion: Hls.version, httpStatus:0, detail:'',worker:false };
  function emit(name) { if (video) video.dispatchEvent(new Event(name)); }
  function stop() {
    if(frameMeter){frameMeter.destroy();frameMeter=null;}
    if(bufferGate){bufferGate.destroy();bufferGate=null;}diagnostics.bufferGate=null;
    clearInterval(healthTimer);clearTimeout(sourceRefreshTimer);sourceRefreshTimer=null;clearTimeout(recoveryTimer);healthTimer=recoveryTimer=null;resumePlayback=null;++serial;clearTimeout(totalDeadline);clearTimeout(nativeTimer);clearTimeout(deadline); clearInterval(cleanupTimer); deadline = cleanupTimer = null;
    if (video && playingListener) video.removeEventListener('playing', playingListener);
    if(video&&canPlayListener)video.removeEventListener('canplay',canPlayListener);
    canPlayListener=null;playingListener = null;
    if(progressive){progressive.destroy();progressive=null;}
    if (hls) { hls.destroy(); hls = null; }
    if (av) { try { av.stop(); av.close(); } catch (_) {} av = null; }
    if (avObject) { avObject.remove(); avObject = null; }
    if (restored) { restored(); restored = null; }
    if (video) { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (_) {} }
    engine = ''; diagnostics.engine = '';diagnostics.stage='idle';diagnostics.sequenceRestartPending=false; paused = true; ready = started = false;
  }
  function capabilities() {
    const v = document.createElement('video');
    const codecs = { h264: 'video/mp4; codecs="avc1.42E01E"', hevc: 'video/mp4; codecs="hvc1.1.6.L93.B0"',
      aac: 'audio/mp4; codecs="mp4a.40.2"', ac3: 'audio/mp4; codecs="ac-3"', eac3: 'audio/mp4; codecs="ec-3"', dts: 'audio/mp4; codecs="dtsc"' };
    const result = {};
    Object.keys(codecs).forEach(key => { result[key] = { native: v.canPlayType(codecs[key]) || '', mse: !!(window.MediaSource && MediaSource.isTypeSupported(codecs[key])) }; });
    return { progressiveVod:!!window.MediaSource,progressiveModuleLoaded:!!window.XuperVod,avplay: !!(window.webapis && webapis.avplay), hlsjs: Hls.isSupported(), codecs: result };
  }
  function open(element, source, options) {
    stop(); video = element; url = source;
    const run = serial;let playbackSource=source;
    let lowDelay=false;try{lowDelay=localStorage.getItem('xt.lowDelay720')==='on';}catch(_){}
    const latencyPolicy=createLiveLatency(lowDelay);diagnostics.liveLatency=latencyPolicy.state;
    const stream = getStream(source) || {};
    const candidates=streamCandidates(source,stream),routes=streamRoutes(candidates);let routeIndex=0,attempt=0;
    let headers = candidates[0].headers;
    const isHls = /\.m3u8(?:[?#]|$)/i.test(source) || /mpegurl/i.test(stream.mime || options.mime || '');
    const custom = Object.keys(headers).filter(key => !/^(user-agent|cookie)$/i.test(key));
    diagnostics.vodRetries=0;diagnostics.vodBytes=0;diagnostics.vodTotalBytes=0;diagnostics.unsupportedRoute='';diagnostics.container=isHls?'HLS':(stream.mime||options.mime||'desconocido');diagnostics.error = ''; diagnostics.recoveries = 0;diagnostics.httpStatus=0;diagnostics.detail='';diagnostics.stage='opening';diagnostics.cdnAttempt=1;diagnostics.cdnAvailable=candidates.length;diagnostics.cdnReceived=1+(stream.backupUrls||[]).length;diagnostics.cdnLimit=MAX_CDN_CANDIDATES;diagnostics.cdnHosts=candidates.map(item=>new URL(item.url).hostname);diagnostics.playlistHosts=[];diagnostics.uriRepairs=0;diagnostics.worker=false;diagnostics.freshPlaylistRetries=0;diagnostics.networkRetries=0;diagnostics.networkRecoveries=0;diagnostics.autoplayBlocked=false;diagnostics.playRejection='';diagnostics.startupMs=0;diagnostics.sourceResolveMs=Number.isFinite(stream.resolveMs)?stream.resolveMs:null;diagnostics.channelOpenMs=null;diagnostics.media=null;diagnostics.events=[];diagnostics.level=null;diagnostics.codecs={};diagnostics.stallRecoveries=0;diagnostics.sourceRefreshes=options._sourceRefreshed?1:0;diagnostics.bufferGate=null;diagnostics.playlistError=null;diagnostics.playlistRepairs=0;diagnostics.playlistHistory=[];diagnostics.playlistRequests=0;diagnostics.sequenceRestarts=0;diagnostics.sequenceFailovers=0;diagnostics.sequenceRestartPending=false;diagnostics.sequenceRecoveryMs=null;
    diagnostics.transport=/^https:/i.test(source)?'https':'http';diagnostics.httpsFallback=false;
    const fail = message => {
      if (serial !== run) return;
      const failedStage=diagnostics.stage;diagnostics.error = message; stop();diagnostics.stage=failedStage; options.onError(message);
    };
    totalDeadline=setTimeout(()=>fail('La señal no inició tras probar las rutas disponibles: etapa '+diagnostics.stage+'. Abre Diagnóstico.'),30000);
    const restartedRoutes=new Set();let sequenceRestartAt=null;
    const openedAt=performance.now();let alignmentReadyAt=Infinity;let playPending=false,autoAttempts=0,gestureRequired=false,resuming=false;const networkBudget=recoveryBudget(),decoderBudget=recoveryBudget(1);let lastProgressAt=performance.now(),lastTime=0;
    function tryPlay(){
      if(serial!==run||started&&!resuming||bufferGate&&bufferGate.userPaused||playPending||gestureRequired||!video.paused||autoAttempts>=3)return;
      const playGeneration=attempt;autoAttempts++;playPending=true;
      let result;try{result=video.play();}catch(error){result=Promise.reject(error);}
      Promise.resolve(result).then(()=>{if(serial===run&&playGeneration===attempt)playPending=false;},error=>{
        if(serial!==run||playGeneration!==attempt)return;playPending=false;const rejection=playbackRejection(error);diagnostics.playRejection=rejection;
        if(rejection==='gesture'){gestureRequired=true;diagnostics.autoplayBlocked=true;options.onError('Pulsa OK para iniciar el vídeo.');}
        else if(rejection==='interrupted'&&!(bufferGate&&bufferGate.userPaused)&&video.readyState>=2&&autoAttempts<3)setTimeout(tryPlay,0);
      });
    }
    resumePlayback=()=>{gestureRequired=false;autoAttempts=0;diagnostics.autoplayBlocked=false;tryPlay();};
    const onPlaying = () => { if (serial !== run||engine==='hls.js'&&(!hls||video.readyState<2)) return; started = ready = true;alignmentReadyAt=performance.now()+500;if(hls)latencyPolicy.update(hls,video,options.live,false);resuming=false;gestureRequired=false; paused = false;diagnostics.stage='playing';diagnostics.error='';if(sequenceRestartAt!==null){diagnostics.sequenceRecoveryMs=Math.round(performance.now()-sequenceRestartAt);sequenceRestartAt=null;}diagnostics.sequenceRestartPending=false;diagnostics.autoplayBlocked=false;if(!diagnostics.startupMs)diagnostics.startupMs=Math.round(performance.now()-openedAt);clearTimeout(totalDeadline);clearTimeout(deadline); diagnostics.channelOpenMs=diagnostics.sourceResolveMs===null?null:diagnostics.sourceResolveMs+diagnostics.startupMs;if (options.onStarted) options.onStarted(); };
    function record(detail,status=0,fatal=false){
      diagnostics.events.push({atMs:Math.round(performance.now()-openedAt),detail:String(detail).slice(0,70),status,fatal});
      if(diagnostics.events.length>12)diagnostics.events.shift();
    }
    let refreshing=false,refreshAttempted=!!options._sourceRefreshed;
    function refreshSource(){
      const refresh=options.refreshStream||stream.refreshStream;
      if(refreshAttempted||typeof refresh!=='function')return false;
      refreshAttempted=true;refreshing=true;clearTimeout(deadline);clearTimeout(recoveryTimer);recoveryTimer=null;diagnostics.sourceRefreshes=1;diagnostics.stage='refreshing-source';record('refresh-source-after-404',404);
      let settled=false;
      function completed(error,result){
        if(settled||serial!==run)return;settled=true;clearTimeout(sourceRefreshTimer);sourceRefreshTimer=null;refreshing=false;
        if(!error&&result&&/^https?:\/\//i.test(result.url||'')){
          open(video,result.url,Object.assign({},options,{mime:result.mime||options.mime,_sourceRefreshed:true}));return;
        }
        if(!retrySource())fail('HTTP 404: el canal no está disponible tras renovar su dirección. Prueba otra señal o actualiza la lista.');
      }
      sourceRefreshTimer=setTimeout(()=>completed(new Error('refresh-timeout')),8000);
      try{refresh(completed);}catch(error){completed(error);}return true;
    }
    function recoverNetwork(){
      if(recoveryTimer)return true;
      const count=networkBudget.take(performance.now());if(!count)return false;
      diagnostics.networkRecoveries++;diagnostics.stage='buffering';
      const generation=attempt;
      recoveryTimer=setTimeout(()=>{recoveryTimer=null;if(serial===run&&generation===attempt&&hls)hls.startLoad(-1);},count*1000);
      return true;
    }
    function recoverDecoder(){resuming=!video.paused;autoAttempts=0;playPending=false;diagnostics.recoveries++;hls.recoverMediaError();}
    healthTimer=setInterval(()=>{
      if(serial!==run||!video)return;
      if(hls)latencyPolicy.update(hls,video,options.live,performance.now()>=alignmentReadyAt);
      const sample=mediaHealth(video);if(frameMeter){frameMeter.sample();Object.assign(sample,frameMeter.read());}diagnostics.media=sample;if(options.onInfo)options.onInfo(diagnostics);
      if(Math.abs(sample.time-lastTime)>0.05||sample.paused&&!(bufferGate&&bufferGate.waiting&&!bufferGate.userPaused)||document.hidden||!started){lastProgressAt=performance.now();lastTime=sample.time;return;}
      if(bufferGate&&bufferGate.waiting&&sample.bufferSeconds>0){lastProgressAt=performance.now();return;}
      if(refreshing||!hls||!options.live||performance.now()-lastProgressAt<12000)return;
      lastProgressAt=performance.now();diagnostics.stallRecoveries++;record('no-progress-12s');
      if(sample.bufferSeconds<1)recoverNetwork();
      else if(decoderBudget.take(performance.now())){recoverDecoder();}
    },2000);
    playingListener = onPlaying;
    video.addEventListener('playing', onPlaying);
    // HLS.js owns recovery. Do not invoke the inherited webOS/FFmpeg retry path.
    video.onerror = () => { if (engine === 'html5') fail('Formato de vídeo o audio no compatible con este televisor.'); };
    function arm() {
      clearTimeout(deadline);
      deadline = setTimeout(() => { if (!started && serial === run) {if(bufferGate&&bufferGate.userPaused)return;if(isHls&&engine==='hls.js'&&retrySource())return;fail('La señal no inició: etapa '+diagnostics.stage+(diagnostics.httpStatus?' · HTTP '+diagnostics.httpStatus:'')+'. Abre Diagnóstico con el botón azul.');} }, candidates.length>1?8000:20000);
    }
    function resetHlsSession(preservePause=false){
      attempt++;
      if(frameMeter){frameMeter.destroy();frameMeter=null;}
      if(bufferGate){bufferGate.destroy();bufferGate=null;}diagnostics.bufferGate=null;
      clearTimeout(recoveryTimer);recoveryTimer=null;clearTimeout(deadline);
      if(hls){hls.destroy();hls=null;}
      try{video.pause();video.removeAttribute('src');video.load();}catch(_){}
      started=ready=false;paused=true;autoAttempts=0;playPending=false;gestureRequired=false;resuming=false;
      lastProgressAt=performance.now();lastTime=0;diagnostics.httpStatus=0;diagnostics.media=null;diagnostics.level=null;
      const generation=attempt;
      recoveryTimer=setTimeout(()=>{recoveryTimer=null;if(serial===run&&generation===attempt)useHls(preservePause);},preservePause?0:250);
    }
    function recoverSequence(){
      const preservePause=!!(bufferGate&&bufferGate.userPaused);
      if(!restartedRoutes.has(playbackSource)){
        restartedRoutes.add(playbackSource);diagnostics.sequenceRestarts++;diagnostics.sequenceRestartPending=true;
        sequenceRestartAt=performance.now();record('sequence-session-restart');diagnostics.stage='sequence-restart';
        resetHlsSession(preservePause);return;
      }
      diagnostics.sequenceFailovers++;record('sequence-repeated-next-cdn');
      if(!retrySource(preservePause))fail('La señal mantiene listas de segmentos inconsistentes tras probar las rutas disponibles.');
    }
    function retrySource(preservePause=!!(bufferGate&&bufferGate.userPaused)){
      if(routeIndex+1>=routes.length)return false;
      const next=routes[++routeIndex];playbackSource=next.url;headers=next.headers;
      diagnostics.httpsFallback=next.httpsFallback;diagnostics.cdnAttempt=next.cdnAttempt;
      diagnostics.transport=/^https:/i.test(playbackSource)?'https':'http';
      diagnostics.sequenceRestartPending=false;sequenceRestartAt=null;
      resetHlsSession(preservePause);return true;
    }
    function useHls(preservePause=false) {
      if (serial !== run) return;
      if (!Hls.isSupported()) return fail('Este televisor no dispone de MediaSource compatible para este canal con autorización.');
      const generation=attempt,playlistFacts=new Map();frameMeter=createFrameMeter(video);
      if(options.live)bufferGate=createLiveBuffer(video,{onState:state=>{diagnostics.bufferGate=state;if(started&&state.waiting&&!state.userPaused)diagnostics.stage='buffering';},onRejected:error=>{if(serial===run&&generation===attempt&&error.name==='NotAllowedError'){gestureRequired=true;diagnostics.autoplayBlocked=true;options.onError('Pulsa OK para iniciar el vídeo.');}}});
      if(preservePause)video.pause();
      engine = diagnostics.engine = 'hls.js';
      diagnostics.stage='manifest';diagnostics.worker=typeof Worker!=='undefined';
      const Loader=Hls.DefaultConfig.loader;
      const useHttps=diagnostics.httpsFallback;
      class SourceLoader extends Loader{
        getResponseHeader(name){if(this.nativeActive){const line=(this.nativeHeaders||'').split(/[\r\n]+/).find(value=>value.toLowerCase().startsWith(name.toLowerCase()+':'));return line?line.slice(line.indexOf(':')+1).trim():null;}return super.getResponseHeader(name);}
        abort(){clearTimeout(this.freshnessTimer);if(this.cancelNative){this.cancelNative();this.stats.aborted=true;}super.abort();}
        destroy(){clearTimeout(this.freshnessTimer);if(this.cancelNative)this.cancelNative();super.destroy();}
        load(context,config,callbacks){
          if(useHttps){try{const target=new URL(context.url);if(target.protocol==='http:'&&target.hostname===new URL(playbackSource).hostname)target.protocol='https:';context.url=target.href;}catch(_) {}}
          const original=callbacks;callbacks=Object.assign({},original,{onSuccess:(response,stats,request,network)=>{
            if(serial!==run||generation!==attempt)return;
            if(typeof response.data==='string'){
              const shape=playlistShape(response.data),previous=playlistFacts.get(context.url);
              const unchanged=previous&&Number.isFinite(shape.facts.mediaSequence)&&shape.facts.mediaSequence===previous.mediaSequence;
              if(options.live&&diagnostics.liveLatency.experimental&&context.type==='level'&&unchanged&&(this.freshnessRetries||0)<2){
                this.freshnessRetries=(this.freshnessRetries||0)+1;diagnostics.freshPlaylistRetries++;
                this.freshnessTimer=setTimeout(()=>{this.freshnessTimer=null;if(serial===run&&generation===attempt)this.load(context,config,original);},250);return;
              }
              const facts=Object.assign({requestId:++diagnostics.playlistRequests,atMs:Math.round(performance.now()-openedAt),cdnAttempt:diagnostics.cdnAttempt,httpsFallback:diagnostics.httpsFallback,requestType:context.type||'playlist',httpStatus:response.code||network&&network.status||null},shape.facts);response.data=shape.data;
              if(shape.facts.removedIdenticalTargetTags){diagnostics.playlistRepairs=(diagnostics.playlistRepairs||0)+shape.facts.removedIdenticalTargetTags;record('removed-identical-target-duration');}
              if(shape.facts.repairedHostSpaces){diagnostics.uriRepairs+=shape.facts.repairedHostSpaces;record('repaired-playlist-host-space');}
              let responseHost=[];try{responseHost=[new URL(response.url||context.url).hostname];}catch(_){}
              diagnostics.playlistHosts=Array.from(new Set(diagnostics.playlistHosts.concat(responseHost,shape.facts.uriHosts))).slice(0,32);
              diagnostics.playlistHistory.push(facts);if(diagnostics.playlistHistory.length>8)diagnostics.playlistHistory.shift();
              playlistFacts.set(context.url,facts);if(playlistFacts.size>8)playlistFacts.delete(playlistFacts.keys().next().value);
            }
            original.onSuccess(response,stats,request,network);
          }});
          const transport=window.XuperNativeTransport;
          if(transport&&transport.snapshot().available)return nativeHlsLoad(this,transport,context,config,callbacks,headers,()=>super.load(context,config,callbacks),()=>{diagnostics.networkRetries++;});
          return super.load(context,config,callbacks);
        }
      }
      hls = new Hls({loader:SourceLoader, enableWorker: diagnostics.worker, workerPath:new URL('vendor/hls-worker.js',document.baseURI).href, lowLatencyMode: false, backBufferLength: 10,
        maxBufferLength: 30, maxMaxBufferLength: 45, maxBufferSize: 24 * 1000 * 1000,
        liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 10, maxLiveSyncPlaybackRate:1, capLevelToPlayerSize: true,
        capLevelOnFPSDrop:true,fpsDroppedMonitoringPeriod:5000,fpsDroppedMonitoringThreshold:0.15,
        manifestLoadPolicy:liveLoadPolicy(),playlistLoadPolicy:liveLoadPolicy(),fragLoadPolicy:liveLoadPolicy(true),keyLoadPolicy:liveLoadPolicy(),
        startLevel: -1,
        xhrSetup(xhr) {
          Object.keys(headers).forEach(key => {
            if (!/^(user-agent|host|content-length|cookie|origin|referer|connection|accept-encoding)$/i.test(key)) xhr.setRequestHeader(key, headers[key]);
          });
        }
      });
      hls.on(Hls.Events.BUFFER_APPENDED,()=>{if(serial===run&&generation===attempt&&hls){latencyPolicy.update(hls,video,options.live,performance.now()>=alignmentReadyAt);if(bufferGate)bufferGate.check();}});
      hls.on(Hls.Events.MEDIA_ATTACHED, () => { if (hls && serial === run&&generation===attempt) hls.loadSource(playbackSource); });
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        if(serial!==run||generation!==attempt||!hls||!options.preferredAudio)return;
        const languages={es:['es','spa','esp'],pt:['pt','por'],en:['en','eng']}[options.preferredAudio]||[];
        const index=(data.audioTracks||[]).findIndex(track=>languages.includes(String(track.lang||'').toLowerCase().split('-')[0]));
        if(index>=0)hls.audioTrack=index;
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (serial !== run||generation!==attempt) return;
        diagnostics.stage='segments';diagnostics.httpStatus=200;tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if(serial!==run||generation!==attempt)return;
        if(/(?:level|manifest).*(?:Parsing|Empty)Error/i.test(data.details||'')){const text=data.response&&data.response.data;const reason=String(data.reason||data.error&&data.error.message||'');diagnostics.playlistError=Object.assign({kind:playlistReason(reason),message:safeParserMessage(reason)},playlistFacts.get(data.context&&data.context.url||data.url)||{characters:null,hasHeader:null,segments:null});}
        if(started&&data.details==='bufferStalledError'){latencyPolicy.stall();latencyPolicy.update(hls,video,options.live,performance.now()>=alignmentReadyAt);}
        diagnostics.detail=String(data.details||'').slice(0,70);record(data.details,data.response&&data.response.code||0,!!data.fatal);
        if(data.event==='demuxerWorker')diagnostics.worker=false;
        diagnostics.httpStatus=data.response&&data.response.code||diagnostics.httpStatus;
        const sequenceKind=playlistReason(data.reason||data.error&&data.error.message||'');
        if(data.fatal&&options.live&&!refreshing&&(sequenceKind==='media-sequence-mismatch'||sequenceKind==='discontinuity-sequence-mismatch')){recoverSequence();return;}
        if (!data.fatal || serial !== run||refreshing) return;
        if(data.type===Hls.ErrorTypes.NETWORK_ERROR){
          const code=data.response&&data.response.code||0;
          if(options.live&&/level(?:Parsing|Empty)Error/.test(data.details||'')&&recoverNetwork())return;
          if(code===404&&refreshSource())return;
          if(started&&options.live&&![401,403,416].includes(code)&&recoverNetwork())return;
          if(retrySource())return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && decoderBudget.take(performance.now())) {
          recoverDecoder();
        } else {
          const status = data.response && data.response.code;
          fail((status===404?'Señal no disponible en el servidor':'No se pudo reproducir HLS') + (status ? ' (HTTP ' + status + ')' : '') + '. Puede faltar autorización, CORS o soporte de audio/vídeo.');
        }
      });
      hls.on(Hls.Events.LEVEL_SWITCHED,(_event,data)=>{
        const level=hls.levels[data.level];if(level)diagnostics.level={index:data.level,width:level.width,height:level.height,bitrate:level.bitrate,fps:level.frameRate||0};
      });
      hls.on(Hls.Events.BUFFER_CODECS,(_event,data)=>{
        for(const key of ['audio','video','audiovideo'])if(data[key])diagnostics.codecs[key]={codec:data[key].codec,container:data[key].container};
      });
      hls.on(Hls.Events.FPS_DROP_LEVEL_CAPPING,()=>record('quality-lowered-for-dropped-frames'));
      hls.on(Hls.Events.FRAG_LOADING,()=>{if(serial===run&&generation===attempt&&!started)diagnostics.stage='segments';});
      hls.on(Hls.Events.FRAG_LOADED,()=>{if(serial===run&&generation===attempt&&!started)diagnostics.stage='decoder';});
      if(canPlayListener)video.removeEventListener('canplay',canPlayListener);
      canPlayListener=()=>{if(serial===run&&generation===attempt)tryPlay();};video.addEventListener('canplay',canPlayListener);
      hls.attachMedia(video); arm();
    }
    function native() {
      engine = diagnostics.engine = 'html5';
      video.src = source; video.load();
      const p = video.play(); if (p && p.catch) p.catch(() => options.onError('Pulsa OK para iniciar el vídeo.'));
      video.onerror = () => fail('Formato de vídeo o audio no compatible con este televisor.');
      arm();
    }
    function avplay() {
      engine = diagnostics.engine = 'avplay';diagnostics.stage='native-prepare';
      av = webapis.avplay;
      avObject = document.createElement('object'); avObject.type = 'application/avplayer';
      avObject.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;z-index:0';
      video.parentElement.insertBefore(avObject, video);
      video.style.visibility = 'hidden';
      const originals = {};
      for (const key of ['currentTime', 'duration', 'paused', 'readyState', 'src']) originals[key] = Object.getOwnPropertyDescriptor(video, key);
      const originalPlay = video.play, originalPause = video.pause;
      restored = () => {
        Object.keys(originals).forEach(key => { delete video[key]; if (originals[key]) Object.defineProperty(video, key, originals[key]); });
        video.play = originalPlay; video.pause = originalPause; video.style.visibility = '';
      };
      Object.defineProperties(video, {
        currentTime: { configurable: true, get: () => currentTime, set: value => { if (av && ready) av.seekTo(Math.max(0, value * 1000)); } },
        duration: { configurable: true, get: () => { try { return av ? av.getDuration() / 1000 : 0; } catch (_) { return 0; } } },
        paused: { configurable: true, get: () => paused },
        readyState: { configurable: true, get: () => ready ? 4 : 0 },
        src: { configurable: true, get: () => url, set: () => {} }
      });
      video.play = () => { if (av && ready) { av.play(); paused = false; emit('play'); } return Promise.resolve(); };
      video.pause = () => { if (av && ready) { av.pause(); paused = true; emit('pause'); } };
      function fallback() {
        if (serial !== run || engine !== 'avplay') return;
        clearTimeout(nativeTimer);started=ready=false;paused=true;
        try { av.stop(); av.close(); } catch (_) {} av = null;
        avObject.remove(); avObject = null; restored(); restored = null; clearTimeout(deadline);
        if (Object.keys(headers).some(key => /^cookie$/i.test(key))) return fail('AVPlay no pudo abrir esta señal con su cookie de autorización.');
        if (isHls && Hls.isSupported()) useHls(); else native();
      }
      try {
        av.open(source);
        Object.keys(headers).forEach(key => {
          if (/^user-agent$/i.test(key)) av.setStreamingProperty('USER_AGENT', headers[key]);
          if (/^cookie$/i.test(key)) av.setStreamingProperty('COOKIE', headers[key]);
        });
        if (typeof av.setBufferingParam === 'function') {
          try {
            av.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 3);
            av.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 6);
          } catch (_) {} // Older firmwares retain their documented defaults.
        }
        const rect = video.getBoundingClientRect();
        av.setDisplayRect(...toAvDisplayRect(rect,window.innerWidth||1920,window.innerHeight||1080));
        av.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
        av.setListener({ onbufferingstart: () => emit('waiting'), onbufferingcomplete: () => emit('canplay'),
          oncurrentplaytime: ms => { currentTime = ms / 1000; emit('timeupdate'); },
          onstreamcompleted: () => { paused = true; emit('ended'); }, onerror: fallback });
        av.prepareAsync(() => {
          if (serial !== run || !av) return;
          clearTimeout(nativeTimer);ready = true; emit('loadedmetadata'); emit('loadeddata'); av.play(); paused = false; emit('play'); emit('playing');
        }, fallback);
        nativeTimer=setTimeout(function(){diagnostics.detail='avplay-prepare-timeout';fallback();},8000);arm();
      } catch (_) { fallback(); }
    }
    function useProgressive(index=0){
      if(!window.MediaSource)return fail('Este TV no ofrece MediaSource para vídeo autorizado MP4/TS.');
      if(serial!==run)return;if(progressive){progressive.destroy();progressive=null;}
      const generation=++attempt;playPending=false;autoAttempts=0;gestureRequired=false;started=ready=false;const candidate=candidates[index];const ts=/mp2t|\.ts(?:[?#]|$)/i.test((stream.mime||options.mime||'')+' '+source);
      diagnostics.seekMode=ts?'buffered':'indexed';engine=diagnostics.engine=ts?'mpegts.js':'mp4box';diagnostics.stage='loading-file';diagnostics.unsupportedRoute='';diagnostics.container=ts?'MPEG-TS':'MP4';diagnostics.cdnAttempt=index+1;
      canPlayListener=()=>{if(serial===run&&generation===attempt)tryPlay();};video.addEventListener('canplay',canPlayListener);
      const settings={onNotice:message=>{if(serial===run&&generation===attempt){record('ts-unindexed-seek');if(options.onNotice)options.onNotice(message);}},duration:stream.duration||0,preferredAudio:options.preferredAudio,onRead:info=>{if(serial===run&&generation===attempt){if(info.retry)diagnostics.vodRetries++;diagnostics.httpStatus=info.status;diagnostics.vodBytes=(diagnostics.vodBytes||0)+info.bytes;if(Number.isFinite(info.total))diagnostics.vodTotalBytes=info.total;}},onReady:info=>{if(serial===run&&generation===attempt){diagnostics.stage='buffering';const v=info.videoTracks&&info.videoTracks[0],a=info.audioTracks&&info.audioTracks[0];diagnostics.codecs={video:{codec:v&&v.codec||info.videoCodec||'',container:'video/mp4'},audio:{codec:a&&a.codec||info.audioCodec||'',container:'audio/mp4'}};}} ,onError:message=>{if(serial!==run||generation!==attempt)return;if(!started&&index+1<candidates.length){if(canPlayListener)video.removeEventListener('canplay',canPlayListener);canPlayListener=null;useProgressive(index+1);}else fail(message);}};
      ensureVodRuntime().then(runtime=>{if(serial!==run||generation!==attempt)return;try{progressive=(ts?runtime.openTs:runtime.openMp4)(video,candidate.url,candidate.headers,settings);}catch(error){settings.onError(error.message);}},error=>settings.onError(error.message));
    }
    function begin(){
      if(serial!==run)return;
    // AVPlay only receives headers its documented API can actually represent.
    if (custom.length) {
      if (isHls) useHls();
      else useProgressive();
    } else if (isHls&&window.XuperNativeTransport&&window.XuperNativeTransport.snapshot().available) useHls();
    else if (window.webapis && webapis.avplay) avplay();
    else if (isHls && Hls.isSupported()) useHls();
    else native();
    }
    const transport=window.XuperNativeTransport;
    if(transport&&!transport.snapshot().available)transport.ensure().then(begin,begin);else begin();
  }

  function selectAudio(index) {
    if (hls) { if (index < 0 || index >= hls.audioTracks.length) return false; hls.audioTrack = index; return true; }
    if (av && ready) {
      try { const tracks = av.getTotalTrackInfo().filter(track => track.type === 'AUDIO'); if (!tracks[index]) return false; av.setSelectTrack('AUDIO', tracks[index].index); return true; } catch (_) { return false; }
    }
    return false;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && video) { try { video.pause(); } catch (_) {} } });
  return { open, stop, playFromGesture:()=>{if(resumePlayback)resumePlayback();}, selectAudio, capabilities, diagnostics };
}
