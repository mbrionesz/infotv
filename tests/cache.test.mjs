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
