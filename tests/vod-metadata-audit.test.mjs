import test from 'node:test';import assert from 'node:assert/strict';import {auditVodMetadata} from '../browser/vod-metadata-audit.js';
test('metadata audit is explicit, bounded and excludes transport secrets',async()=>{
 const calls=[],secret='PRIVATE_SESSION_VALUE';const core={detail(id,cb){calls.push(['detail',id]);cb(null,{item:{title:'Serie',year:'2026',url:secret,headers:{auth:secret}},episodes:[{}],seasons:[{},{}]});},mediaInfo(id,series,cb){calls.push(['mediaInfo',id,series]);cb(null,{audio:'es-MX',url:secret,tracks:[{audio:'es-MX',codec:'H264',format:'mp4',url:secret}],subtitles:[{lang:'es',format:'vtt',url:secret}]});}};
 const result=await auditVodMetadata(core,{screen:'detail',detail:{id:'root',seasonId:'season2'},detailEpisode:{id:'episode2'}});
 assert.deepEqual(calls,[['detail','root'],['mediaInfo','episode2','season2']]);assert.equal(result.seasons,2);assert.equal(result.observed,null);assert.ok(!JSON.stringify(result).includes(secret));assert.deepEqual(result.media.subtitles,[{language:'es',format:'vtt'}]);
 await assert.rejects(auditVodMetadata(core,{screen:'home'}),/Abre la ficha/);
});
test('audit exposes provider forced-subtitle metadata without resource URLs',async()=>{
 const core={detail(id,cb){cb(null,{item:{}});},mediaInfo(id,series,cb){cb(null,{subtitles:[{lang:'es',format:'srt',forced:true,name:'Textos',url:'https://private.invalid/sub'}]});}};
 const result=await auditVodMetadata(core,{screen:'detail',detail:{id:'one'}});assert.deepEqual(result.media.subtitles,[{language:'es',format:'srt',name:'Textos',forced:true}]);assert.ok(!JSON.stringify(result).includes('private.invalid'));
});
test('movie audit requests the title, not its single playback entry',async()=>{let requested;const core={detail(id,cb){cb(null,{item:{type:'movie'},episodes:[{id:'only720'}],seasons:[]});},mediaInfo(id,series,cb){requested={id,series};cb(null,{tracks:[{quality:'1080p'}]});}};const result=await auditVodMetadata(core,{screen:'detail',detail:{id:'movie'},detailEpisode:{id:'only720'}});assert.deepEqual(requested,{id:'movie',series:''});assert.equal(result.requestScope.kind,'movie');assert.equal(result.media.tracks[0].quality,'1080p');});
