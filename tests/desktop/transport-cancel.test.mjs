import test from 'node:test';
import assert from 'node:assert/strict';
import {createDesktopTransport} from '../../browser/desktop-transport.js';
import {requestSignal} from '../../browser/request-signal.js';

test('audio source replacement preserves AbortError across a rejected Electron IPC request',async()=>{
 let rejectOld;const cancelled=[];
 const transport=createDesktopTransport({request:()=>new Promise((_,reject)=>{rejectOld=reject;}),cancel:id=>{cancelled.push(id);rejectOld(Error("Error invoking remote method 'xt:request': AbortError: The operation was aborted"));}});
 const signal=requestSignal(),old=transport.request({url:'https://video.test/a',signal});
 signal.abort();
 await assert.rejects(old,error=>error.name==='AbortError');
 assert.deepEqual(cancelled,[1]);
});
test('reset immediately cancels old requests without affecting a replacement stream',async()=>{
 let calls=0;const transport=createDesktopTransport({request:()=>++calls===1?new Promise(()=>{}):Promise.resolve({status:200,body:[1,2]}),cancel(){}});
 const old=transport.request({url:'https://video.test/old'});
 transport.reset();
 await assert.rejects(old,error=>error.name==='AbortError');
 const next=await transport.request({url:'https://video.test/new'});
 assert.equal(next.status,200);assert.equal(next.body.byteLength,2);
});
test('real network failures are not hidden as audio cancellation',async()=>{
 const transport=createDesktopTransport({request:()=>Promise.reject(Error('Tiempo de espera agotado')),cancel(){}});
 await assert.rejects(transport.request({url:'https://video.test/a'}),/Tiempo de espera agotado/);
});
test('active desktop request timeout reports timeout rather than an intentional cancellation',async()=>{
 const {createRequire}=await import('node:module'),{EventEmitter}=await import('node:events');
 const require=createRequire(import.meta.url),{createTransport}=require('../../desktop/transport.cjs');
 const mock={request(options){const req=new EventEmitter();req.end=()=>{};options.signal.addEventListener('abort',()=>req.emit('error',Object.assign(Error('The operation was aborted'),{name:'AbortError'})),{once:true});return req;}};
 const transport=createTransport({resolver:{resolve:async()=>({ip:'127.0.0.1'}),clear(){}},httpsModule:mock});
 try{await assert.rejects(transport.request(1,{url:'https://video.test/a',timeout:100}),error=>error.name==='TimeoutError'&&/servidor tardó/.test(error.message));}finally{transport.close();}
});
