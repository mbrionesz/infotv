import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer,toAvDisplayRect } from '../browser/player.js';
test('4K application coordinates normalize to the 1920x1080 AVPlay coordinate system',()=>{
  assert.deepEqual(toAvDisplayRect({left:0,top:0,width:3840,height:2160},3840,2160),[0,0,1920,1080]);
  assert.deepEqual(toAvDisplayRect({left:1920,top:540,width:1920,height:1080},3840,2160),[960,270,960,540]);
});

test('AVPlay adapter forwards controls and restores the video after stopping (mocked Samsung API)', async () => {
  const calls = [];
  const avplay = {
    open: url => calls.push(['open',url]), stop: () => calls.push(['stop']), close: () => calls.push(['close']),
    setDisplayRect: (...args) => calls.push(['rect',...args]), setDisplayMethod: () => {}, setListener: () => {},
    prepareAsync: success => queueMicrotask(success), play: () => calls.push(['play']), pause: () => calls.push(['pause']),
    getDuration: () => 60000, seekTo: time => calls.push(['seek',time]),
    getTotalTrackInfo: () => [{type:'AUDIO',index:1},{type:'AUDIO',index:3}],
    setSelectTrack: (...args) => calls.push(['audio',...args]), setStreamingProperty: (...args) => calls.push(['property',...args])
  };
  const oldWindow = globalThis.window, oldWebapis = globalThis.webapis, oldDocument = globalThis.document;
  globalThis.window = {webapis:{avplay}}; globalThis.webapis = window.webapis;
  globalThis.document = { addEventListener: () => {}, createElement: () => ({style:{},remove:()=>{}}) };
  class Video extends EventTarget {
    constructor() { super(); this.currentTime=0;this.duration=0;this.paused=true;this.readyState=0;this.src='';this.style={};this.parentElement={insertBefore:()=>{}}; }
    getBoundingClientRect() { return {left:0,top:0,width:1920,height:1080}; }
    play() { return Promise.resolve(); } pause() {} removeAttribute() {} load() {}
  }
  const video = new Video(); const originalPlay = video.play;
  let player;
  try {
    player = createPlayer(() => ({ headers:{'User-Agent':'Samsung test'} }));
    player.open(video,'https://example.com/public.m3u8',{onError: message=>assert.fail(message)});
    await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(player.diagnostics.engine,'avplay'); assert.equal(video.readyState,4); assert.equal(video.paused,false);
    assert.equal(video.duration,60); video.pause(); assert.equal(video.paused,true); await video.play(); assert.equal(video.paused,false);
    video.currentTime=12; assert.ok(calls.some(call=>call[0]==='seek'&&call[1]===12000));
    assert.equal(player.selectAudio(1),true); assert.ok(calls.some(call=>call[0]==='audio'&&call[2]===3));
    assert.deepEqual(calls.find(call=>call[0]==='rect'),['rect',0,0,1920,1080]);
    player.stop(); assert.equal(video.play,originalPlay); assert.equal(player.diagnostics.engine,'');
  } finally {
    player?.stop(); globalThis.window=oldWindow;globalThis.webapis=oldWebapis;globalThis.document=oldDocument;
  }
});
