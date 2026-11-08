import CryptoJS from 'crypto-js/core.js';
import SHA256 from 'crypto-js/sha256.js';
import 'crypto-js/lib-typedarrays.js';
export function createTsSeekState(saved,onChange=()=>{},resource=''){
 let fingerprint='',total=0,base=null,observedBase=false,verified=false,published=false;
 const points=new Map(),table={times:[],filepositions:[]};
 const hint=saved&&saved.version===1&&/^[a-f0-9]{64}$/.test(saved.fingerprint||'')&&Number.isSafeInteger(saved.total)&&saved.total>0&&Number.isSafeInteger(saved.filePosition)&&saved.filePosition>=0&&saved.filePosition<saved.total&&Number.isFinite(saved.dts)&&Number.isFinite(saved.base)&&Number.isFinite(saved.position)&&saved.position>=0?saved:null;
 function rebuild(){const list=Array.from(points.values()).sort((a,b)=>a.dts-b.dts);table.times.length=table.filepositions.length=0;for(const point of list){const time=point.dts-base;if(time>=0&&(table.times.length===0||time>table.times[table.times.length-1])){table.times.push(time);table.filepositions.push(point.filePosition);}}}
 function identify(data,size){if(fingerprint)return;total=size;fingerprint=SHA256(CryptoJS.lib.WordArray.create(new Uint8Array(data,0,Math.min(data.byteLength,65536))).concat(CryptoJS.enc.Utf8.parse(resource))).toString();verified=!!(hint&&hint.fingerprint===fingerprint&&hint.total===total);if(verified){base=hint.base;points.set(hint.filePosition,{filePosition:hint.filePosition,dts:hint.dts});rebuild();}onChange(snapshot());}
 function observe(audio,video){
  let changed=false;const first=[audio&&audio.samples&&audio.samples[0],video&&video.samples&&video.samples[0]].filter(Boolean);
  if(!observedBase&&first.length){base=Math.min(...first.map(sample=>sample.dts));observedBase=true;changed=true;}
  for(const sample of video&&video.samples||[]){if(sample.isKeyframe&&Number.isSafeInteger(sample.file_position)&&sample.file_position>=0&&sample.file_position<total&&Number.isFinite(sample.dts)){if(!points.has(sample.file_position)){points.set(sample.file_position,{filePosition:sample.file_position,dts:sample.dts});changed=true;}}}
  while(points.size>4096)points.delete(points.keys().next().value);if(changed&&base!==null){rebuild();if(published)onChange(snapshot());}
 }
 function attach(info){if(table.times.length>=2){info.hasKeyframesIndex=true;info.keyframesIndex=table;return true;}return false;}
 function canSeek(time){if(!published||!Number.isFinite(time)||time<0)return false;let nearest=-1;for(let i=0;i<table.times.length;i++){if(table.times[i]<=time*1000)nearest=i;else break;}return nearest>=0&&time*1000-table.times[nearest]<=15000&&(time*1000<=table.times[table.times.length-1]||verified&&time<=hint.position+0.5);}
 function bookmark(position){if(!fingerprint||base===null||!Number.isFinite(position)||position<0)return null;let best=null;for(const point of points.values()){if(point.dts-base<=position*1000&&(!best||point.dts>best.dts))best=point;}if(!best||position*1000-(best.dts-base)>15000)return null;return {version:1,fingerprint,total,base,dts:best.dts,filePosition:best.filePosition,position};}
 function snapshot(){return {indexedPoints:table.times.length,savedAnchorAvailable:!!hint,savedAnchorVerified:verified,seekable:published};}
 return {identify,observe,attach,canSeek,bookmark,snapshot,publish(){published=true;onChange(snapshot());}};
}
export function observeTsSeek(demuxer,audio,video){
 const state=demuxer.config_&&demuxer.config_.xuperTsSeek;if(!state)return;state.observe(audio,video);
 if(demuxer.media_info_&&state.attach(demuxer.media_info_)&&!demuxer.config_.xuperTsSeekPublished){demuxer.config_.xuperTsSeekPublished=true;demuxer.onMediaInfo(demuxer.media_info_);state.publish();}
}
export function attachTsSeek(demuxer,info){const state=demuxer.config_&&demuxer.config_.xuperTsSeek;if(state)state.attach(info);}
