import language from '../companion/lib/audio-language.js';
// Unknown audio is not evidence that Spanish is absent.
export function subtitleDecision({subtitles=[],audioTracks=[],manual,mode=0,preferred='es'}={}){
 const wanted=manual&&manual.language?{language:manual.language,name:manual.name}:preferred;
 const candidates=manual&&typeof manual.forced==='boolean'?subtitles.filter(track=>manual.forced?track.forced===true:track.forced!==true):subtitles;
 const index=language.chooseAudioTrack(candidates,wanted);
 const known=audioTracks.map(track=>language.languageOf(track)||language.languageOf(track.name||'')).filter(Boolean);
 const enabled=manual?manual.enabled===true:mode===2||mode===0&&known.length>0&&!known.includes('es');
 return enabled&&index>=0?candidates[index]:null;
}
