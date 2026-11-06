export function createRemoteMetrics({clock=()=>performance.now(),frame=callback=>requestAnimationFrame(callback)}={}){
  const samples=[],frames=[];let waiting=false;
  function keep(list,value){list.push(value);if(list.length>120)list.shift();}
  function measure(callback,skipFalse=false){
    const start=clock();const result=callback();
    if(skipFalse&&result===false)return result;
    keep(samples,clock()-start);
    if(!waiting){waiting=true;frame(()=>{waiting=false;keep(frames,clock()-start);});}
    return result;
  }
  function stats(values){const sorted=values.slice().sort((a,b)=>a-b);const at=p=>sorted.length?Math.round(sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)]*100)/100:null;return {samples:sorted.length,p50Ms:at(.5),p95Ms:at(.95)};}
  return {measure,snapshot:()=>({handler:stats(samples),nextAnimationFrame:stats(frames),targetHandlerMs:5,note:'Tiempo JavaScript y próximo rAF; no mide el retardo físico del mando ni la presentación en pantalla.'})};
}
