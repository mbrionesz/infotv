export function createCoreClient() {
  let worker=null,serial=0,failure='';const pending=new Map();
  function start(){
    if(worker)return worker;
    if(failure)throw new Error(failure);
    try{
      worker=new Worker(new URL('vendor/core-worker.js',document.baseURI).href);
      const target=worker;
      target.onmessage=event=>{
        if(worker!==target)return;
        const message=event.data||{};
        if(message.nativeRequest){
          const transport=window.XuperNativeTransport;
          Promise.resolve(transport?transport.request(message.options):null).then(result=>{
            if(worker!==target)return;const reply={nativeReply:message.nativeRequest,result};target.postMessage(reply,result&&result.body?[result.body]:[]);
          },error=>{if(worker===target)target.postMessage({nativeReply:message.nativeRequest,error:error.message});});return;
        }
        const entry=pending.get(message.id);
        if(!entry)return;pending.delete(message.id);clearTimeout(entry.timer);
        const error=message.error?new Error(message.error):null;if(error){error.portalCode=message.code;if(message.categoryFailure)error.categoryFailure=message.categoryFailure;}
        entry.callback(error,message.result);
      };
      target.onerror=()=>{
        if(worker!==target)return;
        failure='No pudo iniciar el servicio de datos del TV (Web Worker).';
        const entries=Array.from(pending.values());pending.clear();worker=null;target.terminate();
        for(const entry of entries)clearTimeout(entry.timer);
        for(const entry of entries)entry.callback(new Error(failure));
      };
    }catch(error){failure=error.message;throw error;}
    return worker;
  }
  function call(method,payload,callback){
    const id=++serial;
    try{
      const target=start();
      const timer=setTimeout(()=>{const entry=pending.get(id);if(entry){pending.delete(id);entry.callback(new Error('Tiempo de espera agotado en datos del TV'));}},26000);
      pending.set(id,{callback,timer});target.postMessage({id,method,payload:payload||{}});
    }catch(error){const entry=pending.get(id);if(entry){clearTimeout(entry.timer);pending.delete(id);}callback(error);}
  }
  const api={call,session:{ready:false},diagnostics:callback=>call('diagnostics',{},(error,result)=>{if(result)api.session.ready=!!result.sessionReady;callback(error,result);}),poster:(url,callback)=>call('poster',{url},callback)};
  api.home=(root,pageNum,callback)=>call('home',{root,pageNum},callback);
  api.search=(value,callback)=>call('search',{value},callback);
  api.detail=(contentId,callback)=>call('detail',{contentId},callback);
  api.mediaInfo=(contentId,seriesContentId,callback)=>call('mediaInfo',{contentId,seriesContentId},callback);
  api.resolve=(contentId,seriesContentId,options,callback)=>call('resolve',Object.assign({contentId,seriesContentId},options),callback);
  api.resolveLive=(channelCode,callback,options={})=>call('resolveLive',{channelCode,force:!!options.force},callback);
  api.fetchM3u=(url,callback)=>call('fetchM3u',{url},(error,result)=>callback(error,result&&result.channels));
  api.getLiveCategories=callback=>call('liveCategories',{},(error,result)=>callback(error,result&&result.categories));
  api.getLiveChannels=(columnId,pageNum,pageSize,callback)=>call('liveChannels',{columnId,pageNum,pageSize},(error,result)=>callback(error,result&&result.channels,result&&result.hasMore,result));
  api.dispose=()=>{const old=worker;worker=null;if(old)old.terminate();const entries=Array.from(pending.values());pending.clear();api.session.ready=false;for(const entry of entries)clearTimeout(entry.timer);const error=Object.assign(new Error('Servicio de datos cerrado'),{name:'AbortError'});for(const entry of entries)entry.callback(error);};
  return api;
}
