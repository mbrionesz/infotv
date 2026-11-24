'use strict';
const https=require('node:https'),dns=require('node:dns'),net=require('node:net');
const providers=require('./resolvers.json');
function isPublic(ip){if(net.isIP(ip)!==4)return false;const [a,b]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19));}
function question(host){if(!/^(?=.{1,253}$)[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i.test(host))throw Error('Dominio inválido');const head=Buffer.alloc(12);head.writeUInt16BE(0x100,2);head.writeUInt16BE(1,4);return Buffer.concat([head,...host.split('.').map(label=>{if(label.length>63)throw Error('Dominio inválido');return Buffer.concat([Buffer.from([label.length]),Buffer.from(label)])}),Buffer.from([0,0,1,0,1])]);}
function answers(data){if(data.length<12||(data.readUInt16BE(2)&0x800f)!==0x8000)throw Error('DNS inválido');let offset=12;function skip(){for(let n=0;n<128;n++){if(offset>=data.length)throw Error('DNS truncado');const size=data[offset++];if(!size)return;if((size&0xc0)===0xc0){if(offset>=data.length)throw Error('DNS truncado');offset++;return;}if(size>63||offset+size>data.length)throw Error('DNS inválido');offset+=size;}throw Error('DNS inválido');}const count=data.readUInt16BE(4);if(count>8)throw Error('DNS inválido');for(let i=0;i<count;i++){skip();offset+=4;if(offset>data.length)throw Error('DNS truncado');}const ips=[];for(let i=0;i<Math.min(data.readUInt16BE(6),64);i++){skip();if(offset+10>data.length)throw Error('DNS truncado');const type=data.readUInt16BE(offset),klass=data.readUInt16BE(offset+2),length=data.readUInt16BE(offset+8);offset+=10;if(offset+length>data.length)throw Error('DNS truncado');if(type===1&&klass===1&&length===4){const ip=Array.from(data.subarray(offset,offset+4)).join('.');if(isPublic(ip)&&!ips.includes(ip))ips.push(ip);}offset+=length;}if(!ips.length)throw Error('Sin direcciones públicas');return ips;}
function createResolver({query=wireQuery,system=host=>dns.promises.lookup(host,{family:4}),now=Date.now,secureTimeoutMs=4000,systemTimeoutMs=3000,systemDelayMs=350}={}){
 const cache=new Map(),pending=new Map();let generation=0;
 function timeout(message){return Object.assign(Error(message),{code:'DNS_TIMEOUT'});}
 async function lookup(host){
  question(host);const controller=new AbortController();let secureTimer,systemTimer,hedgeTimer,startSystem;
  const systemGate=new Promise(resolve=>{startSystem=resolve;hedgeTimer=setTimeout(resolve,systemDelayMs);});
  const secure=Promise.race([
   Promise.any(providers.map(provider=>Promise.resolve().then(()=>query(provider,host,controller.signal)).then(ips=>{
    const publicIps=ips.filter(isPublic);if(!publicIps.length)throw Error('Sin direcciones públicas');
    return {ip:publicIps[0],ips:publicIps,resolver:provider.ip,mode:'secure-dns'};
   }))),
   new Promise((_,reject)=>{secureTimer=setTimeout(()=>reject(timeout('DNS seguro agotó su tiempo de espera')),secureTimeoutMs);})
  ]).catch(error=>{startSystem();throw error;});
  const fallback=systemGate.then(()=>Promise.race([
   Promise.resolve().then(()=>system(host)).then(answer=>{if(!isPublic(answer.address))throw Error('Dirección no pública');return {ip:answer.address,ips:[answer.address],mode:'system-fallback'};}),
   new Promise((_,reject)=>{systemTimer=setTimeout(()=>reject(timeout('DNS de Windows agotó su tiempo de espera')),systemTimeoutMs);})
  ]));
  try{return await Promise.any([secure,fallback]);}
  catch(_){throw Object.assign(Error('No se pudo resolver el servidor de vídeo o del portal'),{code:'DNS_UNAVAILABLE'});}
  finally{controller.abort();clearTimeout(secureTimer);clearTimeout(systemTimer);clearTimeout(hedgeTimer);}
 }
 async function resolve(host){
  if(net.isIP(host)){if(!isPublic(host))throw Error('Dirección no pública');return {ip:host,mode:'literal-ip'};}
  const hit=cache.get(host);if(hit&&hit.expires>now())return hit;
  if(pending.has(host))return pending.get(host);
  const epoch=generation,work=lookup(host).then(result=>{result.expires=now()+(result.mode==='secure-dns'?600000:60000);if(epoch===generation){cache.set(host,result);while(cache.size>64)cache.delete(cache.keys().next().value);}return result;});
  pending.set(host,work);try{return await work;}finally{if(pending.get(host)===work)pending.delete(host);}
 }
 return {resolve,clear(){generation++;cache.clear();pending.clear();},snapshot:()=>({cooldownUntil:0,hosts:Array.from(cache,([host,row])=>({host,mode:row.mode,resolver:row.resolver||'',ip:row.ip}))})};
}
function wireQuery(provider,host,signal){return new Promise((resolve,reject)=>{const body=question(host);const req=https.request({hostname:provider.host,servername:provider.host,family:4,port:443,path:provider.path,method:'POST',lookup:(_host,_opts,callback)=>callback(null,provider.ip,4),headers:{'Content-Type':'application/dns-message',Accept:'application/dns-message','Content-Length':body.length},rejectUnauthorized:true,signal,agent:false},res=>{let size=0;const chunks=[];res.on('data',chunk=>{size+=chunk.length;if(size>65536)req.destroy(Error('DNS demasiado grande'));else chunks.push(chunk);});res.on('error',reject);res.on('end',()=>{try{if(res.statusCode!==200)throw Error('DNS HTTP');resolve(answers(Buffer.concat(chunks)));}catch(error){reject(error);}});});const timer=setTimeout(()=>req.destroy(Error('DNS timeout')),5000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end(body);});}
module.exports={createResolver,isPublic,question,answers};
