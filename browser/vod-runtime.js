let pending;
export function ensureVodRuntime(){
 if(window.XuperVod)return Promise.resolve(window.XuperVod);
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{const script=document.createElement('script');const timer=setTimeout(()=>{script.remove();pending=null;reject(new Error('No inició el módulo de películas/series'));},15000);script.src=new URL('vendor/vod.js',document.baseURI).href;script.onload=()=>{clearTimeout(timer);if(window.XuperVod)resolve(window.XuperVod);else{pending=null;reject(new Error('Módulo VOD incompleto'));}};script.onerror=()=>{clearTimeout(timer);script.remove();pending=null;reject(new Error('No se pudo cargar el módulo VOD'));};document.head.appendChild(script);});return pending;
}
