// Repair a sequence only when multiple segment identities prove the offset.
// URLs, encryption tags, discontinuity numbers and media bytes stay untouched.
const rotatingAuth=/^(token|sign|sign2|signature|expires|expire|hdnts|hdnea)$/i;
function identity(uri,base){
 const url=new URL(uri,base);for(const key of Array.from(url.searchParams.keys()))if(rotatingAuth.test(key))url.searchParams.delete(key);url.hash='';return url.href;
}
function parse(text,base){
 const tags=text.match(/^#EXT-X-MEDIA-SEQUENCE:[ \t]*(\d+)[ \t]*$/gm)||[];
 if(tags.length!==1||!/^#EXTM3U\s*$/m.test(text)||/#EXT-X-ENDLIST|#EXT-X-MAP:|#EXT-X-BYTERANGE|#EXT-X-SKIP|#EXT-X-PART:|#EXT-X-GAP/m.test(text))return null;
 const sequence=Number(tags[0].split(':')[1]);if(!Number.isSafeInteger(sequence))return null;
 const declared=Number((text.match(/^#EXT-X-DISCONTINUITY-SEQUENCE:[ \t]*(\d+)/m)||[])[1]||0);
 let cc=declared,duration=null,key='',safe=true;const segments=[];
 try{for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();if(!line)continue;
  if(line.startsWith('#EXTINF:')){duration=Number(line.slice(8).split(',')[0]);continue;}
  if(line==='#EXT-X-DISCONTINUITY'){cc++;continue;}
  if(line.startsWith('#EXT-X-KEY:')){
   if(/(?:^|,)METHOD=NONE(?:,|$)/.test(line.slice(11))){key='';continue;}
   // AES without an explicit IV derives it from the sequence: do not change it.
   if(!/(?:^|,)METHOD=AES-128(?:,|$)/.test(line.slice(11))||!/(?:^|,)IV=0x[0-9a-f]{32}(?:,|$)/i.test(line.slice(11)))safe=false;
   key=line;continue;
  }
  if(line[0]==='#')continue;
  if(!Number.isFinite(duration)||duration<=0)return null;
  segments.push({id:identity(line,base),duration,cc,key});duration=null;
 }}catch(_){return null;}
 if(!segments.length||new Set(segments.map(s=>s.id)).size!==segments.length)return null;
 return {sequence,segments,safe,tag:tags[0]};
}
export function createPlaylistContinuity(limit=300){
 const known=new Map();
 return {inspect(text,base){
  const parsed=parse(text,base);if(!parsed)return {data:text,changed:false,shared:0,reason:'unsupported-playlist',segments:[]};
  let offset=null,shared=0,previousIndex=-2,consecutive=false,conflict=false;
  parsed.segments.forEach((segment,i)=>{
   const old=known.get(segment.id);if(!old)return;
   shared++;if(previousIndex===i-1)consecutive=true;previousIndex=i;
   if(old.cc!==segment.cc||old.key!==segment.key||Math.abs(old.duration-segment.duration)>0.01)conflict=true;
   const candidate=old.sequence-i;if(offset!==null&&candidate!==offset)conflict=true;offset=candidate;
  });
  const proven=shared>=2&&consecutive&&!conflict&&Number.isSafeInteger(offset)&&offset>=0;
  const change=proven&&offset!==parsed.sequence;
  const blocked=change&&!parsed.safe||conflict;
  const effective=change&&!blocked?offset:parsed.sequence;
  return {data:change&&!blocked?text.replace(parsed.tag,'#EXT-X-MEDIA-SEQUENCE:'+effective):text,changed:change&&!blocked,shared,serverSequence:parsed.sequence,effectiveSequence:effective,reject:blocked,reason:blocked?'unsafe-segment-continuity':change?'shared-segments':shared?'insufficient-anchors':'no-shared-segments',segments:parsed.segments};
 },accept(proposal){
  if(proposal.reject)return;
  proposal.segments.forEach((segment,i)=>{known.delete(segment.id);known.set(segment.id,{...segment,sequence:proposal.effectiveSequence+i});});
  while(known.size>limit)known.delete(known.keys().next().value);
 },get size(){return known.size;}};
}
