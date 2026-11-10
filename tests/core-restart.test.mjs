import test from 'node:test';import assert from 'node:assert/strict';import {createCoreClient} from '../browser/core-client.js';
test('a failed data worker can be restarted without reinstalling and its native work is cancelled',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,Worker:globalThis.Worker},workers=[];let signal;
 globalThis.document={baseURI:'https://app.example/'};globalThis.window={XuperNativeTransport:{request:options=>{signal=options.signal;return new Promise((yes,no)=>signal.subscribe(()=>no(signal.error)));}}};
 globalThis.Worker=class{constructor(){workers.push(this);}postMessage(message){this.sent=message;}terminate(){this.closed=true;}};
 const core=createCoreClient(),calls=[];
 try{core.call('resolve',{},e=>calls.push(e));workers[0].onmessage({data:{nativeRequest:1,options:{url:'https://cdn.example/'}}});workers[0].onerror();assert.ok(signal.aborted);assert.equal(calls.length,1);core.restart();core.call('resolve',{},(e,r)=>calls.push(r));assert.equal(workers.length,2);workers[1].onmessage({data:{id:workers[1].sent.id,result:{ok:true}}});assert.deepEqual(calls[1],{ok:true});}
 finally{core.dispose();Object.assign(globalThis,previous);}
});
