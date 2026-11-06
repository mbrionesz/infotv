import {playlistMime} from './addons.js';
import {createNativeTransport} from './dnsx.js';
const nativeTransport=createNativeTransport();
window.XuperNativeTransport=nativeTransport;
import {createRemoteMetrics} from './remote-metrics.js';
const remoteMetrics=createRemoteMetrics();
import { createCoreClient } from './core-client.js';
const core = createCoreClient();
import { createPlayer } from './player.js';
import {createGuide} from './guide.js';
import {createCatalog} from './catalog.js';
const streams = new Map();
let lastError = '';
function remember(stream) {
  if (!stream || !/^https?:\/\//i.test(stream.url || '')) throw new Error('El proveedor no devolvió una URL HTTP(S) válida');
  streams.delete(stream.url); streams.set(stream.url, stream);
  if (streams.size > 8) streams.delete(streams.keys().next().value);
  return Object.assign({}, stream, { proxyPath: stream.url, isHls: /mpegurl/i.test(stream.mime || '') || /\.m3u8(?:[?#]|$)/i.test(stream.url) });
}
window.XuperPlayer = createPlayer(url => streams.get(url));
window.XuperGuide=createGuide(core);
window.XuperCatalog=createCatalog(core);
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
    if (method === 'ping') return done(null, { service: 'xuper-tizen-standalone', version: '0.5.4', standalone: true, relayAvailable: false, capabilities: window.XuperPlayer.capabilities() });
    if (method === 'checkUpdate') return done(null, { updateAvailable: false, currentVersion: '0.5.4' });
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
      if (payload.streamUrl) return done(null, remember({ url: payload.streamUrl, mime:playlistMime(payload.streamUrl), headers: {} }));
      return core.resolveLive(payload.channelCode, (error, stream) => {
        if (error) return done(error);
        try {
          stream.refreshStream=callback=>core.resolveLive(payload.channelCode,(failure,fresh)=>{
            if(failure)return callback(failure);try{remember(fresh);callback(null,fresh);}catch(problem){callback(problem);}
          },{force:true});
          done(null, remember(stream));
        } catch (failure) { done(failure); }
      });
    }
    if (method === 'netdiag') {
      const caps = window.XuperPlayer.capabilities();
      return core.diagnostics(function (error, worker) { done(null, { version: '0.5.4', verdict: lastError ? 'pendiente' : 'local',
        serviceError: lastError, hosts: [], providers: [],
        layers: { session: {ready:!!core.session.ready,userId:core.session.ready?'✓':'?',token:core.session.ready?'✓':'?'} },
        standalone:true, codec:{h264:caps.codecs.h264.native,hevc:caps.codecs.hevc.native,hls:caps.hlsjs?'HLS.js 1.6.15':'MSE no disponible'}, capabilities:caps,
        worker:worker||{error:error&&error.message}, player:window.XuperPlayer.diagnostics,
        note:'El soporte declarado no confirma reproducción ni acceso al proveedor.' }); });
    }
    done(new Error('Esta función de LG no está disponible en la versión Tizen.'));
  } catch (error) { done(error); }
  return true;
}
window.XuperStandalone = { measureRemote:callback=>remoteMetrics.measure(callback),request, core, version: '0.5.4', diagnostics: () => ({ lastError, player: window.XuperPlayer.diagnostics, capabilities: window.XuperPlayer.capabilities() }) };
let diagnosticPanel=null;
window.XuperStandalone.openDiagnostics=function(playback){
  if(diagnosticPanel)diagnosticPanel.remove();
  diagnosticPanel=document.createElement('section');diagnosticPanel.className='xt-diagnostics';
  diagnosticPanel.innerHTML='<h1>Diagnóstico XuperTizen 0.5.4</h1><p>Una foto de esta pantalla permite identificar la etapa del fallo.</p><pre></pre><button class="xt-diag-close">Cerrar · Return</button><button class="xt-diag-network">Comprobar DNS · Amarillo</button>';
  const panel=diagnosticPanel;
  const environment={version:window.XuperStandalone.version,viewport:[innerWidth,innerHeight],panel:[screen.width,screen.height],scale:document.getElementById('app').getBoundingClientRect().width/1920};
  const safe=Object.assign({},playback||window.XuperPlayer.diagnostics);
  panel.querySelector('pre').textContent=JSON.stringify({entorno:environment,reproductor:safe,mando:remoteMetrics.snapshot()},null,2);
  panel.querySelector('.xt-diag-network').onclick=()=>{const button=panel.querySelector('.xt-diag-network');if(button.disabled)return;button.disabled=true;button.textContent='Consultando DNS seguro…';const check=async()=>await nativeTransport.ensure()?nativeTransport.diagnose():new Promise((resolve,reject)=>core.call('networkDiagnostic',{},(error,result)=>error?reject(error):resolve(result)));check().then(network=>{if(diagnosticPanel!==panel)return;button.disabled=false;button.textContent='Comprobar DNS · Amarillo';panel.querySelector('pre').textContent=JSON.stringify({entorno:environment,reproductor:safe,mando:remoteMetrics.snapshot(),transporte:nativeTransport.snapshot(),red:network},null,2);},()=>{if(diagnosticPanel===panel){button.disabled=false;button.textContent='Error de diagnóstico · Amarillo';}});};
  panel.querySelector('button').onclick=()=>{panel.remove();diagnosticPanel=null;};document.getElementById('app').appendChild(panel);
  core.diagnostics((error,result)=>{if(diagnosticPanel!==panel)return;panel.querySelector('pre').textContent=JSON.stringify({entorno:environment,reproductor:safe,mando:remoteMetrics.snapshot(),transporte:nativeTransport.snapshot(),datos:error?{error:error.message}:result},null,2);});
};
function handleRemote(event){
  const code=event.keyCode;
  if(diagnosticPanel){if(code===405)diagnosticPanel.querySelector('.xt-diag-network').click();if(code===38||code===40)diagnosticPanel.querySelector('pre').scrollTop+=code===40?180:-180;if([10009,461,27,13,406].includes(code)){diagnosticPanel.remove();diagnosticPanel=null;}return ![447,448,449].includes(code);}
  if(window.XuperGuide.handle(event)||window.XuperCatalog.handle(event))return true;
  if(code===406){window.XuperStandalone.openDiagnostics();return true;}
  if((code===427||code===428)&&window.__xuper&&__xuper.state.screen==='player'&&__xuper.state.playerMode==='live'){__xuper.key(code===427?38:40);return true;}
  return false;
};

window.XuperStandalone.handleRemote=event=>remoteMetrics.measure(()=>handleRemote(event),true);

const posterURLs=[];
window.XuperStandalone.loadPoster=function(image,url){
  if(image.getAttribute('src') || image.dataset.posterPending)return;
  image.dataset.posterPending='1';
  core.poster(url,function(error,result){
    delete image.dataset.posterPending;
    if(!image.isConnected)return;
    if(error || !result || !result.blob){image.src=url;return;}
    const local=URL.createObjectURL(result.blob);posterURLs.push(local);image.src=local;
    if(posterURLs.length>80)URL.revokeObjectURL(posterURLs.shift());
  });
};
window.addEventListener('pagehide',()=>{window.XuperGuide.close();window.XuperCatalog.close();core.dispose();nativeTransport.dispose();posterURLs.forEach(url=>URL.revokeObjectURL(url));});
