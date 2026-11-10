export function createVodRuntimeLoader(target,{timeoutMs=15000}={}){
 let pending=null;
 return function ensure(){if(target.XuperVod)return Promise.resolve(target.XuperVod);if(pending)return pending.promise;
  const job={};let yes,no,settled=false;job.promise=new Promise((resolve,reject)=>{yes=resolve;no=reject;});pending=job;
  const script=target.document.createElement('script');let timer;
  function finish(error){if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();if(pending===job)pending=null;no(error);}else yes(target.XuperVod);}
  timer=setTimeout(()=>finish(new Error('No inició el módulo de películas/series')),timeoutMs);
  script.src=new URL('vendor/vod.js',target.document.baseURI).href;script.onload=()=>finish(target.XuperVod?null:new Error('Módulo VOD incompleto'));script.onerror=()=>finish(new Error('No se pudo cargar el módulo VOD'));
  try{target.document.head.appendChild(script);}catch(error){finish(error);}return job.promise;
 };
}
let loader,target;
export function ensureVodRuntime(){if(!loader||target!==window){target=window;loader=createVodRuntimeLoader(target);}return loader();}
