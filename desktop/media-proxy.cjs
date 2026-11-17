'use strict';
const http=require('node:http'),https=require('node:https'),crypto=require('node:crypto');
const {validateOptions}=require('./transport.cjs');
// One capability URL, bound only to loopback. Remote credentials never go to mpv's argv.
async function createMediaProxy({stream,resolver,modules={http,https},onAuthFailure=()=>{}}){
 let current=validateOptions(stream),closed=false,active=0;const token=crypto.randomBytes(24).toString('hex'),requests=new Set(),sockets=new Set(),subs=new Map();
 async function forward(target,headers,request,response,depth=0){
  if(depth>=5)throw Error('Demasiadas redirecciones');const address=await resolver.resolve(target.hostname);if(closed||response.destroyed)return;
  const upstream=(target.protocol==='https:'?modules.https:modules.http).request({protocol:target.protocol,hostname:target.hostname,servername:target.hostname,family:4,port:target.port||undefined,path:target.pathname+target.search,method:request.method,headers,rejectUnauthorized:true,agent:false,lookup:(_host,_options,callback)=>callback(null,address.ip,4)},remote=>{
   upstream.setTimeout(0); // Backpressure during a user pause is not a network failure.
   if([301,302,303,307,308].includes(remote.statusCode)&&remote.headers.location){const next=new URL(remote.headers.location,target);remote.resume();try{validateOptions({url:next.href});if(target.protocol==='https:'&&next.protocol!=='https:')throw Error('Redirección insegura');const safe=next.origin===target.origin?headers:{'Accept-Encoding':'identity',...(headers.Range?{Range:headers.Range}:{})};forward(next,safe,request,response,depth+1).catch(fail);}catch(_){fail();}return;}
   if([401,403,404,410].includes(remote.statusCode))onAuthFailure(remote.statusCode);
   const safe={};for(const key of ['content-type','content-length','content-range','accept-ranges'])if(remote.headers[key])safe[key]=remote.headers[key];safe['Cache-Control']='no-store';response.writeHead(remote.statusCode||502,safe);remote.on('error',()=>response.destroy());remote.pipe(response);
  });requests.add(upstream);upstream.setTimeout(15000,()=>upstream.destroy(Error('Tiempo de red agotado')));upstream.on('close',()=>requests.delete(upstream));upstream.on('error',fail);response.once('close',()=>upstream.destroy());upstream.end();
  function fail(){if(!response.headersSent)response.writeHead(502);response.end();}
 }
 const server=http.createServer(async(request,response)=>{if(closed||active>=4||!['GET','HEAD'].includes(request.method)){response.writeHead(503);response.end();return;}const path=request.url.split('?')[0];let source;
  if(path==='/'+token+'/media')source=current;else if(path.startsWith('/'+token+'/sub/'))source=subs.get(path.slice(('/'+token+'/sub/').length));
  if(!source){response.writeHead(404);response.end();return;}active++;response.once('close',()=>active--);
  const headers={...source.headers};if(request.headers.range&&/^bytes=\d+-\d*$/.test(request.headers.range))headers.Range=request.headers.range;
  try{await forward(source.url,headers,request,response);}catch(_){response.writeHead(502);response.end();}
 });server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const base='http://127.0.0.1:'+server.address().port+'/'+token;
 return {url:base+'/media',update(stream){current=validateOptions(stream);},subtitle(url){const id=crypto.randomBytes(12).toString('hex');subs.set(id,validateOptions({url}));while(subs.size>8)subs.delete(subs.keys().next().value);return base+'/sub/'+id;},close(){closed=true;requests.forEach(request=>request.destroy());sockets.forEach(socket=>socket.destroy());server.close();subs.clear();}};
}
module.exports={createMediaProxy};
