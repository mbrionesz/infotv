// User-triggered application network measurements. No ICMP or Wi-Fi link-rate claim.
export async function measureInternet({xhrFactory=()=>new XMLHttpRequest(),now=()=>performance.now(),signal}={}){
 const endpoint='https://speed.cloudflare.com/__down',samples=[];
 async function download(bytes){
  if(signal?.aborted)throw signal.error;
  return new Promise((resolve,reject)=>{
   const xhr=xhrFactory(),start=now();let settled=false,firstByte=null;
   const finish=(error)=>{if(settled)return;settled=true;off();if(error){reject(error);return;}const received=xhr.response?.byteLength||0;resolve({bytes:received,elapsedMs:Math.max(1,now()-start),transferMs:firstByte===null?0:Math.max(1,now()-firstByte)});};
   let off=()=>{};off=signal?signal.subscribe(()=>{finish(signal.error||new Error('Cancelado'));xhr.abort();}):off;
   xhr.open('GET',endpoint+'?bytes='+bytes+'&xt='+Date.now(),true);xhr.timeout=12000;xhr.responseType='arraybuffer';
   xhr.onprogress=()=>{if(firstByte===null)firstByte=now();};
   xhr.onload=()=>finish(xhr.status>=200&&xhr.status<300?null:new Error('HTTP '+xhr.status));
   xhr.onerror=()=>finish(new Error('No medible: red, TLS o CORS'));xhr.ontimeout=()=>finish(new Error('La prueba superó 12 segundos'));xhr.onabort=()=>finish(new Error('Cancelado'));
   xhr.send();
  });
 }
 for(let i=0;i<3;i++)samples.push((await download(0)).elapsedMs);
 const result=await download(4*1024*1024);
 if(result.bytes<1024*1024)throw new Error('Respuesta incompleta para medir descarga');
 const sorted=samples.slice().sort((a,b)=>a-b);
 return {kind:'HTTP, no ICMP',endpoint:'speed.cloudflare.com',latencyMs:Math.round(sorted[1]),jitterMs:Math.round(Math.max(...samples)-Math.min(...samples)),downloadMbps:Math.round(result.bytes*8/result.elapsedMs/1000*10)/10,bytes:result.bytes,samples:samples.map(Math.round),checkedAt:new Date().toISOString(),note:'Estimación de descarga de 4 MiB hacia Cloudflare; incluye conexión y puede variar. No mide la velocidad del enlace Wi-Fi ni la señal del canal.'};
}
