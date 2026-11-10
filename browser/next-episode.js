// Duration-based suggestion, not detection of credits. Never advances by itself.
export function nextEpisodeOffer({position,duration,current,episodes=[],nextSeason}={}){
 position=Number(position);duration=Number(duration);
 if(!Number.isFinite(position)||!Number.isFinite(duration)||duration<120||position<0||position>=duration)return null;
 const remaining=duration-position,windowSeconds=duration>=35*60?Math.min(360,Math.max(180,duration*0.1)):Math.min(120,Math.max(30,duration*0.1));
 if(remaining>windowSeconds)return null;
 const index=episodes.findIndex(ep=>current&&(String(ep.id)===String(current.id)||ep.number!=null&&current.number!=null&&String(ep.number)===String(current.number)));
 if(index<0)return null;
 const next=episodes[index+1];
 if(next)return {label:'Siguiente capítulo '+(next.number||index+2),episodeId:next.id};
 if(nextSeason)return {label:'Siguiente temporada · Capítulo 1',seasonId:nextSeason.id};
 return null;
}
