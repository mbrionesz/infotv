import network from './network.js';
import {playlistUrl,parsePlaylist} from './addons.js';
export function fetchPlaylist(input){
 const first=playlistUrl(input);
 return new Promise((resolve,reject)=>{
  let finished=false,current;const timer=setTimeout(()=>end(new Error('Tiempo agotado al descargar la lista M3U.')),15000);
  function end(error,value){if(finished)return;finished=true;clearTimeout(timer);if(error&&current)current.abort();error?reject(error):resolve(value);}
  function load(url,hops=0){
   if(hops>4)return end(new Error('Demasiadas redirecciones de la lista M3U.'));
   current=network.get(url,response=>{
    if(finished)return;
    if([301,302,303,307,308].includes(response.statusCode)&&response.headers.location){
     try{const next=playlistUrl(response.headers.location,url);if(url.startsWith('https:')&&!next.startsWith('https:'))throw new Error('Redirección HTTPS insegura.');load(next,hops+1);}catch(error){end(error);}return;
    }
    if(response.statusCode!==200)return end(new Error('HTTP '+response.statusCode+' al descargar la lista M3U.'));
    let text='',bytes=0;response.on('data',chunk=>{bytes+=chunk.length;if(bytes>8*1024*1024)return end(new Error('Lista mayor de 8 MB.'));text+=chunk.toString('utf8');});
    response.on('error',end);response.on('end',()=>{if(finished)return;try{end(null,parsePlaylist(text,url));}catch(error){end(error);}});
   });current.on('error',end);current.setTimeout(15000,()=>end(new Error('Tiempo agotado al descargar la lista M3U.')));
  }
  load(first);
 });
}
