// Personal data is saved before touching disposable caches. No localStorage.clear/deleteDatabase.
export function createCacheCleaner({checkpoint=()=>{},flush,stop=()=>{},clear,reset=()=>{},timeoutMs=3000}={}){let pending=null;
 const bounded=(promise,fallback)=>new Promise(resolve=>{const timer=setTimeout(()=>resolve(fallback),timeoutMs);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},()=>{clearTimeout(timer);resolve(fallback);});});
 return function clean(){if(pending)return pending;pending=(async()=>{checkpoint();if(await bounded(flush(),false)!==true)return {saved:false,cleared:false};stop();const results=await Promise.all(clear.map(action=>bounded(Promise.resolve().then(action),false)));reset();return {saved:true,cleared:results.every(value=>value===true)};})().finally(()=>{pending=null;});return pending;};
}
