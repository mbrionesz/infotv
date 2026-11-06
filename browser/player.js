import Hls from 'hls.js';

export function createPlayer(getStream) {
  let video = null, hls = null, av = null, avObject = null, engine = '', url = '', serial = 0;
  let paused = true, currentTime = 0, ready = false, started = false, deadline = null, cleanupTimer = null;
  let restored = null, playingListener = null;
  const diagnostics = { engine: '', error: '', recoveries: 0, hlsVersion: Hls.version };
  function emit(name) { if (video) video.dispatchEvent(new Event(name)); }
  function stop() {
    ++serial; clearTimeout(deadline); clearInterval(cleanupTimer); deadline = cleanupTimer = null;
    if (video && playingListener) video.removeEventListener('playing', playingListener);
    playingListener = null;
    if (hls) { hls.destroy(); hls = null; }
    if (av) { try { av.stop(); av.close(); } catch (_) {} av = null; }
    if (avObject) { avObject.remove(); avObject = null; }
    if (restored) { restored(); restored = null; }
    if (video) { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (_) {} }
    engine = ''; diagnostics.engine = ''; paused = true; ready = started = false;
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
    const run = serial;
    const stream = getStream(source) || {};
    const headers = stream.headers || {};
    const isHls = /\.m3u8(?:[?#]|$)/i.test(source) || /mpegurl/i.test(stream.mime || options.mime || '');
    const custom = Object.keys(headers).filter(key => !/^(user-agent|cookie)$/i.test(key));
    diagnostics.error = ''; diagnostics.recoveries = 0;
    const fail = message => {
      if (serial !== run) return;
      diagnostics.error = message; stop(); options.onError(message);
    };
    const onPlaying = () => { if (serial !== run) return; started = ready = true; paused = false; clearTimeout(deadline); if (options.onStarted) options.onStarted(); };
    playingListener = onPlaying;
    video.addEventListener('playing', onPlaying, { once: true });
    // HLS.js owns recovery. Do not invoke the inherited webOS/FFmpeg retry path.
    video.onerror = () => { if (engine !== 'hls.js') fail('Formato de vídeo o audio no compatible con este televisor.'); };
    function arm() {
      deadline = setTimeout(() => { if (!started && serial === run) fail('La señal no inició en 20 segundos. Revisa conexión, autorización y compatibilidad del canal.'); }, 20000);
    }
    function useHls() {
      if (serial !== run) return;
      if (!Hls.isSupported()) return fail('Este televisor no dispone de MediaSource compatible para este canal con autorización.');
      engine = diagnostics.engine = 'hls.js';
      hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 15,
        maxBufferLength: 20, maxMaxBufferLength: 40, maxBufferSize: 24 * 1000 * 1000,
        liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 7, capLevelToPlayerSize: true,
        startLevel: -1, fragLoadingMaxRetry: 2, manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2,
        xhrSetup(xhr) {
          Object.keys(headers).forEach(key => {
            if (!/^(user-agent|host|content-length|cookie|origin|referer|connection|accept-encoding)$/i.test(key)) xhr.setRequestHeader(key, headers[key]);
          });
        }
      });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => { if (hls && serial === run) hls.loadSource(source); });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (serial !== run) return;
        const promise = video.play();
        if (promise && promise.catch) promise.catch(() => { if (serial === run) options.onError('Pulsa OK para iniciar el vídeo.'); });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || serial !== run) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && diagnostics.recoveries < 1) {
          diagnostics.recoveries++; hls.recoverMediaError();
        } else {
          const status = data.response && data.response.code;
          fail('No se pudo reproducir HLS' + (status ? ' (HTTP ' + status + ')' : '') + '. Puede faltar autorización, CORS o soporte de audio/vídeo.');
        }
      });
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
      engine = diagnostics.engine = 'avplay';
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
        av.setDisplayRect(Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height));
        av.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
        av.setListener({ onbufferingstart: () => emit('waiting'), onbufferingcomplete: () => emit('canplay'),
          oncurrentplaytime: ms => { currentTime = ms / 1000; emit('timeupdate'); },
          onstreamcompleted: () => { paused = true; emit('ended'); }, onerror: fallback });
        av.prepareAsync(() => {
          if (serial !== run || !av) return;
          ready = true; emit('loadedmetadata'); emit('loadeddata'); av.play(); paused = false; emit('play'); emit('playing');
        }, fallback);
        arm();
      } catch (_) { fallback(); }
    }
    // AVPlay only receives headers its documented API can actually represent.
    if (custom.length) {
      if (isHls) useHls();
      else fail('Este vídeo requiere cabeceras de autorización que el reproductor nativo no admite. La primera versión soporta esas cabeceras en HLS.');
    } else if (window.webapis && webapis.avplay) avplay();
    else if (isHls && Hls.isSupported()) useHls();
    else native();
  }
  function selectAudio(index) {
    if (hls) { if (index < 0 || index >= hls.audioTracks.length) return false; hls.audioTrack = index; return true; }
    if (av && ready) {
      try { const tracks = av.getTotalTrackInfo().filter(track => track.type === 'AUDIO'); if (!tracks[index]) return false; av.setSelectTrack('AUDIO', tracks[index].index); return true; } catch (_) { return false; }
    }
    return false;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && video) { try { video.pause(); } catch (_) {} } });
  return { open, stop, selectAudio, capabilities, diagnostics };
}
