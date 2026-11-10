import {test} from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createCache} from '../browser/cache.js';
test('metadata persists across clients, expires and only allows bounded stale fallback',async()=>{
  let now=1000;const factory=new IDBFactory();const first=createCache(factory,()=>now);
  assert.equal(await first.available(),true);
  await first.put('metadata','categories',{categories:[{id:1,name:'Prueba'}]},1000);
  const second=createCache(factory,()=>now);
  assert.deepEqual(await second.get('metadata','categories'),{categories:[{id:1,name:'Prueba'}]});
  now=2500;assert.equal(await second.get('metadata','categories'),null);
  assert.ok(await second.get('metadata','categories',true));
  now=86402000;assert.equal(await second.get('metadata','categories',true),null);
});
test('poster cache prunes oldest blobs and unavailable storage degrades safely',async()=>{
  let now=10;const cache=createCache(new IDBFactory(),()=>now);
  for(let i=0;i<4;i++){now++;await cache.put('posters','p'+i,new Blob([new Uint8Array(16)]),1000);}
  await cache.prune('posters',2,32);
  assert.equal(await cache.get('posters','p0'),null);assert.ok(await cache.get('posters','p3'));
  const missing=createCache(null);assert.equal(await missing.available(),false);assert.equal(await missing.get('metadata','x'),null);assert.equal(await missing.put('metadata','x',{},1),false);
});

test('exit clears metadata without deleting cached posters or profile database',async()=>{const factory=new IDBFactory(),cache=createCache(factory);await cache.put('metadata','catalog',{items:[{id:'old'}]},10000);await cache.put('posters','poster',{data:'keep'},10000);assert.equal(await cache.clearMetadata(),true);assert.equal(await cache.get('metadata','catalog',true),null);assert.deepEqual(await cache.get('posters','poster'),{data:'keep'});});
test('stuck IndexedDB open times out so cache cannot block playback metadata forever',async()=>{const cache=createCache({open:()=>({})},Date.now,{timeoutMs:20});assert.equal(await cache.get('metadata','x'),null);assert.equal(await cache.put('metadata','x',{},1000),false);});
test('expired and oversized entries do not evict smaller live records unnecessarily',async()=>{let time=1;const cache=createCache(new IDBFactory(),()=>time);await cache.put('metadata','expired',{value:'x'},1);time=3;await cache.put('metadata','large',{value:'x'.repeat(1000)},1000);await cache.put('metadata','small',{value:'ok'},1000);await cache.prune('metadata',2,100);assert.deepEqual(await cache.get('metadata','small'),{value:'ok'});assert.equal(await cache.get('metadata','large'),null);});
test('a hung cache transaction disables further cache waits for this session',async()=>{let calls=0;const db={close(){},transaction(){calls++;return {objectStore:()=>({get:()=>({})}),abort(){}};}};const indexedDB={open(){const r={};queueMicrotask(()=>{r.result=db;r.onsuccess()});return r;}};const cache=createCache(indexedDB,Date.now,{timeoutMs:20});assert.equal(await cache.get('metadata','x'),null);assert.equal(await cache.get('metadata','y'),null);assert.equal(calls,1);});
test('manual cleanup removes both cache stores',async()=>{const cache=createCache(new IDBFactory());await cache.put('metadata','catalog',{},10000);await cache.put('posters','cover',new Blob(['image']),10000);assert.equal(await cache.clearTemporary(),true);assert.equal(await cache.get('metadata','catalog'),null);assert.equal(await cache.get('posters','cover'),null);});
test('old search keys are purged while ordinary catalog data remains',async()=>{const cache=createCache(new IDBFactory());await cache.put('metadata','art:catalogSearchPage:{"value":"private"}',{},10000);await cache.put('metadata','art:home:{"root":"movies"}',{items:[]},10000);assert.equal(await cache.clearSearches(),true);assert.equal(await cache.get('metadata','art:catalogSearchPage:{"value":"private"}'),null);assert.deepEqual(await cache.get('metadata','art:home:{"root":"movies"}'),{items:[]});});
