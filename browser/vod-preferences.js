import language from '../companion/lib/audio-language.js';
// Unknown audio is not evidence that Spanish is absent.
export function subtitleDecision({subtitles=[],audioTracks=[],manual,mode=0,preferred='es'}={}){
 const wanted=manual&&manual.language||preferred;
 const index=language.chooseAudioTrack(subtitles,wanted);
 const known=audioTracks.map(track=>language.languageOf(track)||language.languageOf(track.name||'')).filter(Boolean);
 const enabled=manual?manual.enabled===true:mode===2||mode===0&&known.length>0&&!known.includes('es');
 return enabled&&index>=0?subtitles[index]:null;
}
