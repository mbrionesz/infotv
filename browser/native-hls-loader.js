export function nativeHlsLoad(loader,transport,context,config,callbacks,headers){
 loader.context=context;loader.nativeActive=true;const stats=loader.stats;stats.loading.start=performance.now();
 const requestHeaders=Object.assign({},headers);
 if(Number.isFinite(context.rangeEnd))requestHeaders.Range='bytes='+(context.rangeStart||0)+'-'+(context.rangeEnd-1);
 let active=true;const cancel=()=>{active=false;clearTimeout(timer);};loader.cancelNative=cancel;
 const timer=setTimeout(()=>{if(active){cancel();stats.aborted=true;callbacks.onTimeout(stats,context,null);}},Math.min(15000,config.timeout||15000));
 transport.request({url:context.url,headers:requestHeaders,timeout:12000}).then(result=>{
  if(!active)return;cancel();
  if(!result||result.status<200||result.status>=300){callbacks.onError({code:result&&result.status||0,text:'Error HTTP en sockets Samsung'},context,null,stats);return;}
  loader.nativeHeaders=result.headers||'';
  stats.loading.first=stats.loading.end=performance.now();stats.loaded=stats.total=result.body.byteLength;stats.chunkCount=1;
  const data=context.responseType==='arraybuffer'?result.body:new TextDecoder().decode(result.body);
  callbacks.onSuccess({url:result.url||context.url,data,code:result.status},stats,context,null);
 },()=>{if(active){cancel();callbacks.onError({code:0,text:'Error de conexión HTTP/TLS en sockets Samsung'},context,null,stats);}});
}
