import {createCatalogStatistics,createCatalogStatisticsPanel} from './catalog-statistics.js';
import {isSeriesTitle} from './content-kind.js';
import {createCacheCleaner} from './cache-cleaner.js';
import {createCarouselCache} from './carousel-cache.js';
import {createCatalogCountController} from './catalog-count-controller.js';
import {createExitGate} from './exit-gate.js';
import {continueTitle} from './library-info.js';
import {nextEpisodeOffer} from './next-episode.js';
import {createVodRecovery} from './vod-recovery.js';
import {createDiagnosticCards} from './diagnostic-cards.js';
import {measureInternet} from './network-quality.js';
import {createArtworkSettings} from './artwork-settings.js';
import {createLiveTracks} from './live-tracks.js';
import {createTvShell} from './tv-shell.js';
import {remainingLabel,similarTitles} from './library-info.js';
import {detailFocus} from './detail-navigation.js';
import {createPeoplePanel} from './portal-people.js';
import {compareCatalogTotals} from './catalog-totals.js';
import {installPosterLoader} from './poster-art.js';
import {createProfileStore} from './profile-store.js';
import {createVodRenewal,knownVodDuration,resumeClock,canResumeVod} from './vod-renewal.js';
import {titleBadges,qualityLabel} from './title-info.js';
import {auditVodMetadata} from './vod-metadata-audit.js';
import {subtitleDecision} from './vod-preferences.js';
import audioLanguage from '../companion/lib/audio-language.js';
import {loadSubtitles} from './subtitles.js';
import {allowContent} from './content-filter.js';
import {requestSignal} from './request-signal.js';
import {probeCdns} from './cdn-probe.js';
import {formatMediaInfo} from './media-info.js';
import {playlistMime} from './addons.js';
import {createNativeTransport} from './dnsx.js';
const nativeTransport=createNativeTransport();
window.XuperNativeTransport=nativeTransport;
import {createRemoteMetrics} from './remote-metrics.js';
const remoteMetrics=createRemoteMetrics();
import { createCoreClient } from './core-client.js';
const core = createCoreClient();
import {createCatalogAudit} from './catalog-audit.js';
const catalogAudit=createCatalogAudit(core);
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
window.XuperLiveTracks=createLiveTracks(window);
window.XuperArtwork=createArtworkSettings(window);
window.XuperGuide=createGuide(core);
window.XuperCatalog=createCatalog(core);
window.XuperShell=createTvShell(window);
const peoplePanel=createPeoplePanel(core);
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
    if (method === 'ping') return done(null, { service: 'xuper-tizen-standalone', version: '0.10.16', standalone: true, relayAvailable: false, capabilities: window.XuperPlayer.capabilities() });
    if (method === 'checkUpdate') return done(null, { updateAvailable: false, currentVersion: '0.10.16' });
    if (method === 'prewarm' || method === 'heartbeat' || method === 'keepAlive') return done(null, { standalone: true });
    if (method === 'abortMedia') { window.XuperPlayer.stop(); return done(null, {}); }
    if (method === 'resolveSmooth') return done(new Error('Usa reproducción automática en este televisor Samsung.'));
    if (method === 'home') return core.home(payload.root || 'movies', payload.pageNum, done);
    if (method === 'search') return core.search(payload.value || '', done);
    if (method === 'detail') return core.detail(payload.contentId, done);
    if (method === 'mediaInfo') return core.mediaInfo(payload.contentId, payload.seriesContentId, done);
    if (method === 'liveCategories') return core.getLiveCategories((error, categories) => done(error, { categories: categories || [] }));
    if (method === 'liveChannels') return core.getLiveChannels(payload.columnId, payload.pageNum, payload.pageSize, (error, channels, hasMore) => done(error, { channels: channels || [], hasMore: !!hasMore, pageNum: Number(payload.pageNum) || 1 }));
    if (method === 'fetchM3u') return core.fetchM3u(payload.url, (error, channels) => done(error, { channels: channels || [] }));
    if (method === 'resolve') {
      const options={trackIndex:payload.trackIndex,trackExplicit:payload.trackExplicit,preferredAudio:payload.preferredAudio,force:true};
      const renew=createVodRenewal(callback=>core.resolve(payload.contentId,payload.seriesContentId,options,(error,fresh)=>{if(error)return callback(error);try{fresh.refreshStream=refresh;remember(fresh);callback(null,fresh);}catch(failure){callback(failure);}}));
      const refresh=callback=>renew().then(value=>callback(null,value),callback);
      return core.resolve(payload.contentId,payload.seriesContentId,options,(error,stream)=>{if(error)return done(error);try{stream.refreshStream=refresh;done(null,remember(stream));}catch(failure){done(failure);}});
    }
    if (method === 'resolveLive') {
      const resolveAt=performance.now();
      if (payload.streamUrl) return done(null, remember({ url: payload.streamUrl, mime:playlistMime(payload.streamUrl), headers: {} }));
      return core.resolveLive(payload.channelCode, (error, stream) => {
        if (error) return done(error);
        try {
          stream.resolveMs=Math.round(performance.now()-resolveAt);
          stream.refreshStream=callback=>core.resolveLive(payload.channelCode,(failure,fresh)=>{
            if(failure)return callback(failure);try{remember(fresh);callback(null,fresh);}catch(problem){callback(problem);}
          },{force:true});
          done(null, remember(stream));
        } catch (failure) { done(failure); }
      });
    }
    if (method === 'netdiag') {
      const caps = window.XuperPlayer.capabilities();
      return core.diagnostics(function (error, worker) { done(null, { version: '0.10.16', verdict: lastError ? 'pendiente' : 'local',
        serviceError: lastError, hosts: [], providers: [],
        layers: { session: {ready:!!core.session.ready,userId:core.session.ready?'✓':'?',token:core.session.ready?'✓':'?'} },
        standalone:true, codec:{h264:caps.codecs.h264.native,hevc:caps.codecs.hevc.native,hls:caps.hlsjs?'HLS.js '+window.XuperPlayer.diagnostics.hlsVersion:'MSE no disponible'}, capabilities:caps,
        worker:worker||{error:error&&error.message}, player:window.XuperPlayer.diagnostics,
        note:'El soporte declarado no confirma reproducción ni acceso al proveedor.' }); });
    }
    done(new Error('Esta función no está disponible en la versión Tizen.'));
  } catch (error) { done(error); }
  return true;
}
let profileStorage;try{profileStorage=window.localStorage;}catch(_){}
const profileStore=createProfileStore(profileStorage,window.indexedDB);
const catalogStatistics=createCatalogStatistics({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
const catalogStatisticsPanel=createCatalogStatisticsPanel(catalogStatistics,document);
window.XuperStandalone = { catalogStatistics:()=>catalogStatistics.snapshot(),mountCatalogStatistics:node=>catalogStatisticsPanel.mount(node), isSeriesTitle,continueTitle, nextEpisodeOffer, resumeClock,canResumeVod,remainingLabel,similarTitles,detailFocus, openPeople:peoplePanel.open, portal:(method,payload={})=>new Promise((resolve,reject)=>{if(!['portalRoutes','portalHome','portalShelve','portalPersons','portalPersonItems','portalShortVideos','portalCatchup','portalResolveCatchup'].includes(method))return reject(new Error('Ruta no disponible'));core.call(method,payload,(error,result)=>error?reject(error):resolve(result));}), compareCatalogTotals:root=>compareCatalogTotals((method,payload)=>new Promise((resolve,reject)=>core.call(method,payload,(error,result)=>error?reject(error):resolve(result))),root), profileStore,knownVodDuration, titleBadges,qualityLabel, auditVodMetadata:()=>auditVodMetadata(core,window.__xuper&&window.__xuper.state||{},window.XuperPlayer), subtitleDecision, chooseAudioTrack:audioLanguage.chooseAudioTrack,audioLanguageLabel:value=>audioLanguage.describe(typeof value==='object'?value:{language:value,name:value},0).name,loadSubtitles,playbackHistory:()=>window.XuperPlayer.history(),allowContent, formatMediaInfo, measureRemote:callback=>remoteMetrics.measure(callback),request, core, version: '0.10.16', diagnostics: () => ({ storage:profileStore.diagnostics(),lastError, startup:window.__xuperStartup||null, player: window.XuperPlayer.diagnostics, capabilities: window.XuperPlayer.capabilities() }) };
const vodRecovery=createVodRecovery(window,{reset:()=>{core.restart();nativeTransport.reset();streams.clear();lastError='';}});
window.XuperStandalone.showVodRecovery=vodRecovery.open;
window.XuperStandalone.auditCatalog=root=>catalogAudit.run({root:root||'series',onProgress:entry=>console.log('XT_CATALOG_OPTION '+JSON.stringify(entry))}).then(result=>{console.log('XT_CATALOG_AUDIT '+JSON.stringify(result));return result;});
window.XuperStandalone.cancelCatalogAudit=()=>catalogAudit.cancel();
window.XuperStandalone.catalogAudit=()=>catalogAudit.snapshot();
let diagnosticPanel=null,diagnosticSignal=null;
function closeDiagnostics(){if(diagnosticSignal)diagnosticSignal.abort();diagnosticSignal=null;if(diagnosticPanel)diagnosticPanel.remove();diagnosticPanel=null;}
window.XuperStandalone.probeCdns=async function(options={}){
 const p=window.XuperPlayer.diagnostics,g=window.XuperGuide.diagnostics();
 const active=g.engine?g:p;const origins=(active.cdnHosts||[]).map(host=>(active.transport==='https'?'https://':'http://')+host);for(const stream of Array.from(streams.values()).reverse()){origins.push(stream.url);for(const entry of stream.backupUrls||[])origins.push(typeof entry==='string'?entry:entry.url);}
 for(const host of (p.playlistHosts||[]).concat(g.playlistHosts||[]))origins.push('http://'+host);
 if(!origins.length)for(const host of (g.cdnHosts||[]).concat(p.cdnHosts||[]))origins.push('http://'+host);
 return probeCdns(origins,nativeTransport,options);
};
window.XuperStandalone.openDiagnostics=function(playback){
 closeDiagnostics();diagnosticSignal=requestSignal();
 diagnosticPanel=createDiagnosticCards({playback:playback||window.XuperPlayer.diagnostics,signal:diagnosticSignal,internet:options=>measureInternet(options),cdns:options=>window.XuperStandalone.probeCdns(options),dns:async()=>await nativeTransport.ensure()?nativeTransport.diagnose():new Promise((resolve,reject)=>core.call('networkDiagnostic',{},(error,result)=>error?reject(error):resolve(result))),close:closeDiagnostics});
 document.getElementById('app').appendChild(diagnosticPanel);
};
let exitToast=null,exitToastTimer;
const exitGate=createExitGate({prompt:()=>{window.XuperShell.focusHeader();if(!exitToast){exitToast=document.createElement('div');exitToast.className='xt-exit-toast';document.getElementById('app').appendChild(exitToast);}exitToast.textContent='Pulsa Atrás otra vez para salir';clearTimeout(exitToastTimer);exitToastTimer=setTimeout(()=>{exitToast?.remove();exitToast=null;},2200);},exit:async()=>{
 window.__xuper?.checkpointVod?.();window.XuperPlayer.stop();window.XuperGuide.close();window.XuperCatalog.close();
 const flush=window.XuperStandalone.profileStore.flush();const clear=new Promise(resolve=>core.call('clearMetadata',{},()=>resolve()));
 await Promise.race([Promise.allSettled([flush,clear]),new Promise(resolve=>setTimeout(resolve,1200))]);
 core.dispose();nativeTransport.dispose();posterLoader.dispose();streams.clear();exitToast?.remove();exitToast=null;
 try{if(window.tizen?.application){window.tizen.application.getCurrentApplication().exit();return;}}catch(_){}
 window.location.reload();
}});
function handleRemote(event){
  const code=event.keyCode;
  if(![10009,461,27].includes(code)||window.__xuper?.state.screen!=='home')exitGate.reset();
  if(window.__xuper&&__xuper.state.screen==='player')__xuper.touchPlayerControls?.();
  if(code===10182&&window.__xuper?.state.screen==='player'){
    window.__xuper.checkpointVod?.();window.XuperStandalone.profileStore.flush();
    try{if(window.tizen?.application){window.tizen.application.getCurrentApplication().exit();return true;}}catch(_){}
    if(window.__xuper.state.playerMode==='vod'){window.__xuper.recoverVod('catalog');vodRecovery.close();return true;}
  }
  if(vodRecovery.handle(event))return true;
  if(XuperArtwork.handle(event))return true;
  if(!diagnosticPanel&&XuperLiveTracks.handle(event))return true;
  if(diagnosticPanel){if(code===37||code===39){const buttons=diagnosticPanel.querySelectorAll('button');let index=Number(diagnosticPanel.dataset.action)||0;buttons[index].classList.remove('is-focused');index=(index+(code===39?1:buttons.length-1))%buttons.length;diagnosticPanel.dataset.action=String(index);buttons[index].classList.add('is-focused');}if(code===13){const buttons=diagnosticPanel.querySelectorAll('button');buttons[Number(diagnosticPanel.dataset.action)||0].click();return true;}if(code===405)diagnosticPanel.querySelector('.xt-diag-network').click();if(code===38||code===40){const step=code===40?180:-180;diagnosticPanel.querySelector('.xt-diag-body').scrollTop+=step;}if([10009,461,27,406].includes(code)){closeDiagnostics();}return ![447,448,449].includes(code);}
  if(peoplePanel.handle(event)){exitGate.reset();return true;}
  const rootExit=window.__xuper?.state.screen==='home'&&(window.XuperShell.focused||window.XuperCatalog.atRoot||window.XuperGuide.atRoot)&&!document.querySelector('.xt-keyboard,.xt-search-workspace,.xt-filter-menu,.xt-history-actions');
  if(exitGate.handle(event,rootExit))return true;
  if(window.XuperShell.handle(event)||window.XuperGuide.handle(event)||window.XuperCatalog.handle(event))return true;
  if(code===406){window.XuperStandalone.openDiagnostics();return true;}
  if((code===427||code===428)&&window.__xuper&&__xuper.state.screen==='player'&&__xuper.state.playerMode==='live'){__xuper.key(code===427?38:40);return true;}
  return false;
};

const catalogCount=createCatalogCountController({onReport:report=>{catalogStatistics.record(report);catalogStatisticsPanel.render();},onFailure:()=>{catalogStatistics.failed();catalogStatisticsPanel.render();},request:callback=>core.call('catalogTotals',{},callback),storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},render:(text,detail)=>window.XuperShell.setCatalogCount(text,detail),eligible:()=>!document.hidden&&window.__xuper?.state.screen==='home'});
const wakeCatalogCount=()=>catalogCount.wake();
document.addEventListener('visibilitychange',wakeCatalogCount);
window.addEventListener('xuper:home',wakeCatalogCount);
window.addEventListener('pagehide',()=>{catalogCount.dispose();document.removeEventListener('visibilitychange',wakeCatalogCount);window.removeEventListener('xuper:home',wakeCatalogCount);});
window.XuperStandalone.auditCarouselDates=()=>XuperCatalog.auditDates();
window.XuperStandalone.handleRemote=event=>remoteMetrics.measure(()=>handleRemote(event),true);

try{localStorage.removeItem('xuper.searchHistory');}catch(_){}
const posterLoader=installPosterLoader(core,window);
window.XuperStandalone.cleanTemporaryData=createCacheCleaner({checkpoint:()=>window.__xuper?.checkpointVod?.(),flush:()=>window.XuperStandalone.profileStore.flush(),stop:()=>{window.XuperPlayer.stop();window.XuperGuide.close();window.XuperCatalog.close();},clear:[()=>new Promise(resolve=>core.call('clearTemporary',{},(error,result)=>resolve(!error&&result?.cleared===true))),()=>createCarouselCache(window.indexedDB).clear()],reset:()=>{catalogCount.dispose();core.dispose();nativeTransport.reset();posterLoader.dispose();streams.clear();try{localStorage.removeItem('xt.catalogCount');}catch(_){}}});

window.XuperStandalone.loadPoster=posterLoader.load;
window.addEventListener('pagehide',()=>{vodRecovery.close();window.XuperShell.dispose();XuperLiveTracks.close();XuperArtwork.close();closeDiagnostics();peoplePanel.close();window.XuperGuide.close();window.XuperCatalog.close();core.dispose();nativeTransport.dispose();posterLoader.dispose();});
