import {catalogCountLabel} from './catalog-counter.js';
export function validCatalogCount(report){return !!report&&report.complete===true&&Number.isSafeInteger(report.total)&&report.total>=0&&Number.isFinite(report.checkedAt)&&Number.isFinite(new Date(report.checkedAt).getTime());}
// One timer and one outstanding UI request. Storage is a single small summary.
export function createCatalogCountController({request,storage,render,eligible,onReport=()=>{},onFailure=()=>{},now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout}){
 let stopped=false,pending=false,serial=0,timer=null,deadline=null,nextAt=now()+3500,current=null;
 function schedule(ms){clearTimer(timer);if(!stopped)timer=setTimer(tick,ms);}
 function tick(){
  if(stopped||pending)return;
  if(!eligible()){schedule(60000);return;}
  if(now()<nextAt){schedule(Math.min(60000,nextAt-now()));return;}
  pending=true;const id=++serial;
  function finish(error,report){if(stopped||!pending||id!==serial)return;pending=false;clearTimer(deadline);deadline=null;
   const valid=!error&&validCatalogCount(report);nextAt=now()+(valid?1800000:60000);
   if(valid){const clean={complete:true,total:report.total,checkedAt:report.checkedAt};onReport(report);if(!current||current.total!==clean.total){current=clean;try{storage.setItem('xt.catalogCount',JSON.stringify(clean));}catch(_){}render(catalogCountLabel(clean),'Totales informados por el portal de Películas y Series.');}}else onFailure();
   schedule(60000);
  }
  deadline=setTimer(()=>finish(new Error('Tiempo de conteo agotado')),15000);
  try{request(finish);}catch(error){finish(error);}
 }
 try{const prior=JSON.parse(storage.getItem('xt.catalogCount')||'null');if(validCatalogCount(prior)){current=prior;render(catalogCountLabel(prior),'Último conteo disponible de Películas y Series.');}}catch(_){}
 schedule(3500);
 return {wake(){if(!stopped&&!pending){clearTimer(timer);tick();}},dispose(){stopped=true;serial++;clearTimer(timer);clearTimer(deadline);},get pending(){return pending;}};
}
