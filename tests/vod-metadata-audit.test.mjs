import test from 'node:test';import assert from 'node:assert/strict';import {auditVodMetadata} from '../browser/vod-metadata-audit.js';
test('metadata audit is explicit, bounded and excludes transport secrets',async()=>{
 const calls=[],secret='PRIVATE_SESSION_VALUE';const core={detail(id,cb){calls.push(['detail',id]);cb(null,{item:{title:'Serie',year:'2026',url:secret,headers:{auth:secret}},episodes:[{}],seasons:[{},{}]});},mediaInfo(id,series,cb){calls.push(['mediaInfo',id,series]);cb(null,{audio:'es-MX',url:secret,tracks:[{audio:'es-MX',codec:'H264',format:'mp4',url:secret}],subtitles:[{lang:'es',format:'vtt',url:secret}]});}};
 const result=await auditVodMetadata(core,{screen:'detail',detail:{id:'root',seasonId:'season2'},detailEpisode:{id:'episode2'}});
 assert.deepEqual(calls,[['detail','root'],['mediaInfo','episode2','season2']]);assert.equal(result.seasons,2);assert.equal(result.observed,null);assert.ok(!JSON.stringify(result).includes(secret));assert.deepEqual(result.media.subtitles,[{language:'es',format:'vtt'}]);
 await assert.rejects(auditVodMetadata(core,{screen:'home'}),/Abre la ficha/);
});
