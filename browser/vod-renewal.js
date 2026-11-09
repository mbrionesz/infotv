export function createVodRenewal(resolve,now=Date.now){
 let inflight=null,attempts=[];
 return function renew(){
  if(inflight)return inflight;
  const at=now();attempts=attempts.filter(time=>at-time<300000);
  if(attempts.length>=2||attempts.length&&at-attempts[attempts.length-1]<15000)return Promise.reject(new Error('No se pudo renovar el vídeo; vuelve a intentarlo desde la ficha.'));
  attempts.push(at);inflight=new Promise((yes,no)=>{let settled=false;const timer=setTimeout(()=>done(new Error('Tiempo agotado al renovar el vídeo')),18000);function done(error,value){if(settled)return;settled=true;clearTimeout(timer);error?no(error):yes(value);}try{resolve(done);}catch(error){done(error);}}).finally(()=>{inflight=null;});return inflight;
 };
}
export function knownVodDuration({engine='',declared=0,media=0,ended=false,position=0}={}){
 declared=Number(declared);media=Number(media);
 if(engine==='mpegts.js')return Number.isFinite(declared)&&declared>0?declared:ended&&Number.isFinite(position)?Math.max(0,position):0;
 return Number.isFinite(media)&&media>0?media:Number.isFinite(declared)&&declared>0?declared:0;
}
