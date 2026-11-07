import {httpsAlternative} from './stream-probe.js';
export const MAX_CDN_CANDIDATES=16;
export function streamCandidates(source,stream={}){
  const primary={url:source,headers:stream.headers||{}};
  const candidates=[primary],seen=new Set([source]);
  for(const entry of stream.backupUrls||[]){
    if(candidates.length>=MAX_CDN_CANDIDATES)break;
    const url=typeof entry==='string'?entry:entry&&entry.url;
    try{
      const parsed=new URL(url);if(!/^https?:$/.test(parsed.protocol)||parsed.username||parsed.password||seen.has(parsed.href))continue;
      const sameOrigin=parsed.origin===new URL(source).origin;
      const headers=typeof entry==='object'&&entry.headers||stream.headersByHost&&stream.headersByHost[parsed.host];
      // Never reuse another CDN's credentials just because a backup URL exists.
      if(!headers&&!sameOrigin&&Object.keys(primary.headers).length)continue;
      candidates.push({url:parsed.href,headers:headers||primary.headers});seen.add(parsed.href);
    }catch(_){}
  }
  return candidates;
}

// Try all supplied candidates before constructing optional HTTPS alternatives.
export function streamRoutes(candidates){
 const routes=candidates.map((item,index)=>Object.assign({},item,{cdnAttempt:index+1,httpsFallback:false}));
 const seen=new Set(routes.map(item=>item.url));
 candidates.forEach((item,index)=>{
  const url=httpsAlternative(item.url);if(url&&!seen.has(url)){seen.add(url);routes.push({url,headers:item.headers,cdnAttempt:index+1,httpsFallback:true});}
 });return routes;
}
