import {requestSignal,abortable} from './request-signal.js';
import {dnsQuestion,resolvers,resolverEndpoints} from './dns-diagnostic.js';
export function createNativeTransport({workerFactory=()=>new Worker(new URL('vendor/native-worker.js',document.baseURI)),now=Date.now}={}){
 let libraryVersions=null;
 let disposed=false,replacing=0;const counters={canceledQueued:0,canceledActive:0,replacements:0};
 let serial=0,cooldown=0,ready=false,disabled=false,portalFallback=false,lastFailure=null,reason='Comprobando extensión Samsung';const queue=[],slots=[],cache=new Map(),inflight=new Map(),recent=new Map(),originFallbacks=new Set();
 function slot(){
  return new Promise(resolve=>{
   let worker;try{worker=workerFactory();}catch(_){reason='No pudo crear worker Samsung';resolve(null);return;}
   const item={worker,busy:false,pending:null};let initialized=false;
   const timer=setTimeout(()=>{if(!initialized){initialized=true;worker.terminate();reason='Tiempo agotado al iniciar sockets';resolve(null);}},12000);
   worker.onmessage=event=>{
    const message=event.data||{};
    if('ready' in message){if(initialized)return;if(disposed){initialized=true;clearTimeout(timer);worker.terminate();resolve(null);return;}initialized=true;clearTimeout(timer);if(!message.ready){reason=message.reason;worker.terminate();resolve(null);}else{libraryVersions=message.libraries||libraryVersions;slots.push(item);resolve(item);pump();}return;}
    if(!item.pending||item.pending.id!==message.id)return;
    const pending=item.pending;if(pending.off)pending.off();clearTimeout(pending.timer);item.pending=null;item.busy=false;
    if(message.error){const error=new Error(message.error);error.nativeCode=message.nativeCode;error.metrics=message.metrics;pending.reject(error);}else pending.resolve(message.result);pump();
   };
   worker.onerror=()=>{
    if(!initialized){initialized=true;clearTimeout(timer);reason='Error al cargar sockets Samsung';resolve(null);}
    if(item.pending){if(item.pending.off)item.pending.off();clearTimeout(item.pending.timer);item.pending.reject(new Error('El transporte Samsung se detuvo'));item.pending=null;}
    item.busy=false;item.dead=true;worker.terminate();pump();
   };
  });
 }
 // Start lazily: only Samsung runtimes load the native binary; desktops stay on XHR.
 const start=async()=>{
  const first=await slot();if(!first)return false;
  ready=true;reason='Sockets Samsung disponibles';slot();return true;
 };
 let started;function ensure(){if(disabled)return Promise.resolve(false);if(!started)started=start();return started;}
 function pump(){
  for(const item of slots){if(item.dead||item.busy||!queue.length)continue;const job=queue.shift();item.busy=true;item.pending=job;
   job.timer=setTimeout(()=>{if(item.pending!==job)return;if(job.off)job.off();item.pending=null;item.dead=true;item.busy=false;item.worker.terminate();job.reject(new Error('Tiempo de espera agotado en sockets'));pump();},job.method==='dns'?6000:16000);
   item.worker.postMessage({id:job.id,method:job.method,options:job.options});
  }
  if(queue.length&&!replacing&&slots.every(item=>item.dead)){while(queue.length)queue.shift().reject(new Error('Transporte Samsung no disponible'));ready=false;}
 }
 function call(method,options,signal){return new Promise((resolve,reject)=>{
  if(disposed||signal&&signal.aborted){reject(signal&&signal.error||new Error('Transporte cerrado'));return;}
  if(queue.length>=24){reject(new Error('Cola de red ocupada'));return;}
  const job={id:++serial,method,options,resolve,reject};
  if(signal)job.off=signal.subscribe(()=>{
   const queued=queue.indexOf(job);if(queued>=0){queue.splice(queued,1);counters.canceledQueued++;}
   const item=slots.find(slot=>slot.pending===job);
   if(item){clearTimeout(job.timer);item.pending=null;item.dead=true;item.busy=false;item.worker.terminate();slots.splice(slots.indexOf(item),1);counters.canceledActive++;
    if(!disposed){replacing++;counters.replacements++;slot().then(replacement=>{replacing--;if(replacement)ready=true;pump();});}
   }
   if(job.off)job.off();reject(signal.error);pump();
  });
  const index=options.priority==='playback'?queue.findIndex(item=>item.options.priority!=='playback'):-1;
  if(index<0)queue.push(job);else queue.splice(index,0,job);pump();
 });}
 async function lookup(host,service,priority){
  if(/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(':'))return {ip:'',mode:'literal-ip'};
  dnsQuestion(host);const hit=cache.get(host);if(hit&&hit.expires>now())return hit;
  if(inflight.has(host))return inflight.get(host);
  if(cooldown>now())return {ip:'',mode:'system-fallback',cooldown:true};
  const task=call('dns',{host,service,priority}).then(answer=>{
   const result=answer.ip?{ip:answer.ip,ips:Array.isArray(answer.ips)?answer.ips:[answer.ip],resolver:answer.resolver,mode:'secure-dns',expires:now()+Math.min(600,answer.ttl)*1000}:{ip:'',mode:'system-fallback'};
   if(answer.ip){cooldown=0;cache.delete(host);cache.set(host,result);if(cache.size>64)cache.delete(cache.keys().next().value);}else cooldown=now()+300000;
   return result;
  });inflight.set(host,task);task.then(()=>inflight.delete(host),()=>inflight.delete(host));return task;
 }
 function skip(method,origin){return disabled||method==='POST'&&portalFallback||originFallbacks.has(origin);}
 function suspend(error,record,method,origin){
  const code=Number.isInteger(error.nativeCode)?error.nativeCode:null;
  const details={7:'No pudo conectar al servidor',28:'Tiempo agotado; consultar fase TCP/TLS/HTTP',35:'Falló la negociación TLS',43:'Argumento no admitido por el transporte',60:'Certificado no validado',77:'No pudo leer el almacén de certificados'};
  lastFailure={host:record.host,scheme:record.scheme,port:record.port,code,detail:details[code]||'Fallo del transporte nativo',metrics:error.metrics||null};
  originFallbacks.add(origin);
  if(method==='POST'){
    portalFallback=true;error.portalFallback=true;
    for(let i=queue.length-1;i>=0;i--)if(queue[i].options.service==='portal')queue.splice(i,1)[0].reject(error);
  }
  if(slots.every(item=>item.dead)){disabled=true;ready=false;}
  reason=disabled?'Sockets Samsung no disponibles; se usará navegador/DNS del TV.':'Fallback al navegador para el origen fallido'+(portalFallback?' y las peticiones del portal':'')+'. El vídeo conserva la ruta nativa en otros orígenes.';
 }
 async function requestWork(options){
  const signal=options.signal;
  if(!await abortable(ensure(),signal))return null;
  let target=new URL(options.url);if(!/^https?:$/.test(target.protocol)||target.username||target.password)throw new Error('URL no admitida');
  if(skip(options.method||'GET',target.origin))return null;
  let headers=Object.assign({},options.headers),method=options.method||'GET',body=options.body||null;
  for(let redirects=0;redirects<5;redirects++){
   let address;try{address=await abortable(lookup(target.hostname,method==='POST'?'portal':'media',options.priority),signal);}catch(error){if(signal&&signal.aborted)throw signal.error;if(!error.portalFallback)cooldown=now()+300000;address={ip:'',mode:'system-fallback'};}
   if(skip(method,target.origin))return null;
   const lines=Object.keys(headers).filter(name=>! /^(host|connection|content-length|accept-encoding)$/i.test(name)).map(name=>{
    const value=String(headers[name]);if(!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)||/[\r\n]/.test(value))throw new Error('Cabecera no válida');return name+': '+value;
   }).join('\n');
   const port=Number(target.port)||(target.protocol==='https:'?443:80);
   const record={host:target.hostname,scheme:target.protocol,port,mode:address.mode,ip:address.ip,resolver:address.resolver||'',pending:true,tlsVerified:false,attempts:[]};
   recent.delete(target.hostname);recent.set(target.hostname,record);if(recent.size>8)recent.delete(recent.keys().next().value);
   const ips=(address.ips&&address.ips.length?address.ips:[address.ip||'']).slice(0,2),startedAt=options.startedAt,budget=options.budget;
   let result=null,failure=null;
   for(let i=0;i<ips.length;i++){
    if(skip(method,target.origin)){record.pending=false;return null;}
    const remaining=budget-(now()-startedAt);if(remaining<=0)break;
    record.ip=ips[i];
    try{
      result=await call('http',{url:target.href,host:target.hostname,port,headers:lines,method,service:method==='POST'?'portal':'media',priority:options.priority,body:typeof body==='string'?new TextEncoder().encode(body).buffer:body,ip:ips[i],timeout:Math.max(100,Math.floor(remaining/(ips.length-i)))},signal);
      record.attempts.push({ip:ips[i],httpStatus:result.status,metrics:result.metrics||null});if(cache.has(target.hostname)&&ips[i]){const hit=cache.get(target.hostname);hit.ips=[ips[i],...(hit.ips||[]).filter(value=>value!==ips[i])];hit.ip=ips[i];}break;
    }catch(error){if(signal&&signal.aborted){record.pending=false;throw signal.error;}failure=error;record.attempts.push({ip:ips[i],code:Number.isInteger(error.nativeCode)?error.nativeCode:null,metrics:error.metrics||null});}
   }
   record.pending=false;
   if(!result){failure=failure||new Error('Tiempo de red agotado');if(options.diagnostic)throw failure;record.error='Conexión HTTP/TLS fallida';record.nativeCode=Number.isInteger(failure.nativeCode)?failure.nativeCode:null;record.fallback='xhr-system-dns';suspend(failure,record,method,target.origin);return null;}
   Object.assign(record,{httpStatus:result.status,tlsVerified:target.protocol==='https:',metrics:result.metrics||null});
   const location=(result.headers.match(/^location:\s*(.+)$/im)||[])[1];
   if([301,302,303,307,308].includes(result.status)&&location){
    const next=new URL(location.trim(),target);if(!/^https?:$/.test(next.protocol)||next.username||next.password||target.protocol==='https:'&&next.protocol!=='https:')throw new Error('Redirección insegura');
    if(next.origin!==target.origin)headers={};if(result.status===303||(result.status===301||result.status===302)&&method==='POST'){method='GET';body=null;}target=next;continue;
   }
   return Object.assign(result,{url:target.href,mode:address.mode});
  }throw new Error('Demasiadas redirecciones');
 }
 async function request(options){
  const signal=requestSignal(),parent=options.signal;
  const off=parent?parent.subscribe(()=>signal.abort(parent.error)):()=>{};
  const budget=Math.min(12000,options.timeout||12000);
  const timer=setTimeout(()=>signal.abort(Object.assign(new Error('Tiempo total de petición agotado'),{name:'TimeoutError'})),budget);
  try{return await requestWork(Object.assign({},options,{signal,startedAt:now(),budget}));}finally{off();clearTimeout(timer);}
 }
 return {ensure,request,diagnose:async()=>({available:await ensure(),libraries:libraryVersions,dnsOverride:ready&&Array.from(recent.values()).some(item=>item.mode==='secure-dns'&&item.httpStatus&&!item.fallback),secureDnsCapable:ready,hosts:Array.from(recent.values()),note:'resolver es el DNS consultado; ip es la dirección del portal/CDN. secure-dns indica el intento de usar esa IP conservando Host/SNI. system-fallback usa DNS del TV. No se afirma DNS alterado sin comparación concluyente.'}),snapshot:()=>({available:ready,libraries:libraryVersions,reason,nativeDisabled:disabled,portalFallback,originFallbacks:Array.from(originFallbacks),lastFailure,dnsServers:resolvers,dnsProviders:resolverEndpoints,fieldLegend:{resolver:'Servidor DNS consultado',ip:'IP del portal/CDN devuelta por DNS; no es otro resolutor'},engine:ready?'samsung-wasm-curl':'xhr-system-dns',requests:Object.assign({queued:queue.length,active:slots.filter(item=>item.busy).length,replacing},counters),hosts:Array.from(recent.values()),cooldownUntil:cooldown}),dispose:()=>{disposed=true;slots.forEach(item=>{item.worker.terminate();if(item.pending){clearTimeout(item.pending.timer);if(item.pending.off)item.pending.off();item.pending.reject(new Error('Transporte cerrado'));item.pending=null;}});while(queue.length){const job=queue.shift();if(job.off)job.off();job.reject(new Error('Transporte cerrado'));}}};
}
