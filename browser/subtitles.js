import {requestSignal} from './request-signal.js';
const LIMIT=1024*1024;
export function subtitleTime(value){const m=/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/.exec(String(value).trim().split(/\s/)[0]);if(!m||Number(m[3])>59||m[1]!==undefined&&Number(m[2])>59)return NaN;return Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3])+Number(((m[4]||'')+'000').slice(0,3))/1000;}
export function parseSubtitles(text){
 const cues=[];for(const block of String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split(/\n\s*\n/)){
  const lines=block.trim().split('\n');if(/^(NOTE|STYLE|REGION)(\s|$)/.test(lines[0]))continue;const at=lines.findIndex(line=>line.includes('-->'));if(at<0)continue;const times=lines[at].split('-->'),start=subtitleTime(times[0]),end=subtitleTime(times[1]);
  const value=lines.slice(at+1).join('\n').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[name]).trim().slice(0,4000);
  if(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&value)cues.push({start,end,text:value});if(cues.length>=10000)break;
 }return cues.sort((a,b)=>a.start-b.start);
}
export function loadSubtitles(track,{transport=window.XuperNativeTransport}={}){
 const signal=requestSignal();let xhr=null;
 const promise=(async()=>{
  const url=new URL(track.url,document.baseURI);if(!/^https?:$/.test(url.protocol)||url.username||url.password)throw new Error('URL de subtítulos no válida');
  if(transport&&transport.ensure)await transport.ensure();if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  let result;if(transport&&transport.snapshot().available)result=await transport.request({url:url.href,headers:{},signal,priority:'background',timeout:8000});
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  if(!result)result=await new Promise((resolve,reject)=>{xhr=new XMLHttpRequest();xhr.open('GET',url.href,true);xhr.responseType='arraybuffer';xhr.timeout=8000;xhr.onprogress=e=>{if(e.loaded>LIMIT){reject(new Error('Subtítulos demasiado grandes'));xhr.abort();}};xhr.onload=()=>resolve({status:xhr.status,body:xhr.response});xhr.onerror=()=>reject(new Error('No se pudo conectar a los subtítulos'));xhr.ontimeout=()=>reject(new Error('El servidor de subtítulos tardó demasiado'));xhr.onabort=()=>reject(new DOMException('Cancelled','AbortError'));xhr.send();});
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');if(!result||result.status<200||result.status>=300)throw new Error('Error HTTP '+(result&&result.status||0)+' en subtítulos');
  if(!result.body||result.body.byteLength>LIMIT)throw new Error('Subtítulos vacíos o demasiado grandes');const cues=parseSubtitles(new TextDecoder().decode(result.body));if(!cues.length)throw new Error('El archivo no contiene subtítulos SRT/WebVTT válidos');return cues;
 })();return {promise,cancel(){signal.abort();if(xhr)xhr.abort();}};
}
