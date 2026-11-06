export function hlsRange(context){
 const start=context.rangeStart===undefined?0:context.rangeStart,end=context.rangeEnd;
 return Number.isSafeInteger(start)&&start>=0&&Number.isSafeInteger(end)&&end>start?'bytes='+start+'-'+(end-1):'';
}
export function nativeHlsLoad(loader,transport,context,config,callbacks,headers,fallback,onRetry=()=>{}){
 loader.context=context;loader.nativeActive=true;const stats=loader.stats;
 stats.loading.start=performance.now();stats.retry=0;
 const requestHeaders=Object.assign({},headers),range=hlsRange(context);
 if(range)requestHeaders.Range=range;
 const fragment=context.responseType==='arraybuffer';
 const policy=config.loadPolicy||{};
 const budget=Math.min(fragment?20000:12000,policy.maxLoadTimeMs||config.timeout||15000);
 const retries=Math.min(context.type==='manifest'?1:3,policy.errorRetry&&policy.errorRetry.maxNumRetry!==undefined?policy.errorRetry.maxNumRetry:2);
 let active=true,retryTimer=null,timer=null;
 const cancel=()=>{active=false;clearTimeout(timer);clearTimeout(retryTimer);};loader.cancelNative=cancel;
 timer=setTimeout(()=>{if(active){cancel();stats.aborted=true;callbacks.onTimeout(stats,context,null);}},budget);
 function retry(status){
  if(stats.retry>=retries||status===401||status===403||status===416||status>0&&status!==404&&status!==408&&status!==429&&status<500)return false;
  const delay=Math.min(800,200*Math.pow(2,stats.retry));
  if(performance.now()-stats.loading.start+delay>=budget)return false;
  stats.retry++;onRetry();retryTimer=setTimeout(load,delay);return true;
 }
 function failed(status){
  if(!active)return;if(retry(status))return;cancel();
  callbacks.onError({code:status||0,text:'Error HTTP en sockets Samsung'},context,null,stats);
 }
 function load(){
  if(!active)return;
  const remaining=Math.max(100,Math.floor(budget-(performance.now()-stats.loading.start)));
  transport.request({url:context.url,headers:requestHeaders,priority:'playback',timeout:Math.min(12000,remaining)}).then(result=>{
   if(!active)return;
   if(!result&&fallback){cancel();loader.nativeActive=false;stats.loading.start=0;stats.aborted=false;loader.cancelNative=null;fallback();return;}
   if(!result||result.status<200||result.status>=300){failed(result&&result.status||0);return;}
   cancel();loader.nativeHeaders=result.headers||'';
   stats.loading.end=performance.now();
   const metrics=result.metrics;
   // ABR needs the body-transfer duration. Using first=end advertises infinite bandwidth.
   stats.loading.first=metrics?Math.max(stats.loading.start,Math.min(stats.loading.end,stats.loading.end-Math.max(0,metrics.totalMs-metrics.firstByteMs))):stats.loading.start;
   stats.loaded=stats.total=result.body.byteLength;stats.chunkCount=1;
   const data=fragment?result.body:new TextDecoder().decode(result.body);
   callbacks.onSuccess({url:result.url||context.url,data,code:result.status},stats,context,null);
  },()=>failed(0));
 }
 load();
}
