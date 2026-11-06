import {dnsQuestion} from './dns-diagnostic.js';
export function createNativeTransport({workerFactory=()=>new Worker(new URL('vendor/native-worker.js',document.baseURI)),now=Date.now}={}){
 let serial=0,cooldown=0,ready=false,reason='Comprobando extensión Samsung';const queue=[],slots=[],cache=new Map(),inflight=new Map(),recent=new Map();
 function slot(){
  return new Promise(resolve=>{
   let worker;try{worker=workerFactory();}catch(_){reason='No pudo crear worker Samsung';resolve(null);return;}
   const item={worker,busy:false,pending:null};let initialized=false;
   const timer=setTimeout(()=>{if(!initialized){initialized=true;worker.terminate();reason='Tiempo agotado al iniciar sockets';resolve(null);}},12000);
   worker.onmessage=event=>{
    const message=event.data||{};
    if('ready' in message){if(initialized)return;initialized=true;clearTimeout(timer);if(!message.ready){reason=message.reason;worker.terminate();resolve(null);}else{slots.push(item);resolve(item);pump();}return;}
    if(!item.pending||item.pending.id!==message.id)return;
    const pending=item.pending;clearTimeout(pending.timer);item.pending=null;item.busy=false;
    if(message.error)pending.reject(new Error(message.error));else pending.resolve(message.result);pump();
   };
   worker.onerror=()=>{
    if(!initialized){initialized=true;clearTimeout(timer);reason='Error al cargar sockets Samsung';resolve(null);}
    if(item.pending){clearTimeout(item.pending.timer);item.pending.reject(new Error('El transporte Samsung se detuvo'));item.pending=null;}
    item.busy=false;item.dead=true;worker.terminate();pump();
   };
  });
 }
 // Start lazily: only Samsung runtimes load the native binary; desktops stay on XHR.
 const start=async()=>{
  const first=await slot();if(!first)return false;
  ready=true;reason='Sockets Samsung disponibles';slot();return true;
 };
 let started;function ensure(){if(!started)started=start();return started;}
 function pump(){
  for(const item of slots){if(item.dead||item.busy||!queue.length)continue;const job=queue.shift();item.busy=true;item.pending=job;
   job.timer=setTimeout(()=>{if(item.pending!==job)return;item.pending=null;item.dead=true;item.busy=false;item.worker.terminate();job.reject(new Error('Tiempo de espera agotado en sockets'));pump();},job.method==='dns'?6000:16000);
   item.worker.postMessage({id:job.id,method:job.method,options:job.options});
  }
  if(queue.length&&slots.every(item=>item.dead)){while(queue.length)queue.shift().reject(new Error('Transporte Samsung no disponible'));ready=false;}
 }
 function call(method,options){return new Promise((resolve,reject)=>{if(queue.length>=24){reject(new Error('Cola de red ocupada'));return;}queue.push({id:++serial,method,options,resolve,reject});pump();});}
 async function lookup(host){
  if(/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(':'))return {ip:'',mode:'literal-ip'};
  dnsQuestion(host);const hit=cache.get(host);if(hit&&hit.expires>now())return hit;
  if(inflight.has(host))return inflight.get(host);
  if(cooldown>now())return {ip:'',mode:'system-fallback',cooldown:true};
  const task=call('dns',{host}).then(answer=>{
   const result=answer.ip?{ip:answer.ip,resolver:answer.resolver,mode:'secure-dns',expires:now()+Math.min(600,answer.ttl)*1000}:{ip:'',mode:'system-fallback'};
   if(answer.ip){cooldown=0;cache.delete(host);cache.set(host,result);if(cache.size>64)cache.delete(cache.keys().next().value);}else cooldown=now()+300000;
   return result;
  });inflight.set(host,task);task.then(()=>inflight.delete(host),()=>inflight.delete(host));return task;
 }
 async function request(options){
  if(!await ensure())return null;
  let target=new URL(options.url);if(!/^https?:$/.test(target.protocol)||target.username||target.password)throw new Error('URL no admitida');
  let headers=Object.assign({},options.headers),method=options.method||'GET',body=options.body||null;
  for(let redirects=0;redirects<5;redirects++){
   let address;try{address=await lookup(target.hostname);}catch(_){cooldown=now()+300000;address={ip:'',mode:'system-fallback'};}
   const lines=Object.keys(headers).filter(name=>! /^(host|connection|content-length|accept-encoding)$/i.test(name)).map(name=>{
    const value=String(headers[name]);if(!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)||/[\r\n]/.test(value))throw new Error('Cabecera no válida');return name+': '+value;
   }).join('\n');
   const record={host:target.hostname,mode:address.mode,ip:address.ip,resolver:address.resolver||'',pending:true,tlsVerified:false};recent.delete(target.hostname);recent.set(target.hostname,record);if(recent.size>8)recent.delete(recent.keys().next().value);
   const result=await call('http',{url:target.href,host:target.hostname,port:Number(target.port)||(target.protocol==='https:'?443:80),headers:lines,method,body:typeof body==='string'?new TextEncoder().encode(body).buffer:body,ip:address.ip,timeout:options.timeout||12000}).catch(error=>{record.pending=false;record.error='Conexión HTTP/TLS fallida';throw error;});
   Object.assign(record,{pending:false,httpStatus:result.status,tlsVerified:target.protocol==='https:'});
   const location=(result.headers.match(/^location:\s*(.+)$/im)||[])[1];
   if([301,302,303,307,308].includes(result.status)&&location){
    const next=new URL(location.trim(),target);if(!/^https?:$/.test(next.protocol)||target.protocol==='https:'&&next.protocol!=='https:')throw new Error('Redirección insegura');
    if(next.origin!==target.origin)headers={};if(result.status===303||(result.status===301||result.status===302)&&method==='POST'){method='GET';body=null;}target=next;continue;
   }
   return Object.assign(result,{url:target.href,mode:address.mode});
  }throw new Error('Demasiadas redirecciones');
 }
 return {ensure,request,diagnose:async()=>({available:await ensure(),dnsOverride:ready&&Array.from(recent.values()).some(item=>item.mode==='secure-dns'),secureDnsCapable:ready,hosts:Array.from(recent.values()),note:'secure-dns indica conexión a la IP DoH conservando Host/SNI. system-fallback usa DNS del TV. No se afirma DNS alterado sin comparación concluyente.'}),snapshot:()=>({available:ready,reason,engine:ready?'samsung-wasm-curl':'xhr-system-dns',hosts:Array.from(recent.values()),cooldownUntil:cooldown}),dispose:()=>{slots.forEach(item=>item.worker.terminate());while(queue.length)queue.shift().reject(new Error('Transporte cerrado'));}};
}
