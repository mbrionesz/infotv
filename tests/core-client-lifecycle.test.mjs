import test from 'node:test';import assert from 'node:assert/strict';import {createCoreClient} from '../browser/core-client.js';
function fixture(){const previous={Worker:globalThis.Worker,document:globalThis.document,window:globalThis.window};const workers=[];class W{constructor(){this.messages=[];workers.push(this);}postMessage(m){if(this.fail)throw new Error('postMessage failed');this.messages.push(m);}terminate(){this.closed=true;}}globalThis.Worker=W;globalThis.document={baseURI:'http://localhost/'};globalThis.window={};return {workers,restore(){for(const [k,v]of Object.entries(previous))v===undefined?delete globalThis[k]:globalThis[k]=v;}};}
test('a postMessage failure removes its pending callback rather than completing twice later',()=>{
 const f=fixture(),client=createCoreClient();try{client.call('first',{},()=>{});const worker=f.workers[0];worker.fail=true;let calls=0;client.call('second',{},()=>calls++);assert.equal(calls,1);worker.onmessage({data:{id:2,result:{}}});assert.equal(calls,1);}finally{client.dispose();f.restore();}
});
test('a late native reply from a disposed data worker never reaches its replacement',async()=>{
 const f=fixture(),client=createCoreClient();let complete;
 try{window.XuperNativeTransport={request:()=>new Promise(resolve=>complete=resolve)};client.call('first',{},()=>{});const old=f.workers[0];old.onmessage({data:{nativeRequest:1,options:{url:'http://localhost/'}}});client.dispose();client.call('new',{},()=>{});complete({body:new ArrayBuffer(0),status:200});await Promise.resolve();await Promise.resolve();assert.equal(f.workers[1].messages.some(m=>m.nativeReply),false);}finally{client.dispose();f.restore();}
});
test('disposing data requests completes each waiter once and ignores subsequent replies',()=>{
 const f=fixture(),client=createCoreClient();let calls=0,error;
 try{client.call('pending',{},e=>{calls++;error=e;});const worker=f.workers[0];client.dispose();assert.equal(calls,1);assert.equal(error.name,'AbortError');worker.onmessage({data:{id:1,result:{}}});assert.equal(calls,1);}finally{client.dispose();f.restore();}
});
test('worker failure closes the old worker before error callbacks can retry',()=>{
 const f=fixture(),client=createCoreClient();let retried=false;
 try{client.call('pending',{},()=>{client.call('retry',{},error=>{assert.ok(error);retried=true;});});const old=f.workers[0];old.onerror();assert.equal(retried,true);assert.equal(old.messages.length,1);assert.equal(old.closed,true);}finally{client.dispose();f.restore();}
});
test('category errors retain their original route and portal code across the worker boundary',()=>{const f=fixture(),client=createCoreClient();let received;try{client.call('catalogBrowse',{},error=>received=error);f.workers[0].onmessage({data:{id:1,error:'No se pudo consultar esta categoría',code:'portal100023',categoryFailure:{path:'v3/getShelveData',code:'portal100023',message:'Original provider response'}}});assert.equal(received.portalCode,'portal100023');assert.equal(received.categoryFailure.path,'v3/getShelveData');assert.equal(received.categoryFailure.message,'Original provider response');}finally{client.dispose();f.restore();}});
