// Only remove invalid ASCII spaces at the end of a DNS hostname. Never decode
// or reserialize the path/query: they may carry a signed playback address.
export function repairPlaylistUri(uri){
 const match=/^(https?:\/\/|\/\/)([^/?#]+)([/?#]|$)/i.exec(uri);
 if(!match)return uri;
 const host=/^([a-z0-9.-]+)((?: |%20)+)(:\d{1,5})?$/i.exec(match[2]);
 if(!host||host[1].length>253||!host[1].includes('.')||host[1].split('.').some(label=>! /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)))return uri;
 const authority=host[1]+(host[3]||'');
 try{const parsed=new URL('https://'+authority);if(parsed.username||parsed.password)return uri;}catch(_){return uri;}
 return match[1]+authority+uri.slice(match[1].length+match[2].length);
}
export function playlistUris(text){
 let repaired=0;const hosts=new Set(),repairedHosts=new Set();
 if((text.match(/^#EXTM3U\s*$/gm)||[]).length!==1)return {data:text,facts:{repairedHostSpaces:0,uriHosts:[],repairedHosts:[]}};
 function visit(uri){
  const fixed=repairPlaylistUri(uri);
  try{const parsed=new URL(fixed.startsWith('//')?'https:'+fixed:fixed);if(/^https?:$/.test(parsed.protocol)&&!parsed.username&&!parsed.password){if(hosts.size<16)hosts.add(parsed.hostname);if(fixed!==uri&&repairedHosts.size<16)repairedHosts.add(parsed.hostname);}}catch(_){}
  if(fixed!==uri)repaired++;return fixed;
 }
 const data=text.replace(/[^\r\n]+/g,line=>{
  if(/^(?:https?:\/\/|\/\/)/i.test(line))return visit(line);
  if(/^#EXT-X-(?:KEY|SESSION-KEY|MAP|MEDIA|I-FRAME-STREAM-INF|PART|PRELOAD-HINT|RENDITION-REPORT|SESSION-DATA):/.test(line))return line.replace(/([:,])URI="([^"\r\n]*)"/g,(_all,prefix,uri)=>prefix+'URI="'+visit(uri)+'"');
  return line;
 });
 return {data,facts:{repairedHostSpaces:repaired,uriHosts:Array.from(hosts),repairedHosts:Array.from(repairedHosts)}};
}
