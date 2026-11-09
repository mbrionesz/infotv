import {streamCandidates} from './stream-candidates.js';
// Retain renewed, host-specific credentials when a decoder is reopened later.
export function retainVodSources(candidates,fresh,currentIndex){
 const current=candidates[currentIndex];if(!current||!fresh?.url||new URL(current.url).pathname!==new URL(fresh.url).pathname)throw new Error('El archivo cambió al renovar el vídeo');
 const replacements=streamCandidates(fresh.url,fresh);
 for(let i=0;i<candidates.length;i++){
  const previous=new URL(candidates[i].url),match=replacements.find(entry=>{const next=new URL(entry.url);return previous.host===next.host&&previous.pathname===next.pathname;});
  if(match)Object.assign(candidates[i],match);
 }
 // The resolver may move the active file to another CDN. Only use the headers
 // belonging to that freshly returned URL, never another host's credentials.
 if(!replacements.some(entry=>new URL(entry.url).host===new URL(current.url).host))Object.assign(current,replacements[0]);
 return fresh;
}
