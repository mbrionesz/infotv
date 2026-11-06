import core from '../companion/lib/magis.js';
import { createPlayer } from './player.js';
const streams = new Map();
let lastError = '';
function remember(stream) {
  if (!stream || !/^https?:\/\//i.test(stream.url || '')) throw new Error('El proveedor no devolvió una URL HTTP(S) válida');
  streams.delete(stream.url); streams.set(stream.url, stream);
  if (streams.size > 8) streams.delete(streams.keys().next().value);
  return Object.assign({}, stream, { proxyPath: stream.url, isHls: /mpegurl/i.test(stream.mime || '') || /\.m3u8(?:[?#]|$)/i.test(stream.url) });
}
window.XuperPlayer = createPlayer(url => streams.get(url));
function request(method, payload, callback) {
  payload = payload || {};
  let finished = false;
  const timer = setTimeout(() => done(new Error('Tiempo agotado. Comprueba la conexión del TV y el acceso al proveedor.')), method === 'netdiag' ? 30000 : 24000);
  function done(error, result) {
    if (finished) return; finished = true; clearTimeout(timer);
    if (error) lastError = String(error.message || error);
    callback(error ? lastError : null, error ? null : Object.assign({ returnValue: true }, result || {}));
  }
  try {
    if (method === 'ping') return done(null, { service: 'xuper-tizen-standalone', version: '0.2.0', standalone: true, relayAvailable: false, capabilities: window.XuperPlayer.capabilities() });
    if (method === 'checkUpdate') return done(null, { updateAvailable: false, currentVersion: '0.2.0' });
    if (method === 'prewarm' || method === 'heartbeat' || method === 'keepAlive') return done(null, { standalone: true });
    if (method === 'abortMedia') { window.XuperPlayer.stop(); return done(null, {}); }
    if (method === 'resolveSmooth') return done(new Error('El relay FFmpeg de LG no está disponible en un widget Tizen. Usa reproducción automática.'));
    if (method === 'home') return core.home(payload.root || 'movies', payload.pageNum, done);
    if (method === 'search') return core.search(payload.value || '', done);
    if (method === 'detail') return core.detail(payload.contentId, done);
    if (method === 'mediaInfo') return core.mediaInfo(payload.contentId, payload.seriesContentId, done);
    if (method === 'liveCategories') return core.getLiveCategories((error, categories) => done(error, { categories: categories || [] }));
    if (method === 'liveChannels') return core.getLiveChannels(payload.columnId, payload.pageNum, payload.pageSize, (error, channels, hasMore) => done(error, { channels: channels || [], hasMore: !!hasMore, pageNum: Number(payload.pageNum) || 1 }));
    if (method === 'fetchM3u') return core.fetchM3u(payload.url, (error, channels) => done(error, { channels: channels || [] }));
    if (method === 'resolve') return core.resolve(payload.contentId, payload.seriesContentId, { trackIndex: payload.trackIndex }, (error, stream) => {
      if (error) return done(error); try { done(null, remember(stream)); } catch (failure) { done(failure); }
    });
    if (method === 'resolveLive') {
      if (payload.streamUrl) return done(null, remember({ url: payload.streamUrl, mime: 'application/vnd.apple.mpegurl', headers: {} }));
      return core.resolveLive(payload.channelCode, (error, stream) => {
        if (error) return done(error); try { done(null, remember(stream)); } catch (failure) { done(failure); }
      });
    }
    if (method === 'netdiag') {
      const caps = window.XuperPlayer.capabilities();
      return done(null, { version: '0.2.0', verdict: lastError ? 'pendiente' : 'local',
        serviceError: lastError, hosts: [], providers: [],
        layers: { session: {ready:!!core.session.ready,userId:core.session.ready?'✓':'?',token:core.session.ready?'✓':'?'} },
        standalone:true, codec:{h264:caps.codecs.h264.native,hevc:caps.codecs.hevc.native,hls:caps.hlsjs?'HLS.js 1.6.15':'MSE no disponible'}, capabilities:caps,
        note:'El soporte declarado no confirma reproducción ni acceso al proveedor.' });
    }
    done(new Error('Esta función de LG no está disponible en la versión Tizen.'));
  } catch (error) { done(error); }
  return true;
}
window.XuperStandalone = { request, core, version: '0.2.0', diagnostics: () => ({ lastError, player: window.XuperPlayer.diagnostics, capabilities: window.XuperPlayer.capabilities() }) };
