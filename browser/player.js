import {playbackRejection,liveLoadPolicy} from './playback-policy.js';
import {nativeHlsLoad} from './native-hls-loader.js';
import Hls from 'hls.js';
import {streamCandidates} from './stream-candidates.js';
import {httpsAlternative} from './stream-probe.js';
export function toAvDisplayRect(rect,width=1920,height=1080){
  const x=Math.max(0,Math.min(1919,Math.round(rect.left*1920/width)));
  const y=Math.max(0,Math.min(1079,Math.round(rect.top*1080/height)));
  return [x,y,Math.max(1,Math.min(1920-x,Math.round(rect.width*1920/width))),Math.max(1,Math.min(1080-y,Math.round(rect.height*1080/height)))];
}

export function createPlayer(getStream) {
  let video = null, hls = null, av = null, avObject = null, engine = '', url = '', serial = 0;
  let paused = true, currentTime = 0, ready = false, started = false, deadline = null, cleanupTimer = null, nativeTimer = null, totalDeadline=null;
  let restored = null, playingListener = null, canPlayListener=null,resumePlayback=null;
  const diagnostics = { engine: '', stage:'idle',error: '', recoveries: 0, hlsVersion: Hls.version, httpStatus:0, detail:'',worker:false };
  function emit(name) { if (video) video.dispatchEvent(new Event(name)); }
  function stop() {
    resumePlayback=null;++serial;clearTimeout(totalDeadline);clearTimeout(nativeTimer);clearTimeout(deadline); clearInterval(cleanupTimer); deadline = cleanupTimer = null;
    if (video && playingListener) video.removeEventListener('playing', playingListener);
    if(video&&canPlayListener)video.removeEventListener('canplay',canPlayListener);
    canPlayListener=null;playingListener = null;
    if (hls) { hls.destroy(); hls = null; }
    if (av) { try { av.stop(); av.close(); } catch (_) {} av = null; }
    if (avObject) { avObject.remove(); avObject = null; }
    if (restored) { restored(); restored = null; }
    if (video) { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (_) {} }
    engine = ''; diagnostics.engine = '';diagnostics.stage='idle'; paused = true; ready = started = false;
  }
  function capabilities() {
    const v = document.createElement('video');
    const codecs = { h264: 'video/mp4; codecs="avc1.42E01E"', hevc: 'video/mp4; codecs="hvc1.1.6.L93.B0"',
      aac: 'audio/mp4; codecs="mp4a.40.2"', ac3: 'audio/mp4; codecs="ac-3"', eac3: 'audio/mp4; codecs="ec-3"', dts: 'audio/mp4; codecs="dtsc"' };
    const result = {};
    Object.keys(codecs).forEach(key => { result[key] = { native: v.canPlayType(codecs[key]) || '', mse: !!(window.MediaSource && MediaSource.isTypeSupported(codecs[key])) }; });
    return { avplay: !!(window.webapis && webapis.avplay), hlsjs: Hls.isSupported(), codecs: result };
  }
  function open(element, source, options) {
    stop(); video = element; url = source;
    const run = serial;let playbackSource=source,httpsTried=false;
    const stream = getStream(source) || {};
    const candidates=streamCandidates(source,stream);let candidateIndex=0,attempt=0;
    let headers = candidates[0].headers;
    const isHls = /\.m3u8(?:[?#]|$)/i.test(source) || /mpegurl/i.test(stream.mime || options.mime || '');
    const custom = Object.keys(headers).filter(key => !/^(user-agent|cookie)$/i.test(key));
    diagnostics.error = ''; diagnostics.recoveries = 0;diagnostics.httpStatus=0;diagnostics.detail='';diagnostics.stage='opening';diagnostics.cdnAttempt=1;diagnostics.worker=false;diagnostics.networkRetries=0;diagnostics.networkRecoveries=0;diagnostics.autoplayBlocked=false;diagnostics.playRejection='';diagnostics.startupMs=0;
    diagnostics.transport=/^https:/i.test(source)?'https':'http';diagnostics.httpsFallback=false;
    const fail = message => {
      if (serial !== run) return;
      const failedStage=diagnostics.stage;diagnostics.error = message; stop();diagnostics.stage=failedStage; options.onError(message);
    };
    totalDeadline=setTimeout(()=>fail('La señal no inició tras probar las rutas disponibles: etapa '+diagnostics.stage+'. Abre Diagnóstico.'),30000);
    const openedAt=performance.now();let playPending=false,autoAttempts=0,gestureRequired=false,networkRecoveries=0;
    function tryPlay(){
      if(serial!==run||started||playPending||gestureRequired||!video.paused||autoAttempts>=3)return;
      autoAttempts++;playPending=true;
      let result;try{result=video.play();}catch(error){result=Promise.reject(error);}
      Promise.resolve(result).then(()=>{playPending=false;},error=>{
        playPending=false;if(serial!==run)return;const rejection=playbackRejection(error);diagnostics.playRejection=rejection;
        if(rejection==='gesture'){gestureRequired=true;diagnostics.autoplayBlocked=true;options.onError('Pulsa OK para iniciar el vídeo.');}
        else if(rejection==='interrupted'&&video.readyState>=2&&autoAttempts<3)setTimeout(tryPlay,0);
      });
    }
    resumePlayback=()=>{gestureRequired=false;autoAttempts=0;diagnostics.autoplayBlocked=false;tryPlay();};
    const onPlaying = () => { if (serial !== run) return; started = ready = true;gestureRequired=false; paused = false;diagnostics.stage='playing';diagnostics.error='';diagnostics.autoplayBlocked=false;if(!diagnostics.startupMs)diagnostics.startupMs=Math.round(performance.now()-openedAt);clearTimeout(totalDeadline);clearTimeout(deadline); if (options.onStarted) options.onStarted(); };
    playingListener = onPlaying;
    video.addEventListener('playing', onPlaying);
    // HLS.js owns recovery. Do not invoke the inherited webOS/FFmpeg retry path.
    video.onerror = () => { if (engine === 'html5') fail('Formato de vídeo o audio no compatible con este televisor.'); };
    function arm() {
      clearTimeout(deadline);
      deadline = setTimeout(() => { if (!started && serial === run) {if(isHls&&engine==='hls.js'&&retrySource())return;fail('La señal no inició: etapa '+diagnostics.stage+(diagnostics.httpStatus?' · HTTP '+diagnostics.httpStatus:'')+'. Abre Diagnóstico con el botón azul.');} }, candidates.length>1?8000:20000);
    }
    function retrySource(){
      const alternative=!httpsTried&&httpsAlternative(playbackSource);
      if(alternative){httpsTried=true;playbackSource=alternative;diagnostics.httpsFallback=true;}
      else {
        if(candidateIndex+1>=candidates.length)return false;
        candidateIndex++;playbackSource=candidates[candidateIndex].url;headers=candidates[candidateIndex].headers;
        httpsTried=false;diagnostics.httpsFallback=false;diagnostics.cdnAttempt=candidateIndex+1;
      }
      attempt++;diagnostics.transport=/^https:/i.test(playbackSource)?'https':'http';
      if(hls){hls.destroy();hls=null;}
      clearTimeout(deadline);started=ready=false;autoAttempts=0;playPending=false;gestureRequired=false;diagnostics.httpStatus=0;useHls();return true;
    }
    function useHls() {
      if (serial !== run) return;
      if (!Hls.isSupported()) return fail('Este televisor no dispone de MediaSource compatible para este canal con autorización.');
      const generation=attempt;
      engine = diagnostics.engine = 'hls.js';
      diagnostics.stage='manifest';diagnostics.worker=!/Tizen|SMART-TV|SmartTV/i.test(navigator.userAgent);
      const Loader=Hls.DefaultConfig.loader;
      const useHttps=diagnostics.httpsFallback;
      class SourceLoader extends Loader{
        getResponseHeader(name){if(this.nativeActive){const line=(this.nativeHeaders||'').split(/[\r\n]+/).find(value=>value.toLowerCase().startsWith(name.toLowerCase()+':'));return line?line.slice(line.indexOf(':')+1).trim():null;}return super.getResponseHeader(name);}
        abort(){if(this.cancelNative){this.cancelNative();this.stats.aborted=true;}super.abort();}
        destroy(){if(this.cancelNative)this.cancelNative();super.destroy();}
        load(context,config,callbacks){
          if(useHttps){try{const target=new URL(context.url);if(target.protocol==='http:'&&target.hostname===new URL(playbackSource).hostname)target.protocol='https:';context.url=target.href;}catch(_) {}}
          const transport=window.XuperNativeTransport;
          if(transport&&transport.snapshot().available)return nativeHlsLoad(this,transport,context,config,callbacks,headers,()=>super.load(context,config,callbacks),()=>{diagnostics.networkRetries++;});
          return super.load(context,config,callbacks);
        }
      }
      hls = new Hls({loader:SourceLoader, enableWorker: diagnostics.worker, lowLatencyMode: false, backBufferLength: 10,
        maxBufferLength: 30, maxMaxBufferLength: 45, maxBufferSize: 24 * 1000 * 1000,
        liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 7, capLevelToPlayerSize: true,
        manifestLoadPolicy:liveLoadPolicy(),playlistLoadPolicy:liveLoadPolicy(),fragLoadPolicy:liveLoadPolicy(true),keyLoadPolicy:liveLoadPolicy(),
        startLevel: -1,
        xhrSetup(xhr) {
          Object.keys(headers).forEach(key => {
            if (!/^(user-agent|host|content-length|cookie|origin|referer|connection|accept-encoding)$/i.test(key)) xhr.setRequestHeader(key, headers[key]);
          });
        }
      });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => { if (hls && serial === run&&generation===attempt) hls.loadSource(playbackSource); });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (serial !== run||generation!==attempt) return;
        diagnostics.stage='segments';diagnostics.httpStatus=200;tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if(serial!==run||generation!==attempt)return;
        diagnostics.detail=String(data.details||'').slice(0,70);
        diagnostics.httpStatus=data.response&&data.response.code||diagnostics.httpStatus;
        if (!data.fatal || serial !== run) return;
        if(data.type===Hls.ErrorTypes.NETWORK_ERROR){
          const code=data.response&&data.response.code||0;
          if(started&&options.live&&networkRecoveries<2&&![401,403,416].includes(code)){
            networkRecoveries++;diagnostics.networkRecoveries=networkRecoveries;diagnostics.stage='buffering';hls.startLoad(-1);return;
          }
          if(retrySource())return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && diagnostics.recoveries < 1) {
          diagnostics.recoveries++; hls.recoverMediaError();
        } else {
          const status = data.response && data.response.code;
          fail('No se pudo reproducir HLS' + (status ? ' (HTTP ' + status + ')' : '') + '. Puede faltar autorización, CORS o soporte de audio/vídeo.');
        }
      });
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
            av.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
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
    function begin(){
      if(serial!==run)return;
    // AVPlay only receives headers its documented API can actually represent.
    if (custom.length) {
      if (isHls) useHls();
      else fail('Este vídeo requiere cabeceras de autorización que el reproductor nativo no admite. La primera versión soporta esas cabeceras en HLS.');
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
