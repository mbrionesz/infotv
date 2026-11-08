import test from 'node:test';import assert from 'node:assert/strict';import {subtitleTime,parseSubtitles,loadSubtitles} from '../browser/subtitles.js';
test('SRT and WebVTT support comma/dot, hour/minute timestamps, cue settings and safe text',()=>{
 assert.equal(subtitleTime('01:02:03,456'),3723.456);assert.equal(subtitleTime('02:03.400 align:start'),123.4);assert.ok(Number.isNaN(subtitleTime('00:99.000')));
 const srt=parseSubtitles('1\r\n00:00:01,000 --> 00:00:03,000\r\n<b>Hola</b> &amp; adiós');assert.deepEqual(srt,[{start:1,end:3,text:'Hola & adiós'}]);
 const vtt=parseSubtitles('WEBVTT\n\nNOTE ignored\n00:01.000 --> 00:02.000\nignored\n\ncue-id\n00:04.000 --> 00:07.500 align:start\n<v Voice>Texto</v>');assert.deepEqual(vtt,[{start:4,end:7.5,text:'Texto'}]);
});
test('subtitle loader uses native transport without leaking video headers, supports cancellation and reports denial',async()=>{
 const old=globalThis.document;globalThis.document={baseURI:'https://app.example/'};let options;const body=new TextEncoder().encode('WEBVTT\n\n00:01.000 --> 00:03.000\nHola').buffer;
 try{const transport={snapshot:()=>({available:true}),request:async value=>{options=value;return {status:200,body};}};assert.equal((await loadSubtitles({url:'https://subs.example/a.vtt',format:'portal-format-code'},{transport}).promise)[0].text,'Hola');assert.deepEqual(options.headers,{});transport.request=async()=>({status:403,body});await assert.rejects(loadSubtitles({url:'https://subs.example/a.vtt'},{transport}).promise,/HTTP 403/);let finish;transport.request=()=>new Promise(resolve=>finish=resolve);const task=loadSubtitles({url:'https://subs.example/a.vtt'},{transport});task.cancel();finish({status:200,body});await assert.rejects(task.promise,{name:'AbortError'});}finally{globalThis.document=old;}
});
