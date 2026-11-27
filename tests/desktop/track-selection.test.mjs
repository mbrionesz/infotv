import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import {openDesktopNative} from '../../browser/desktop-native-player.js';
const {createVlcMedia}=createRequire(import.meta.url)('../../desktop/vlc-media.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await delay(10);}assert.fail('Native track state did not settle');}
function fixture(engine){
 let audio=0,sub=-1,requests=[],rejectAudio=false;
 const native=()=>({ready:true,state:'paused',time:45,length:3600,stats:{decodedvideo:1,displayedpictures:1},information:{category:{a:{Type:'Audio',ID:0,Selected:audio===0},b:{Type:'Audio',ID:7,Selected:audio===7},...(sub>=0?{s:{Type:'Subtitle',ID:sub,Selected:true}}:{})}}});
 const media=createVlcMedia({engine,executable:'/decoder/test',resolver:{},pollMs:10,proxyFactory:async()=>({url:'http://127.0.0.1/test',subtitle:()=> 'http://127.0.0.1/subtitle',snapshot:()=>({bytes:123,httpStatus:206}),close(){}}),spawnProcess:()=>{
  const child=new EventEmitter();child.stdout=new EventEmitter();child.stdout.setEncoding=()=>{};child.stderr=new EventEmitter();child.stdin=new EventEmitter();child.kill=()=>{};
  child.stdin.write=(line,done)=>{const r=JSON.parse(line);requests.push(r);if(r.action==='audio'&&!rejectAudio)setTimeout(()=>{audio=r.track;},120);if(r.action==='subtitle')sub=5;if(r.action==='subtitle-off')sub=-1;queueMicrotask(()=>child.stdout.emit('data',JSON.stringify({requestId:r.requestId,...(r.action==='audio'&&rejectAudio?{error:'AUDIO_TRACK_UNAVAILABLE'}:{result:native()})})+'\n'));done?.();};
  queueMicrotask(()=>child.stdout.emit('data',JSON.stringify({event:'ready',protocol:1})+'\n'));return child;
 }});
 return {media,requests,rejectAudio:()=>rejectAudio=true};
}
for(const engine of ['vlc','libmpv'])test(engine+' confirms actual audio selection, retains clock/pause and propagates rejected track changes',async()=>{
 const f=fixture(engine);try{const {id}=await f.media.open({url:'http://fixture.test/movie.mp4'});await until(()=>f.media.snapshot(id).ready);let finished=false;const pending=f.media.command(id,'audio',7).then(s=>{finished=true;return s;});await delay(40);assert.equal(finished,false);const next=await pending;assert.equal(next.tracks.find(t=>t.type==='audio'&&t.selected).id,7);assert.equal(next.paused,true);assert.equal(next.time,45);f.rejectAudio();await assert.rejects(f.media.command(id,'audio',0),/AUDIO_TRACK_UNAVAILABLE/);assert.equal(f.media.snapshot(id).tracks.find(t=>t.type==='audio'&&t.selected).id,7);await assert.rejects(f.media.command(id,'audio',999),/no disponible/);}finally{f.media.close();}
});
for(const engine of ['vlc','libmpv'])test(engine+' confirms subtitle on/off and avoids downloading the same selected subtitle twice',async()=>{
 const f=fixture(engine);try{const {id}=await f.media.open({url:'http://fixture.test/movie.mp4'});await until(()=>f.media.snapshot(id).ready);const choice={lang:'en',url:'http://fixture.test/private.srt?token=secret'};await f.media.subtitle(id,choice);await f.media.subtitle(id,choice);assert.equal(f.requests.filter(r=>r.action==='subtitle').length,1);assert.deepEqual(f.media.snapshot(id).subtitle,{enabled:true,language:'en'});assert.doesNotMatch(JSON.stringify(f.media.diagnostics()),/token=secret|private.srt/);await f.media.subtitle(id,null);assert.equal(f.media.snapshot(id).tracks.some(t=>t.type==='sub'&&t.selected),false);}finally{f.media.close();}
});
test('renderer applies confirmed audio state immediately and discards a status poll started before the click',async()=>{
 const previous=globalThis.window;let polls=0,oldPoll,answer;const snapshot=selected=>({id:'tracks',ready:true,time:40,duration:3600,tracks:[{id:0,type:'audio',selected:selected===0},{id:7,type:'audio',selected:selected===1}]});
 globalThis.window={XuperDesktop:{startMedia:async()=>({id:'tracks'}),mediaState:()=>++polls===1?Promise.resolve(snapshot(0)):new Promise(r=>{oldPoll=r;}),mediaCommand:()=>new Promise(r=>{answer=r;}),stopMedia(){},onMediaClosed:()=>()=>{}},__xuper:{subtitleForPlayback:()=>null}};
 class Video extends EventTarget{play(){}pause(){}}
 const session=openDesktopNative(new Video(),{url:'http://fixture.test/movie.mp4'},{onState(){},onError:assert.fail,onClosed(){}});
 try{await session.ready;await until(()=>session.state.ready);await delay(510);assert.ok(oldPoll);const change=session.selectAudioConfirmed(1);oldPoll(snapshot(0));answer(snapshot(1));await change;assert.equal(session.state.tracks[1].selected,true);assert.equal(session.state.time,40);await assert.rejects(session.selectAudioConfirmed(5),/no está disponible/);}finally{session.destroy();globalThis.window=previous;}
});
test('renderer propagates rejected subtitle/audio commands and never marks the rejected audio selected',async()=>{
 const previous=globalThis.window;globalThis.window={XuperDesktop:{startMedia:async()=>({id:'fail'}),mediaState:async()=>({id:'fail',ready:true,tracks:[{id:0,type:'audio',selected:true},{id:1,type:'audio',selected:false}]}),mediaCommand:async()=>{throw Error('AUDIO_TRACK_UNAVAILABLE');},mediaSubtitle:async()=>{throw Error('SUBTITLE_OPEN');},stopMedia(){},onMediaClosed:()=>()=>{}},__xuper:{subtitleForPlayback:()=>null}};
 class Video extends EventTarget{play(){}pause(){}}const session=openDesktopNative(new Video(),{url:'http://fixture.test/movie.mp4'},{onState(){},onError:assert.fail,onClosed(){}});
 try{await session.ready;await until(()=>session.state.ready);await assert.rejects(session.selectAudioConfirmed(1),/AUDIO_TRACK_UNAVAILABLE/);assert.equal(session.state.tracks[0].selected,true);await assert.rejects(session.subtitle({url:'http://fixture.test/sub.srt'}),/SUBTITLE_OPEN/);}finally{session.destroy();globalThis.window=previous;}
});
