'use strict';
const http=require('node:http'),https=require('node:https'),crypto=require('node:crypto');
const {validateOptions}=require('./transport.cjs');
function mediaSources(stream){
 const first=validateOptions(stream),sources=[first],seen=new Set([first.url.href]);
 for(const entry of stream.backupUrls||[]){
  if(sources.length>=3)break;
  try{
   const url=new URL(typeof entry==='string'?entry:entry.url),same=url.origin===first.url.origin;
   // Only portal-supplied credentials belonging to this origin may be forwarded.
   const headers=typeof entry==='object'&&entry.headers||stream.headersByHost?.[url.host];
   if(!same&&!headers&&Object.keys(stream.headers||{}).length)continue;
   const next=validateOptions({url:url.href,headers:headers||stream.headers||{}});
   if(seen.has(next.url.href))continue;sources.push(next);seen.add(next.url.href);
  }catch(_){}
 }
 return sources;
}
// One capability URL, bound only to loopback. Remote credentials never go to mpv's argv.
async function createMediaProxy({stream,resolver,modules={http,https},onAuthFailure=()=>{}}){
 let sources=mediaSources(stream),selected=0,generation=0,closed=false,active=0,operation=0;
 const telemetry={phase:'idle',localRequests:0,localStatus:0,httpStatus:0,bytes:0,lastDataAt:0,error:'',host:sources[0].url.hostname,sourceAttempt:1,sourceCount:sources.length};
 const token=crypto.randomBytes(24).toString('hex'),requests=new Set(),sockets=new Set(),subs=new Map();
 async function forward(target,headers,request,response,context,depth=0){
  if(depth>=5)throw Object.assign(Error('Demasiadas redirecciones'),{code:'REDIRECT_LIMIT'});
  const live=()=>!closed&&context.generation===generation&&!response.destroyed;
  const track=()=>live()&&context.media&&context.operation===operation;
  if(track()){telemetry.phase='dns';telemetry.host=target.hostname;}
  const started=Date.now(),address=await resolver.resolve(target.hostname);
  if(!live()){response.destroy();return;}
  if(track()){telemetry.phase='connecting';telemetry.dnsMs=Date.now()-started;telemetry.dnsMode=address.mode||'';}
  return new Promise((resolve,reject)=>{
   let upstream;
   const fail=error=>reject(error);
   upstream=(target.protocol==='https:'?modules.https:modules.http).request({protocol:target.protocol,hostname:target.hostname,servername:target.hostname,family:4,port:target.port||undefined,path:target.pathname+target.search,method:request.method,headers,rejectUnauthorized:true,agent:false,lookup:(_host,_options,callback)=>callback(null,address.ip,4)},remote=>{
    if(!live()){remote.destroy();resolve();return;}
    upstream.setTimeout(0); // Pausing/backpressure is not a network timeout.
    if([301,302,303,307,308].includes(remote.statusCode)&&remote.headers.location){
     remote.resume();
     try{
      const next=new URL(remote.headers.location,target);validateOptions({url:next.href});
      if(target.protocol==='https:'&&next.protocol!=='https:')throw Object.assign(Error('Redirección insegura'),{code:'INSECURE_REDIRECT'});
      const safe=next.origin===target.origin?headers:{'Accept-Encoding':'identity',...(headers.Range?{Range:headers.Range}:{})};
      forward(next,safe,request,response,context,depth+1).then(resolve,reject);
     }catch(error){reject(error);}return;
    }
    // Try a supplied mirror only before committing headers/body to the decoder.
    if(remote.statusCode>=500){remote.resume();reject(Object.assign(Error('Servidor de vídeo no disponible'),{code:'UPSTREAM_HTTP_'+remote.statusCode}));return;}
    if(track()){telemetry.localStatus=remote.statusCode||0;telemetry.httpStatus=remote.statusCode||0;telemetry.phase='http-response';telemetry.error='';}
    if(track()&&[401,403,404,410].includes(remote.statusCode))onAuthFailure(remote.statusCode);
    const safe={};for(const key of ['content-type','content-length','content-range','accept-ranges'])if(remote.headers[key])safe[key]=remote.headers[key];
    safe['Cache-Control']='no-store';response.writeHead(remote.statusCode||502,safe);
    remote.on('data',chunk=>{if(live()&&context.media){telemetry.bytes+=chunk.length;telemetry.lastDataAt=Date.now();if(track())telemetry.phase='receiving';}});
    remote.on('error',error=>{if(track())telemetry.error=error.code||'STREAM_ERROR';response.destroy();});
    remote.pipe(response);resolve();
   });
   requests.add(upstream);upstream.setTimeout(10000,()=>upstream.destroy(Object.assign(Error('Tiempo de red agotado'),{code:'NETWORK_TIMEOUT'})));
   upstream.on('close',()=>requests.delete(upstream));upstream.on('error',fail);response.once('close',()=>upstream.destroy());upstream.end();
  });
 }
 const server=http.createServer(async(request,response)=>{
  telemetry.localRequests++;
  if(closed||active>=4||!['GET','HEAD'].includes(request.method)){response.writeHead(503);response.end();return;}
  const path=request.url.split('?')[0],media=path==='/'+token+'/media';let source;
  if(media)source=sources[selected];else if(path.startsWith('/'+token+'/sub/'))source=subs.get(path.slice(('/'+token+'/sub/').length));
  if(!source){response.writeHead(404);response.end();return;}
  active++;response.once('close',()=>active--);
  const context={media,generation,operation:media?++operation:operation},choices=media?[...sources.slice(selected),...sources.slice(0,selected)]:[source];let lastError;
  for(const candidate of choices){
   if(closed||response.destroyed||context.generation!==generation){response.destroy();return;}
   const headers={...candidate.headers};if(request.headers.range&&/^bytes=\d+-\d*$/.test(request.headers.range))headers.Range=request.headers.range;
   if(media&&context.operation===operation){telemetry.sourceAttempt=sources.indexOf(candidate)+1;telemetry.error='';}
   try{await forward(candidate.url,headers,request,response,context);if(media&&context.generation===generation)selected=sources.indexOf(candidate);return;}
   catch(error){lastError=error;if(response.headersSent||response.destroyed)return;}
  }
  if(media&&context.operation===operation&&context.generation===generation){telemetry.phase='network-error';telemetry.error=lastError?.code||'DNS_OR_NETWORK';telemetry.localStatus=502;}
  if(!response.headersSent)response.writeHead(502);response.end();
 });
 server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const base='http://127.0.0.1:'+server.address().port+'/'+token;
 return {url:base+'/media',snapshot:()=>({...telemetry}),update(stream){
  const next=mediaSources(stream);generation++;sources=next;selected=0;requests.forEach(request=>request.destroy());
  Object.assign(telemetry,{phase:'idle',localRequests:0,localStatus:0,httpStatus:0,bytes:0,lastDataAt:0,error:'',host:sources[0].url.hostname,sourceAttempt:1,sourceCount:sources.length,dnsMs:null,dnsMode:''});
 },subtitle(url){const id=crypto.randomBytes(12).toString('hex');subs.set(id,validateOptions({url}));while(subs.size>8)subs.delete(subs.keys().next().value);return base+'/sub/'+id;},close(){closed=true;generation++;requests.forEach(request=>request.destroy());sockets.forEach(socket=>socket.destroy());server.close();subs.clear();}};
}
module.exports={createMediaProxy,mediaSources};
