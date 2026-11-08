// Browser-safe DoH diagnostics. Results do NOT override the browser/AVPlay DNS.
export const resolverEndpoints=[
  {
    "ip": "1.1.1.1",
    "host": "cloudflare-dns.com",
    "path": "/dns-query",
    "provider": "Cloudflare"
  },
  {
    "ip": "1.0.0.1",
    "host": "cloudflare-dns.com",
    "path": "/dns-query",
    "provider": "Cloudflare"
  },
  {
    "ip": "8.8.8.8",
    "host": "dns.google",
    "path": "/dns-query",
    "provider": "Google"
  },
  {
    "ip": "8.8.4.4",
    "host": "dns.google",
    "path": "/dns-query",
    "provider": "Google"
  },
  {
    "ip": "94.140.14.14",
    "host": "dns.adguard-dns.com",
    "path": "/dns-query",
    "provider": "AdGuard"
  },
  {
    "ip": "94.140.15.15",
    "host": "dns.adguard-dns.com",
    "path": "/dns-query",
    "provider": "AdGuard"
  },
  {
    "ip": "9.9.9.9",
    "host": "dns.quad9.net",
    "path": "/dns-query",
    "provider": "Quad9"
  },
  {
    "ip": "149.112.112.112",
    "host": "dns.quad9.net",
    "path": "/dns-query",
    "provider": "Quad9"
  },
  {
    "ip": "45.90.28.0",
    "host": "dns.nextdns.io",
    "path": "/dns-query",
    "provider": "NextDNS"
  },
  {
    "ip": "45.90.30.0",
    "host": "dns.nextdns.io",
    "path": "/dns-query",
    "provider": "NextDNS"
  },
  {
    "ip": "76.76.2.0",
    "host": "freedns.controld.com",
    "path": "/p0",
    "provider": "Control D"
  },
  {
    "ip": "76.76.10.0",
    "host": "freedns.controld.com",
    "path": "/p0",
    "provider": "Control D"
  },
  {
    "ip": "223.5.5.5",
    "host": "dns.alidns.com",
    "path": "/dns-query",
    "provider": "AliDNS"
  },
  {
    "ip": "223.6.6.6",
    "host": "dns.alidns.com",
    "path": "/dns-query",
    "provider": "AliDNS"
  }
];
export const resolvers=resolverEndpoints.map(item=>item.ip);
export function dnsQuestion(host){
  const name=String(host).toLowerCase().replace(/\.$/,'');
  if(name.length>253||!name.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))throw new Error('Dominio inválido');
  const bytes=[0,0,1,0,0,1,0,0,0,0,0,0];
  for(const label of name.split('.'))bytes.push(label.length,...Array.from(label,c=>c.charCodeAt(0)));
  return new Uint8Array([...bytes,0,0,1,0,1]);
}
export function dnsAnswers(buffer,question){
  const bytes=new Uint8Array(buffer),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  function word(offset){if(offset+2>bytes.length)throw new Error('DNS truncado');return view.getUint16(offset);}
  if(bytes.length<12||word(0)!==0||(word(2)&0x800f)!==0x8000||(word(2)&0x0200)||word(4)!==1)throw new Error('Respuesta DNS inválida');
  if(!question||bytes.length<question.length||!question.slice(12).every((value,i)=>value===bytes[i+12]))throw new Error('Pregunta DNS distinta');
  let offset=question.length,ttl=600;const ips=[];const count=word(6);if(count>128)throw new Error('Respuesta DNS excesiva');
  function skipName(){
    for(let steps=0;steps<128;steps++){
      if(offset>=bytes.length)throw new Error('Nombre DNS truncado');const length=bytes[offset++];
      if(length===0)return;
      if((length&0xc0)===0xc0){if(offset>=bytes.length)throw new Error('Puntero truncado');offset++;return;}
      if(length>63||offset+length>bytes.length)throw new Error('Nombre DNS inválido');offset+=length;
    }
    throw new Error('Nombre DNS excesivo');
  }
  for(let i=0;i<count;i++){
    skipName();const type=word(offset),kind=word(offset+2),length=word(offset+8);
    if(offset+10+length>bytes.length)throw new Error('Registro DNS truncado');
    if(type===1&&kind===1&&length===4){ttl=Math.min(ttl,view.getUint32(offset+4));ips.push(Array.from(bytes.slice(offset+10,offset+14)).join('.'));}
    offset+=10+length;
  }
  if(!ips.length)throw new Error('Sin respuesta IPv4');
  return {ips:Array.from(new Set(ips)),ttl};
}
export function queryDoh(ip,question,timeout){
  let xhr;
  const promise=new Promise((resolve,reject)=>{
    xhr=new XMLHttpRequest();let encoded='';for(const value of question)encoded+=String.fromCharCode(value);
    // TLS identity is the IP origin: the browser must validate its certificate.
    // No forged Host/SNI, TLS bypass, fallback to HTTP or external proxy.
    const endpoint=resolverEndpoints.find(item=>item.ip===ip);
    xhr.open('GET','https://'+ip+(endpoint?endpoint.path:'/dns-query')+'?dns='+btoa(encoded).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),true);
    xhr.responseType='arraybuffer';xhr.timeout=timeout;xhr.setRequestHeader('Accept','application/dns-message');
    xhr.onerror=xhr.ontimeout=xhr.onabort=()=>reject(new Error('DoH no accesible: red, TLS o CORS'));
    xhr.onload=()=>{try{if(xhr.status!==200||!xhr.response||xhr.response.byteLength>65535)throw new Error('Respuesta DoH inválida');resolve(dnsAnswers(xhr.response,question));}catch(error){reject(error);}};
    xhr.send();
  });
  return {promise,cancel:()=>xhr&&xhr.abort()};
}
export function createDnsDiagnostic({query=queryDoh,now=Date.now,timeout=5000}={}){
  const cache=new Map(),inflight=new Map();let cooldown=0;
  function lookup(host){
    let question;try{question=dnsQuestion(host);}catch(error){return Promise.reject(error);}
    const key=String(host).toLowerCase(),hit=cache.get(key);
    if(hit&&hit.expires>now())return Promise.resolve(Object.assign({},hit.result,{cached:true}));
    if(inflight.has(key))return inflight.get(key);
    if(cooldown>now())return Promise.resolve({host:key,status:'cooldown',ips:[],routing:'system-dns',retryAfterMs:cooldown-now()});
    const start=now();
    const work=new Promise(resolve=>{
      let done=false,failed=0;const jobs=[];
      const finish=result=>{if(done)return;done=true;clearTimeout(timer);jobs.forEach(job=>job.cancel());resolve(result);};
      const failure=()=>{if(++failed===resolvers.length){cooldown=now()+300000;finish({host:key,status:'unavailable',ips:[],routing:'system-dns'});}};
      const timer=setTimeout(()=>{cooldown=now()+300000;finish({host:key,status:'unavailable',ips:[],routing:'system-dns'});},timeout);
      for(const ip of resolvers){
        try{
          const job=query(ip,question,timeout);jobs.push(job);
          job.promise.then(answer=>{
            if(done)return;if(!answer.ips||!answer.ips.length){failure();return;}
            cooldown=0;const result={host:key,status:'answered',ips:answer.ips,resolver:ip,ms:now()-start,routing:'system-dns'};
            cache.delete(key);cache.set(key,{result,expires:now()+Math.min(600,Math.max(0,answer.ttl||0))*1000});
            if(cache.size>64)cache.delete(cache.keys().next().value);finish(result);
          },()=>{if(!done)failure();});
        }catch(_){failure();}
      }
    });
    inflight.set(key,work);work.then(()=>inflight.delete(key));return work;
  }
  return {lookup};
}
