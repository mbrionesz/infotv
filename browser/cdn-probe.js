// An HTTP HEAD measures application connectivity, not ICMP RTT or media access.
export async function probeCdns(urls,transport,{xhrFactory=()=>new XMLHttpRequest(),now=()=>performance.now(),signal}={}){
 const origins=[];
 for(const value of urls){try{const u=new URL(value);if(!/^https?:$/.test(u.protocol)||u.username||u.password||origins.includes(u.origin))continue;origins.push(u.origin);if(origins.length===6)break;}catch(_){}}
 const results=[];
 for(const origin of origins){
  if(signal&&signal.aborted)break;
  const start=now();let response=null,engine='browser',error='';
  try{
   if(transport&&transport.snapshot().available){engine='samsung';response=await transport.request({url:origin+'/',method:'HEAD',timeout:3500,priority:'diagnostic',diagnostic:true,signal});}
   if(signal&&signal.aborted)break;
   if(!response){engine='browser';response=await new Promise((resolve,reject)=>{const x=xhrFactory();const off=signal?signal.subscribe(()=>{x.abort();reject(signal.error);}):()=>{};x.open('HEAD',origin+'/',true);x.timeout=3500;x.onload=()=>{off();resolve({status:x.status});};x.onerror=x.ontimeout=()=>{off();reject(new Error('Conexión no medible: red, TLS o CORS'));};x.send();});}
  }catch(_){if(signal&&signal.aborted)break;error='Conexión no medible: red, TLS o CORS';}
  results.push({host:new URL(origin).host,scheme:new URL(origin).protocol,engine,httpStatus:response&&response.status||0,elapsedMs:Math.round(now()-start),metrics:response&&response.metrics||null,state:response&&response.status?'HTTP respondió':'No medible',note:response&&response.status?'Respuesta HTTP; no valida la señal ni su licencia.':error});
 }
 return {cancelled:!!(signal&&signal.aborted),kind:'HTTP HEAD, no ICMP',checkedAt:new Date().toISOString(),results};
}
