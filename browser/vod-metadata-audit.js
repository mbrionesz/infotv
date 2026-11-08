// Explicit, bounded check in the current TV session. No URL, token or header output.
export async function auditVodMetadata(core,state,player){
 const item=state.screen==='player'?state.playerItem:state.detail;
 if(!item||!item.id)throw new Error('Abre la ficha de una película o serie primero.');
 const episode=state.screen==='player'?state.playerEpisode:state.detailEpisode;
 const request=(method,...args)=>new Promise((resolve,reject)=>core[method](...args,(error,result)=>error?reject(error):resolve(result)));
 const detail=await request('detail',item.id);
 const info=await request('mediaInfo',episode&&episode.id||item.id,episode?item.seasonId||item.id:'');
 const asset=detail.item||{},reported={};
 for(const key of ['title','year','releaseDate','duration','score','genres','director','actors','country','quality','resolution','tagline','volumeCount','updateCount','moreAudio','moreSubtitle'])if(asset[key]!==undefined)reported[key]=asset[key];
 const track=t=>({audio:t.audio||'',codec:t.codec||'',format:t.format||'',quality:t.quality||'',height:t.height||0,bitrateKbps:t.bitrateKbps||0,frameRate:t.frameRate||0});
 const diag=player&&player.diagnostics||{};
 return {reported,episodes:(detail.episodes||[]).length,seasons:(detail.seasons||[]).length,media:{audio:info.audio||'',duration:info.duration||0,tracks:(info.tracks||[]).map(track),subtitles:(info.subtitles||[]).map(t=>({language:t.lang,format:t.format}))},observed:state.screen==='player'?{engine:diag.engine,audio:player.audioTracks(),width:diag.media&&diag.media.width||0,height:diag.media&&diag.media.height||0,codecs:diag.codecs||{}}:null,note:'Calidad declarada por el portal; resolución y pistas observadas solo durante reproducción. No prueba HDR, 5.1 ni una intro.'};
}
