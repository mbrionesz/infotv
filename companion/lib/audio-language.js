'use strict';
function languageOf(track){
 var value=typeof track==='string'?track:track&&(track.language||track.lang||track.code)||'';
 var s=String(value).toLowerCase().replace(/_/g,'-').trim();
 if(/^(es|spa|esp)(-|$)|espa[nñ]ol|spanish|castellano|latino|latam|^lat$/.test(s))return 'es';
 if(/^(pt|por)(-|$)|portugu/.test(s))return 'pt';
 if(/^(en|eng)(-|$)|english|ingl[eé]s/.test(s))return 'en';
 return /^(und|undefined|unknown|\s*)$/.test(s)?'':s.split('-')[0];
}
function rank(track,preferred){
 if(!track)return 1000;
 var lang=languageOf(track),name=String(typeof track==='string'?track:[track.language,track.lang,track.name,track.label].filter(Boolean).join(' ')).toLowerCase().replace(/_/g,'-');
 if(lang!==preferred){if(!lang&&languageOf(name)===preferred)lang=preferred;else return 1000;}
 if(preferred==='es'){if(/latino|latam|latin america|^lat$|es-(419|mx|cl|ar|co|pe|uy|ve|ec|bo|py|cr|gt|hn|ni|pa|do|sv|us)\b/.test(name))return 0;if(/castellano|es-es\b|castilian/.test(name))return 20;}
 return 10;
}
function chooseAudioTrack(tracks,preferred){
 preferred=languageOf(preferred||'es');var best=-1,score=1000;
 for(var i=0;i<(tracks||[]).length;i++){var value=rank(tracks[i],preferred);if(value<score){score=value;best=i;}}
 return best;
}
function describe(track,index){var lang=languageOf(track),raw=String(track.name||track.label||track.language||track.lang||''),label=lang==='es'?(rank(track,'es')===0?'Español latino':rank(track,'es')===20?'Español (España)':'Español'):lang==='pt'?'Portugués':lang==='en'?'Inglés':raw||'Pista '+(index+1)+' · sin idioma';return {index:index,language:lang,name:label};}
module.exports={languageOf:languageOf,chooseAudioTrack:chooseAudioTrack,describe:describe};
