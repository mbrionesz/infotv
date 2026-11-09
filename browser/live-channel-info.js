import {posterCandidates} from './poster-art.js';
export function liveChannelInfo(window){
 const app=window.__xuper,item=app?.channels[app.state.channel]||{},d=window.XuperPlayer?.diagnostics||{},m=d.media||{};
 const video=window.document?.getElementById('player-video');
 const height=Number(m.height)||Number(video?.videoHeight)||Number(d.level?.height)||0,width=Number(m.width)||Number(video?.videoWidth)||Number(d.level?.width)||0;
 const quality=height>=2000?'4K UHD':height>=1000?'1080p Full HD':height>=700?'720p HD':height?height+'p':item.uhd?'UHD · declarado':'Calidad no informada';
 return {name:item.name||'TV en vivo',logo:posterCandidates({poster:item.logo})[0]||'',quality,dimensions:width&&height?width+' × '+height:'',fps:Number(d.level?.fps)||0};
}
export function channelHeader(window){
 const info=liveChannelInfo(window),box=document.createElement('div');box.className='xt-live-channel-info';
 if(info.logo){const image=document.createElement('img');image.alt='Logo del canal';image.dataset.posterSize='logo';box.appendChild(image);image.onerror=()=>image.remove();if(window.XuperStandalone?.loadPoster)window.XuperStandalone.loadPoster(image,info.logo);else image.src=info.logo;}
 const text=document.createElement('div'),name=document.createElement('h2'),quality=document.createElement('p');name.textContent=info.name;quality.textContent=[info.quality,info.dimensions,info.fps?info.fps+' fps':''].filter(Boolean).join(' · ');text.appendChild(name);text.appendChild(quality);box.appendChild(text);return box;
}
