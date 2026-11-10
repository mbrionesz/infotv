import test from 'node:test';import assert from 'node:assert/strict';
import {subtitleDecision} from '../browser/vod-preferences.js';
import language from '../companion/lib/audio-language.js';
const subtitles=[{lang:'pt',url:'pt'},{lang:'es-MX',url:'es'},{lang:'en',url:'en'}];
test('automatic subtitles need evidence of absent Spanish, and never invent a translation',()=>{
 for(const audioTracks of [[],[{language:'und'}],[{language:'es-MX'}],[{language:'es-ES'},{language:'pt'}]])assert.equal(subtitleDecision({subtitles,audioTracks}),null);
 assert.equal(subtitleDecision({subtitles,audioTracks:[{language:'por'}]}).url,'es');
 assert.equal(subtitleDecision({subtitles:[subtitles[0]],audioTracks:[{language:'por'}]}),null);
});
test('manual per-title choices take precedence over automatic and global modes',()=>{
 assert.equal(subtitleDecision({subtitles,audioTracks:[{language:'pt'}],manual:{enabled:false,language:'es'}}),null);
 assert.equal(subtitleDecision({subtitles,audioTracks:[{language:'es'}],mode:1,manual:{enabled:true,language:'en'}}).url,'en');
 assert.equal(subtitleDecision({subtitles,audioTracks:[{language:'es'}],mode:2}).url,'es');
 assert.equal(subtitleDecision({subtitles,audioTracks:[{language:'pt'}],mode:1}),null);
});
test('saved audio language and variant survive reordered tracks',()=>{
 const first=[{language:'por'},{language:'spa',name:'Español castellano'},{language:'es-MX'}];
 const saved=language.describe(first[1],1);assert.equal(saved.name,'Español (España)');
 assert.equal(language.chooseAudioTrack([first[2],first[0],first[1]],saved),2);
 assert.equal(language.chooseAudioTrack([first[2],first[0]],saved),0);
});
test('manual forced subtitle preference survives reordered Spanish tracks and respects Off',()=>{const rows=[{lang:'es',url:'full',forced:false},{lang:'es',url:'forced',forced:true}];assert.equal(subtitleDecision({subtitles:rows,manual:{enabled:true,language:'es',forced:true}}).url,'forced');assert.equal(subtitleDecision({subtitles:rows.slice().reverse(),manual:{enabled:true,language:'es',forced:false}}).url,'full');assert.equal(subtitleDecision({subtitles:rows,manual:{enabled:false,language:'es',forced:true}}),null);assert.equal(subtitleDecision({subtitles:[rows[0]],manual:{enabled:true,language:'es',forced:true}}),null);});
test('choosing an unmarked full subtitle does not switch back to the forced Spanish track',()=>{const subtitles=[{lang:'es',url:'signs',forced:true},{lang:'es',url:'full'}];assert.equal(subtitleDecision({subtitles,manual:{enabled:true,language:'es',forced:false}}).url,'full');assert.equal(subtitleDecision({subtitles:subtitles.slice().reverse(),manual:{enabled:true,language:'es',forced:true}}).url,'signs');});
