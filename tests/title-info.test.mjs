import test from 'node:test';import assert from 'node:assert/strict';import {qualityLabel,titleBadges} from '../browser/title-info.js';
test('title info shows provider quality without fabricating resolution, audio channels or HDR',()=>{
 assert.equal(qualityLabel({quality:'720p'}),'720p');assert.equal(qualityLabel({height:2160}),'4K');assert.equal(qualityLabel({height:1440}),'1440p');assert.equal(qualityLabel({quality:'HD'}),'HD');assert.equal(qualityLabel({quality:'3'}),'');assert.equal(qualityLabel({}),'');
 assert.deepEqual(titleBadges({audio:'kor',tracks:[{quality:'720p',codec:'H265',audio:'kor'}],subtitles:[{lang:'en'},{lang:'es'}]}),['720p','HEVC','Coreano','Subtítulos: Inglés / Español']);
 assert.deepEqual(titleBadges({tracks:[{quality:'720p',codec:'H265',audio:'kor'},{quality:'1080p',codec:'H264',audio:'es-MX'}]}, {},-1),['720p / 1080p','HEVC / H.264','Coreano / Español latino']);
 assert.deepEqual(titleBadges({},{}),[]);assert.equal(titleBadges({tracks:[{quality:'720p'},{quality:'1080p'}]}, {},1)[0],'1080p');
});
test('individual variants show declared FPS and bitrate, aggregate does not mix metrics from different versions',()=>{
 const info={tracks:[{quality:'720p',frameRate:24000/1001,bitrateKbps:3500},{quality:'2160p',frameRate:60,bitrateKbps:18000}]};
 assert.deepEqual(titleBadges(info,{},0),['720p','23.976 FPS','3.5 Mbps']);
 assert.deepEqual(titleBadges(info,{},1),['4K','60 FPS','18 Mbps']);
 assert.deepEqual(titleBadges(info,{},-1),['720p / 4K']);
 assert.deepEqual(titleBadges({tracks:[{frameRate:0,bitrateKbps:0}]}),[]);
});
