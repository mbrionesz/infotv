import language from '../companion/lib/audio-language.js';
export function qualityLabel(track={}){
 const text=String(track.quality||track.resolution||'').trim(),height=Number(track.height)||0;
 if(Number.isFinite(height)&&height>0)return height===2160?'4K':Math.round(height)+'p';
 if(/^(4k|2160p)$/i.test(text))return '4K';
 if(/^uhd$/i.test(text))return 'UHD';if(/^fhd$/i.test(text))return '1080p';if(/^hd$/i.test(text))return 'HD';
 return /^\d{3,4}p$/i.test(text)?text:'';
}
export function audioLabel(code){const names={kor:'Coreano',ko:'Coreano',jpn:'Japonés',ja:'Japonés',fra:'Francés',fr:'Francés',ita:'Italiano',it:'Italiano',deu:'Alemán',de:'Alemán',zho:'Chino',zh:'Chino'};return names[code]||language.describe({language:code,name:code},0).name;}
export function titleBadges(info={},item={},index=0){
 const tracks=info.tracks||[];
 if(index<0&&tracks.length>1){const unique=values=>Array.from(new Set(values.filter(Boolean)));const qualities=unique(tracks.map(qualityLabel));const summary=titleBadges(Object.assign({},info,{tracks:[Object.assign({},tracks[0],{quality:'',height:0,resolution:'',frameRate:0,bitrateKbps:0,codec:unique(tracks.map(t=>String(t.codec||'').toUpperCase().replace(/H265|HEVC/,'HEVC').replace(/H264|AVC/,'H.264'))).join(' / '),audio:unique(tracks.map(t=>t.audio)).join(','),audioName:unique(tracks.map(t=>t.audioName||t.audio)).join(',')})]}),{},0);return (qualities.length?[qualities.join(' / ')]:[]).concat(summary);}
 const track=tracks[index]||info.selected||{};
 const labels=[qualityLabel(track)||qualityLabel(item)];
 const fps=Number(track.frameRate),bitrate=Number(track.bitrateKbps);
 if(Number.isFinite(fps)&&fps>0&&fps<=240)labels.push(Number(fps.toFixed(3))+' FPS');
 if(Number.isFinite(bitrate)&&bitrate>0)labels.push(Number((bitrate/1000).toFixed(2))+' Mbps');
 const codec=String(track.codec||'').toUpperCase();if(codec)labels.push(/^(H265|HEVC)$/.test(codec)?'HEVC':/^(H264|AVC)$/.test(codec)?'H.264':codec);
 const audio=String(track.audioName||track.audio||info.audio||'').split(/[,\/]/).map(x=>x.trim()).filter(Boolean);
 if(audio.length)labels.push(Array.from(new Set(audio.map(audioLabel))).join(' / '));
 if((info.subtitles||[]).length)labels.push('Subtítulos: '+Array.from(new Set(info.subtitles.map(x=>audioLabel(x.lang)))).join(' / '));
 return labels.filter(Boolean);
}
