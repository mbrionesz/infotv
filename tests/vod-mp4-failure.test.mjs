import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('fatal MP4 read failure stops scheduling, closes reader and reports once',async()=>{
 let reads=0,errors=0,closes=0,scheduled=0,interval,open;
 const source=readFileSync(new URL('../browser/vod-mp4.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function');
 const context=vm.createContext({createVodBufferWindow:()=>({shouldRead:()=>true}),createVodReader:()=>({read:async()=>{reads++;throw new Error('HTTP 404');},close(){closes++;}}),MP4Box:{createFile:()=>({stop(){}})},MediaSource:class{addEventListener(name,cb){open=cb;}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){scheduled++;},clearTimeout(){},setInterval(cb){interval=cb;return 1;},clearInterval(){},language:{}});
 vm.runInContext(source,context);const player=context.openMp4({buffered:{length:0},addEventListener(){},removeEventListener(){}},'fixture',{}, {onError:()=>errors++});open();await new Promise(resolve=>setImmediate(resolve));interval();await new Promise(resolve=>setImmediate(resolve));assert.equal(errors,1);assert.equal(reads,1);assert.equal(scheduled,0);assert.equal(closes,1);player.destroy();
});
