import test from 'node:test';import assert from 'node:assert/strict';import {readSearchHistory,readGuideFavorites} from '../browser/stored-ui.js';
const storage=value=>({getItem:()=>value});
test('corrupt or incompatible saved UI data cannot crash search or favorites',()=>{
 for(const value of ['null','{}','{"length":3}','false','123','"text"','{broken']){assert.deepEqual(readSearchHistory(storage(value)),[]);assert.deepEqual(Object.keys(readGuideFavorites(storage(value))),[]);}
 const denied={getItem(){throw new Error('Storage unavailable')}};assert.deepEqual(readSearchHistory(denied),[]);assert.equal(Object.keys(readGuideFavorites(denied)).length,0);
});
test('search history is bounded and contains only usable strings',()=>{const result=readSearchHistory(storage(JSON.stringify([null,5,{},'',...Array.from({length:20},(_,i)=>String(i)+'x'.repeat(200))])));assert.equal(result.length,8);assert.ok(result.every(v=>typeof v==='string'&&v.length===100));});
test('saved favorites cannot populate dictionary prototypes',()=>{const result=readGuideFavorites(storage('{"__proto__":{"name":"bad"},"constructor":{"name":"bad"},"one":{"name":"Channel","channelCode":"one"},"broken":null}'));assert.equal(Object.getPrototypeOf(result),null);assert.deepEqual(Object.keys(result),['one']);assert.equal(result.one.name,'Channel');});

test('unavailable browser localStorage getter is handled inside the reader',()=>{const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Access denied')}});try{assert.deepEqual(readSearchHistory(),[]);assert.equal(Object.keys(readGuideFavorites()).length,0);}finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}});
