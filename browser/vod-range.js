import {requestSignal} from './request-signal.js';
export const VOD_CHUNK=512*1024;
export function validateRange(status,headers,body,start,limit){
 const data=body instanceof ArrayBuffer?body:body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength);
 const match=/^content-range:\s*bytes\s+(\d+)-(\d+)\/(\d+)/im.exec(headers||'');
 if(status===206&&match){const from=Number(match[1]),to=Number(match[2]),total=Number(match[3]);if(!Number.isSafeInteger(total)||from!==start||to<from||to>=total||data.byteLength!==to-from+1||data.byteLength>limit)throw new Error('El servidor devolvió un rango de vídeo inválido');return {data,total};}
 if(status===206)throw Object.assign(new Error('HTTP 206 sin Content-Range válido; no se puede posicionar el vídeo'),{status});
 if(status===200&&start===0&&data.byteLength<=limit)return {data,total:data.byteLength};
 throw Object.assign(new Error(status===200?'El servidor no admite lectura de vídeo por bloques':'Error HTTP '+status+' al leer vídeo'),{status});
}
export function createVodReader(url,headers={},onRead=()=>{},refreshSource){
 let signal=null,xhr=null,closed=false,epoch=0,fileTotal=null;
 function abort(){epoch++;if(signal)signal.abort();if(xhr)xhr.abort();signal=xhr=null;}
 async function readOnce(start,length=VOD_CHUNK){
  if(closed)throw new DOMException('Closed','AbortError');
  const readStarted=performance.now();
  const requestHeaders=Object.assign({},headers,{Range:'bytes='+start+'-'+(start+length-1)});signal=requestSignal();const own=signal;
  let result;
  const transport=window.XuperNativeTransport;
  if(transport&&transport.snapshot().available)result=await transport.request({url,headers:requestHeaders,signal:own,priority:'playback',timeout:12000});
  if(closed||own.aborted)throw new DOMException('Cancelled','AbortError');
  if(!result){onRead({status:0,bytes:0,fallback:'xhr-system-dns'});result=await new Promise((resolve,reject)=>{const request=new XMLHttpRequest();xhr=request;request.open('GET',url,true);request.responseType='arraybuffer';request.timeout=12000;for(const key of Object.keys(requestHeaders))if(!/^(host|user-agent|content-length|cookie|origin|referer|connection|accept-encoding)$/i.test(key))request.setRequestHeader(key,requestHeaders[key]);request.onprogress=e=>{if(e.loaded>length){request.abort();reject(new Error('Respuesta de vídeo demasiado grande'));}};request.onload=()=>resolve({status:request.status,headers:request.getAllResponseHeaders(),body:request.response});request.onerror=()=>reject(new Error('No se pudo conectar al vídeo (HTTP/TLS/CORS)'));request.ontimeout=()=>reject(new Error('El servidor de vídeo tardó demasiado'));request.onabort=()=>reject(new DOMException('Cancelled','AbortError'));request.send();});}
  if(closed||own.aborted)throw new DOMException('Cancelled','AbortError');
  if(!result||!result.body)throw Object.assign(new Error('Respuesta HTTP '+(result?result.status:0)+' sin vídeo'),{status:result?result.status:0});
  let value;
  try{value=validateRange(result.status,result.headers,result.body,start,length);}
  catch(error){onRead({status:result.status,bytes:0});throw error;}
  if(fileTotal!==null&&fileTotal!==value.total)throw Object.assign(new Error('El archivo cambió durante la reproducción'),{permanent:true});fileTotal=value.total;
  onRead({status:result.status,bytes:value.data.byteLength,total:value.total,elapsedMs:Math.round(performance.now()-readStarted),throughputKbps:Math.round(value.data.byteLength*8/Math.max(1,performance.now()-readStarted))});return value;
 }
 async function read(start,length=VOD_CHUNK){const run=epoch;let renewed=false;for(let attempt=0;attempt<3;attempt++){try{if(run!==epoch)throw new DOMException('Cancelled','AbortError');return await readOnce(start,length);}catch(error){if(closed||error.name==='AbortError'||error.permanent)throw error;
  if(!renewed&&typeof refreshSource==='function'&&[401,403,404,410].includes(error.status)){renewed=true;const fresh=await refreshSource();if(closed||run!==epoch)throw new DOMException('Cancelled','AbortError');if(!fresh||new URL(fresh.url).pathname!==new URL(url).pathname)throw new Error('El archivo cambió al renovar el vídeo');url=fresh.url;headers=fresh.headers||{};onRead({status:error.status,bytes:0,renewed:true});continue;}
  if(attempt>=1||error.status&&error.status<500&&error.status!==408&&error.status!==429)throw error;onRead({status:error.status||0,bytes:0,retry:1});await new Promise(resolve=>setTimeout(resolve,150));}}}

 return {read,abort,close(){closed=true;abort();}};
}
