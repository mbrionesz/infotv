// Treat persisted UI data as untrusted: old versions and interrupted writes
// must not crash navigation or create inherited dictionary entries.
export function readSearchHistory(storage){
 try{storage=storage||globalThis.localStorage;const saved=JSON.parse(storage.getItem('xuper.searchHistory')||'[]');return (Array.isArray(saved)?saved:[]).filter(item=>typeof item==='string'&&item.trim()).slice(0,8).map(item=>item.slice(0,100));}catch(_){return [];}
}
export function readGuideFavorites(storage){
 const result=Object.create(null);
 try{storage=storage||globalThis.localStorage;const saved=JSON.parse(storage.getItem('xuper.guideFavorites')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))Object.keys(saved).slice(0,1000).forEach(key=>{const item=saved[key];if(!['__proto__','constructor','prototype'].includes(key)&&item&&typeof item==='object'&&typeof item.name==='string')result[key]=item;});}catch(_){}
 return result;
}
