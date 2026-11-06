const publicList=(id,name,path)=>({id:'m3u:'+id,name:'M3U · '+name,url:'https://iptv-org.github.io/iptv/'+path+'.m3u'});
export const addonPresets=[
 publicList('cl','Chile','countries/cl'),publicList('ar','Argentina','countries/ar'),publicList('co','Colombia','countries/co'),
 publicList('mx','México','countries/mx'),publicList('pe','Perú','countries/pe'),publicList('uy','Uruguay','countries/uy'),
 publicList('es','España','countries/es'),publicList('spa','En español','languages/spa'),publicList('sports','Deportes','categories/sports'),
 publicList('movies','Cine','categories/movies'),publicList('news','Noticias','categories/news'),publicList('music','Música','categories/music'),publicList('kids','Infantil','categories/kids')
];
export function playlistUrl(value,base){
 const url=new URL(String(value).trim(),base);if(!/^https?:$/.test(url.protocol)||url.username||url.password)throw new Error('Usa una URL HTTP o HTTPS sin usuario y contraseña en el dominio.');return url.href;
}
export function addonId(value){let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return (hash>>>0).toString(16);}
export function parsePlaylist(text,source){
 if(text.length>8*1024*1024)throw new Error('Lista mayor de 8 MB.');
 if(!/^\s*#EXTM3U/i.test(text.replace(/^\uFEFF/,''))||/#EXT-X-(?:TARGETDURATION|STREAM-INF|MEDIA-SEQUENCE):/i.test(text))throw new Error('La URL debe contener una lista de canales M3U, no una señal HLS.');
 const rows=[],seen=new Set();let pending=null;
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();
  if(line.startsWith('#EXTINF:')){
   const match=line.match(/^#EXTINF:(?:[^,"']|"[^"]*"|'[^']*')*,(.*)$/);const attr=name=>{const m=line.match(new RegExp(name+'=["\']([^"\']*)["\']','i'));return m?m[1]:'';};
   pending={name:match&&match[1].trim()||attr('tvg-name')||'Canal',group:attr('group-title')||'Otros',logo:attr('tvg-logo')};
  }else if(line.startsWith('#EXTGRP:')&&pending)pending.group=line.slice(8).trim()||'Otros';
  else if(line&&!line.startsWith('#')&&pending){
   try{const url=playlistUrl(line,source);if(!seen.has(url)){seen.add(url);rows.push(Object.assign(pending,{url,streamUrl:url,channelCode:'m3u_'+addonId(source+'\n'+url),index:rows.length+1,isAddon:true,now:pending.group}));}}catch(_){}pending=null;
   if(rows.length>=10000)break;
  }
 }
 if(!rows.length)throw new Error('No se encontraron canales HTTP(S) en esta lista.');return rows;
}
export function savedAddons(storage){try{const values=JSON.parse(storage.getItem('xuper.m3uLists')||'[]');return (Array.isArray(values)?values:[]).slice(0,20).map(item=>({id:'m3u:custom:'+addonId(playlistUrl(item.url)),name:String(item.name||'M3U personalizada').slice(0,70),url:playlistUrl(item.url),custom:true}));}catch(_){return [];}}

export const playlistMime=url=>/\.(?:ts|mp4|m4v|webm|mkv)(?:[?#]|$)/i.test(url)?'':'application/vnd.apple.mpegurl';
