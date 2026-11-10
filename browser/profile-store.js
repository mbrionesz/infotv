const KEY='xuper_local_profile_v1',BACKUP=KEY+'_backup';
const valid=value=>value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.id==='string'&&value.id;
export function createProfileStore(storage,indexedDB){
 let dbPromise,serial=0,memory=null,pending=Promise.resolve(true);const state={source:'none',writes:0,error:'',persistent:false};
 function parse(key){try{const value=JSON.parse(storage.getItem(key));return valid(value)?value:null;}catch(_){return null;}}
 function read(){const primary=parse(KEY),backup=primary?null:parse(BACKUP);memory=primary||backup||memory;if(memory){state.source=primary?'localStorage':backup?'backup':'memory';state.persistent=!!(primary||backup);}return memory;}
 function db(){if(!dbPromise)dbPromise=new Promise(resolve=>{if(!indexedDB)return resolve(null);let settled=false;const finish=value=>{if(settled){if(value)value.close();return;}settled=true;clearTimeout(timer);resolve(value);},timer=setTimeout(()=>finish(null),3000);try{const request=indexedDB.open('xuper-library-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('profile');request.onsuccess=()=>finish(request.result);request.onerror=request.onblocked=()=>finish(null);}catch(_){finish(null);}});return dbPromise;}
 async function idb(value){
  const database=await db();if(!database)return value?false:null;
  return new Promise(resolve=>{let result=null,tx,settled=false;const finish=answer=>{if(settled)return;settled=true;clearTimeout(timer);resolve(answer);},timer=setTimeout(()=>{finish(value?false:null);try{if(tx)tx.abort();}catch(_){}},3000);
   try{tx=database.transaction('profile',value?'readwrite':'readonly');const store=tx.objectStore('profile');if(value)store.put(value,'current');else{const request=store.get('current');request.onsuccess=()=>{result=request.result;};}tx.oncomplete=()=>finish(value?true:valid(result)?result:null);tx.onerror=tx.onabort=()=>finish(value?false:null);}catch(_){finish(value?false:null);}
  });
 }

 const initial=read(),restore=initial?Promise.resolve(initial):idb().then(value=>{if(value&&serial===0){memory=value;state.source='indexedDB';state.persistent=true;try{storage.setItem(KEY,JSON.stringify(value));}catch(_){}}return serial===0?memory:null;});
 let queued=null,writer=null;
 function drain(){if(writer)return writer;writer=(async()=>{await restore;let persistent=false;while(queued){const job=queued;queued=null;const ok=await idb(job.copy);persistent=job.local||ok;state.persistent=persistent;if(!job.local&&ok)state.source='indexedDB';state.error=persistent?'':'No se pudo guardar la biblioteca en almacenamiento persistente';}return persistent;})().finally(()=>{writer=null;if(queued)return drain();});pending=writer;return writer;}
 function save(value){serial++;state.writes++;memory=JSON.parse(JSON.stringify(value));const copy=memory;let local=false;for(const key of [KEY,BACKUP])try{storage.setItem(key,JSON.stringify(copy));local=true;}catch(_){}state.persistent=local;state.source=local?'localStorage':'memory';queued={copy,local};return drain();}

 return {read,restore:()=>restore,save,flush:()=>pending,diagnostics:()=>Object.assign({},state)};
}
