import {createDiscoveryQuery} from './discovery-data.js';
import {fetchPlaylist} from './addon-fetch.js';
import {createDnsDiagnostic} from './dns-diagnostic.js';
import core from '../companion/lib/magis.js';
import { createCache } from './cache.js';
import { createCatalogIndex } from './catalog-index.js';
import {createRemoteCatalog} from './catalog-remote.js';
import crypto from './crypto.js';
const dnsDiagnostic=createDnsDiagnostic();let lastStreamHost='',lastPortalCode='';
const cache = createCache(self.indexedDB);
const catalog = createCatalogIndex();
const pageProgress=new Map();
const inflight = new Map();
const metadata = new Set(['home','liveCategories','liveChannels','search','catalogBrowse','catalogColumns','catalogFilters','catalogSearchPage','portalHome','portalShelve','portalShortVideos','portalPersons','portalPersonItems','portalCatchup']);
const remoteCatalog=createRemoteCatalog(execute);
const discoveryQuery=createDiscoveryQuery(execute);
const stats = { requests:0,cacheHits:0,staleHits:0,errors:0 };
let cryptoVerified=false;
try{
  const decipher=crypto.createDecipheriv('des-ede3',Buffer.from('0123456789abcdeffedcba98765432100011223344556677','hex'));
  cryptoVerified=Buffer.concat([decipher.update(Buffer.from('c8c781f3c07c806c304a26ac5327083541155b5cfcbfed46','hex')),decipher.final()]).toString('utf8')==='XuperTizen worker';
}catch(_){}
function invoke(method,payload,done) {
  if(method==='portalRoutes')return done(null,core.portalRoutes());
  if(method==='portalHome')return core.portalHome(payload.root||'movies',done);
  if(method==='portalShelve')return core.portalShelve(payload.root||'movies',payload,done);
  if(method==='portalPersons')return core.portalPersons(payload.contentId,done);
  if(['portalShortVideos','portalPersonItems','portalCatchup','portalResolveCatchup'].includes(method))return core[method](payload,done);
  if(method==='catalogBrowse')return core.catalogBrowse(payload.root,payload,done);
  if(method==='catalogColumns')return core.catalogColumns(payload.root,done);
  if(method==='catalogFilters')return core.catalogFilters(payload.root,done);
  if(method==='catalogSearchPage')return core.catalogSearchPage(payload.root,payload,done);
  if (method==='home') return core.home(payload.root||'movies',payload.pageNum,done);
  if (method==='liveCategories') return core.getLiveCategories((error,categories)=>done(error,{categories:categories||[]}));
  if (method==='liveChannels') return core.getLiveChannels(payload.columnId,payload.pageNum,payload.pageSize,(error,channels,hasMore)=>done(error,{channels:(channels||[]).map(channel=>{
    const item=Object.assign({},channel);delete item.liveAddressList;return item;
  }),hasMore:!!hasMore,pageNum:Number(payload.pageNum)||1}));
  if (method==='search') return core.search(payload.value||'',done);
  if (method==='detail') return core.detail(payload.contentId,done);
  if (method==='mediaInfo') return core.mediaInfo(payload.contentId,payload.seriesContentId,done);
  if (method==='resolve') return core.resolve(payload.contentId,payload.seriesContentId,{trackIndex:payload.trackIndex,trackExplicit:payload.trackExplicit,force:payload.force,preferredAudio:payload.preferredAudio},done);
  if (method==='resolveLive') return core.resolveLive(payload.channelCode,done,{force:!!payload.force});
  if (method==='parseM3u') return done(null,{channels:core.parseM3u(payload.text||'')});
  done(new Error('Método no disponible'));
}
let postersActive=0;const postersQueue=[];
async function thumbnail(blob){
  if(typeof OffscreenCanvas!=='function'||typeof createImageBitmap!=='function')return blob;
  let bitmap;
  try{
    bitmap=await createImageBitmap(blob);const scale=Math.min(1,320/bitmap.width,480/bitmap.height);
    if(scale===1)return blob;
    const canvas=new OffscreenCanvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale)));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    return await canvas.convertToBlob({type:'image/webp',quality:.8});
  }catch(_){return blob;}finally{if(bitmap&&bitmap.close)bitmap.close();}
}
function poster(url) {
  return cache.get('posters',url).then(hit=>{
    if(hit){stats.cacheHits++;return hit;}
    return new Promise((resolve,reject)=>{if(postersQueue.length>=12){reject(new Error('Cola de imágenes ocupada'));return;}postersQueue.push({url,resolve,reject});pump();});
  });
}
function pump(){
  while(postersActive<2 && postersQueue.length){
    const job=postersQueue.shift();postersActive++;
    const xhr=new XMLHttpRequest();xhr.open('GET',job.url,true);xhr.responseType='blob';xhr.timeout=6000;
    let ended=false;function end(error){if(ended)return;ended=true;postersActive--;if(error)job.reject(error);pump();}
    xhr.onprogress=event=>{if(event.loaded>512*1024){xhr.abort();end(new Error('Imagen fuera del límite'));}};
    xhr.onerror=xhr.ontimeout=()=>end(new Error('No se pudo cachear imagen'));
    xhr.onload=async()=>{
      if(xhr.status!==200 || !xhr.response || xhr.response.size>512*1024)return end(new Error('Imagen fuera del límite'));
      const blob=await thumbnail(xhr.response);job.resolve(blob);end();
      cache.put('posters',job.url,blob,7*86400000).then(()=>cache.prune('posters',80,12*1024*1024));
    };xhr.send();
  }
}
async function execute(method,payload){
  stats.requests++;
  if(method==='catalogDiscover')return discoveryQuery(payload);
  if(method==='catalogFullPage')return remoteCatalog(payload);
  if(method==='catalogQuery')return catalog.query(payload.root||'movies',payload);
  if(method==='catalogSearch'){
    const value=String(payload.filters&&payload.filters.text||'').trim();
    if(!value)return catalog.query(payload.root||'movies',payload);
    const result=await execute('search',{value});const scope='$search:'+value.toLowerCase();catalog.add(scope,result.items);
    return Object.assign(catalog.query(scope,payload),{hasMore:false,remoteSearch:true});
  }
  if(method==='catalogPage'){
    const root=payload.root||'movies';const before=catalog.query(root).loaded;
    await execute('home',{root,pageNum:Number(payload.pageNum)||1});
    const key=root+':'+(Number(payload.pageNum)||1);if(!pageProgress.has(key))pageProgress.set(key,catalog.query(root).loaded>before);
    return Object.assign(catalog.query(root,payload),{hasMore:pageProgress.get(key)});
  }
  if(method==='networkDiagnostic'){
    const hosts=Array.from(new Set([lastStreamHost,...core.constants.HOSTS.slice(0,2)].filter(Boolean)));
    const answers=await Promise.all(hosts.map(host=>dnsDiagnostic.lookup(host)));
    return {routing:'system-dns',dnsOverride:false,hosts:answers,portalCode:lastPortalCode,regionalRejection:lastPortalCode==='portal100024',note:'DoH es diagnóstico. Un fallo puede ser TLS, CORS o red; no demuestra bloqueo DNS. El código regional no se corrige cambiando DNS.'};
  }
  if(method==='diagnostics')return {worker:true,cryptoVerified,cache:await cache.available(),sessionReady:!!core.session.ready,stats};
  if(method==='fetchM3u')return {channels:await fetchPlaylist(payload.url)};
  if(method==='poster'){
    if(!/^https?:\/\//i.test(payload.url||''))throw new Error('URL inválida');
    return {blob:await poster(payload.url)};
  }
  // Filter option records now preserve id/label pairs; do not reuse v1 pages
  // whose category/filter selection may have been discarded.
  const key=(/^(catalog|portal)/.test(method)?'catalog-v3:':'')+method+':'+JSON.stringify(payload);
  const cacheable=metadata.has(method)&&!(/^(catalog|portal)/.test(method)&&payload.fresh===true);
  let stale=null;
  if(cacheable){
    const hit=await cache.get('metadata',key);
    if(hit){stats.cacheHits++;if(method==='home')catalog.add(payload.root||'movies',hit.items);return Object.assign({},hit,{cached:true});}
    stale=await cache.get('metadata',key,true);
    if(stale&&method==='home')catalog.add(payload.root||'movies',stale.items);
  }
  if(inflight.has(key)){if(stale){stats.staleHits++;return Object.assign({},stale,{cached:true,stale:true});}return inflight.get(key);}
  const work=new Promise((resolve,reject)=>{
    try{invoke(method,payload,(error,result)=>error?reject(error):resolve(result));}catch(error){reject(error);}
  }).then(async result=>{
    if((method==='resolve'||method==='resolveLive')&&result&&result.url){try{lastStreamHost=new URL(result.url).hostname;}catch(_) {}}
    if(method==='home')catalog.add(payload.root||'movies',result.items);
    if(cacheable){
      await cache.put('metadata',key,result,method==='liveChannels'?300000:600000);
      cache.prune('metadata',160,16*1024*1024);
    }
    return result;
  },async error=>{
    stats.errors++;if(error.portalCode)lastPortalCode=String(error.portalCode);
    if(cacheable){
      const hit=await cache.get('metadata',key,true);
      if(hit){stats.staleHits++;return Object.assign({},hit,{cached:true,stale:true});}
    }
    throw error;
  });
  inflight.set(key,work);
  work.then(()=>inflight.delete(key),()=>inflight.delete(key));
  if(stale){stats.staleHits++;work.catch(()=>{});return Object.assign({},stale,{cached:true,stale:true});}
  return work;
}
let nativeSerial=0;const nativePending=new Map();
self.__xuperNativeRequest=options=>new Promise((resolve,reject)=>{
  const id=++nativeSerial;const timer=setTimeout(()=>{nativePending.delete(id);reject(new Error('Tiempo agotado en transporte Samsung'));},22000);
  nativePending.set(id,{resolve,reject,timer});self.postMessage({nativeRequest:id,options});
});
self.onmessage=event=>{
  if(event.data&&event.data.nativeReply){const entry=nativePending.get(event.data.nativeReply);if(entry){nativePending.delete(event.data.nativeReply);clearTimeout(entry.timer);if(event.data.error)entry.reject(new Error(event.data.error));else entry.resolve(event.data.result);}return;}

  const {id,method,payload}=event.data||{};
  execute(method,payload||{}).then(result=>self.postMessage({id,result}),error=>self.postMessage({id,error:String(error.message||error),code:error.portalCode||''}));
};
