import test from 'node:test';import assert from 'node:assert/strict';import {request} from '../browser/network.js';
test('metadata download is aborted as soon as it exceeds 8 MB',()=>{
 const previous=globalThis.XMLHttpRequest;let instance;class Xhr{constructor(){instance=this}open(){}setRequestHeader(){}send(){}abort(){this.aborted=true;this.onabort()}}
 globalThis.XMLHttpRequest=Xhr;try{let error;const req=request({href:'https://example.com/data'},()=>assert.fail('Oversized response must not reach the consumer'));req.on('error',value=>error=value);req.end();instance.onprogress({loaded:8*1024*1024+1});assert.equal(instance.aborted,true);assert.match(error.message,/8 MB/);}finally{globalThis.XMLHttpRequest=previous;}
});
