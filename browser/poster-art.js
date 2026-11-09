export function posterCandidates(item={},wide=false){
 const extra=Array.isArray(item.posterAlternates)?item.posterAlternates:[];
 const values=wide?[item.landscape,item.backdrop,item.poster,...extra]:[item.poster,...extra,item.landscape,item.backdrop];
 const result=[];for(const value of values){const url=String(value||'').trim();if(!url||url.length>4000||/[\r\n\0]/.test(url)||/placeholder|placehoder/i.test(url)||result.includes(url))continue;
  if(/^assets\/[a-z0-9_./% -]+$/i.test(url)&&!url.includes('..'))result.push(url);
  else try{const parsed=new URL(url);if(/^https?:$/.test(parsed.protocol)&&!parsed.username&&!parsed.password)result.push(url);}catch(_){}
  if(result.length===6)break;
 }return result;
}
export function preparePoster(image,item,wide=false){const urls=posterCandidates(item,wide);image.dataset.posterCandidates=JSON.stringify(urls);if(urls.length)image.dataset.poster=urls[0];return urls;}
export function createPosterFrame(item){const frame=document.createElement('div');frame.className='xt-poster-frame';const placeholder=document.createElement('span');placeholder.className='xt-poster-placeholder';placeholder.setAttribute('aria-hidden','true');placeholder.textContent=String(item.title||'X').slice(0,1).toUpperCase();frame.appendChild(placeholder);const image=document.createElement('img');image.alt='';image.decoding='async';preparePoster(image,item);frame.appendChild(image);return {frame,image};}
export function installPosterLoader(core,window){
 const urls=[];
 function loadPoster(image,url){
  let candidates;try{candidates=JSON.parse(image.dataset.posterCandidates||'null');}catch(_){}if(!Array.isArray(candidates)||!candidates.length)candidates=posterCandidates({poster:url});
  if(!candidates.length)return;const key=candidates.join('\n');let state=image.__xuperArt;
  if(state&&state.key===key&&(state.pending||image.getAttribute('src')))return;
  const generation=(state&&state.generation||0)+1;state={key,generation,candidates,index:0,pending:false};image.__xuperArt=state;
  image.classList.remove('is-loaded');if(image.parentElement?.classList.contains('xt-poster-frame'))image.parentElement.classList.remove('has-art');image.removeAttribute('src');
  if(!image.__xuperArtBound){image.__xuperArtBound=true;image.addEventListener('load',()=>{if(!image.naturalWidth)return next(image);image.classList.add('is-loaded');if(image.parentElement?.classList.contains('xt-poster-frame'))image.parentElement.classList.add('has-art');});image.addEventListener('error',()=>next(image));}
  fetch(image,state);
 }
 function next(image){const state=image.__xuperArt;if(!state||state.pending)return;state.index++;image.classList.remove('is-loaded');if(state.index>=state.candidates.length){image.removeAttribute('src');image.parentElement?.classList.remove('has-art');return;}fetch(image,state);}
 function fetch(image,state){state.pending=true;const candidate=state.candidates[state.index],index=state.index;core.poster(candidate,(error,result)=>{if(!image.isConnected||image.__xuperArt!==state||state.index!==index)return;state.pending=false;if(error||!result?.blob){image.src=candidate;return;}const local=window.URL.createObjectURL(result.blob);urls.push(local);image.src=local;if(urls.length>80)window.URL.revokeObjectURL(urls.shift());});}
 return {load:loadPoster,dispose(){urls.forEach(url=>window.URL.revokeObjectURL(url));urls.length=0;}};
}
