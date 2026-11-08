import language from '../companion/lib/audio-language.js';
const keys=['adts_aac','loas_aac','ac3','eac3','mp3','opus'];
const types={15:'adts_aac',17:'loas_aac',129:'ac3',135:'eac3',3:'mp3',4:'mp3'};
export function selectTsAudioPmt(pmt,data,config){
 const tracks=[];if(!data||data.length<16)return;
 const end=Math.min(data.length,3+((data[1]&15)<<8|data[2])-4);let i=12+((data[10]&15)<<8|data[11]);
 const hints=String(config.xuperAudioLabels||'').split(/[,\/]/);
 while(i+5<=end){const type=data[i],pid=(data[i+1]&31)<<8|data[i+2],length=(data[i+3]&15)<<8|data[i+4];if(i+5+length>end)return;
  const key=types[type]||keys.find(name=>pmt.common_pids[name]===pid);let lang='';
  for(let at=i+5;at+2<=i+5+length;){const size=data[at+1];if(at+2+size>i+5+length)return;if(data[at]===10&&size>=3)lang=String.fromCharCode(data[at+2],data[at+3],data[at+4]);at+=2+size;}
  if(key){const hint=hints[tracks.length]||'',code=language.languageOf(lang)?lang:hint;tracks.push({pid,key,language:code,name:hint||code||'Pista '+(tracks.length+1)+' · sin idioma'});}
  i+=5+length;
 }
 if(!tracks.length)return;
 const preferred=language.chooseAudioTrack(tracks,config.xuperAudioLanguage||'es');
 const explicit=Number.isInteger(config.xuperAudioIndex)&&config.xuperAudioIndex>=0&&config.xuperAudioIndex<tracks.length;
 const selected=explicit?config.xuperAudioIndex:preferred>=0?preferred:0;
 keys.forEach(key=>pmt.common_pids[key]=undefined);pmt.common_pids[tracks[selected].key]=tracks[selected].pid;
 const signature=JSON.stringify([tracks,selected]);if(config.xuperAudioSignature!==signature){config.xuperAudioSignature=signature;if(config.onXuperAudio)config.onXuperAudio(tracks,selected);}
}
