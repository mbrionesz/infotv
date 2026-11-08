import test from 'node:test';import assert from 'node:assert/strict';
import {createPlayer} from '../browser/player.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('VOD decoder failures try an authorized backup once and then report immediately',async()=>{
 const previous={window:globalThis.window,document:globalThis.document};
 const opens=[],errors=[];let destroyed=0;
 globalThis.window={MediaSource:class{},XuperVod:{openMp4:(video,url,headers,settings)=>{opens.push({url,headers,settings});return {destroy(){destroyed++;}};}}};
 globalThis.document={addEventListener(){}};
 class Video extends EventTarget{constructor(){super();this.paused=true;this.readyState=0;this.buffered={length:0};this.currentTime=0;}pause(){}play(){return Promise.resolve()}load(){}removeAttribute(){}}
 const video=new Video(),source='https://primary.example/movie.mp4';
 const player=createPlayer(()=>({mime:'video/mp4',headers:{'Content-Auth':'primary'},backupUrls:[{url:'https://backup.example/movie.mp4',headers:{'Content-Auth':'backup'}}]}));
 try{
  player.open(video,source,{onError:message=>errors.push(message)});video.error={code:4};video.onerror();assert.equal(errors.length,0,'Old empty-source error while module loads must be ignored');video.error=null;await tick();video.onerror();assert.equal(errors.length,0,'An obsolete error event without a current MediaError must be ignored');
  assert.equal(opens.length,1);video.error={code:3};video.onerror();await tick();
  assert.equal(opens.length,2);assert.equal(opens[1].headers['Content-Auth'],'backup');assert.equal(errors.length,0);assert.equal(destroyed,1);
  opens[0].settings.onError('late primary failure');assert.equal(errors.length,0,'Stale failure must not stop backup');
  video.onerror();assert.equal(errors.length,1);assert.match(errors[0],/decodificar MP4.*3/);assert.equal(destroyed,2);
  assert.equal(player.diagnostics.stage,'loading-file');assert.equal(player.history().filter(e=>e.kind==='vod-route-failed').length,2);
 }finally{player.stop();globalThis.window=previous.window;globalThis.document=previous.document;}
});
test('a synchronous VOD constructor failure cannot replace or leak the backup session',async()=>{
 const previous={window:globalThis.window,document:globalThis.document};let opened=0;const destroyed=[];
 globalThis.window={MediaSource:class{},XuperVod:{openMp4:(video,url,headers,settings)=>{opened++;if(url.includes('primary'))settings.onError('Unsupported fixture track');return {destroy(){destroyed.push(url);}};}}};
 globalThis.document={addEventListener(){}};
 class Video extends EventTarget{constructor(){super();this.paused=true;this.readyState=0;this.buffered={length:0};this.currentTime=0;}pause(){}play(){return Promise.resolve()}load(){}removeAttribute(){}}
 const player=createPlayer(()=>({mime:'video/mp4',headers:{'Content-Auth':'primary'},backupUrls:[{url:'https://backup.example/movie.mp4',headers:{'Content-Auth':'backup'}}]}));
 try{player.open(new Video(),'https://primary.example/movie.mp4',{onError:message=>assert.fail(message)});await tick();assert.equal(opened,2);assert.deepEqual(destroyed,['https://primary.example/movie.mp4']);player.stop();assert.deepEqual(destroyed,['https://primary.example/movie.mp4','https://backup.example/movie.mp4']);}
 finally{player.stop();globalThis.window=previous.window;globalThis.document=previous.document;}
});
