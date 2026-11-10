import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function fixture(responses){
 const calls=[];
 const context=vm.createContext({Buffer,Date,console,module:{exports:{}},require:name=>{
  if(name==='./audio-language')return require('../companion/lib/audio-language.js');
  if(name==='fs')return {readFileSync(){throw new Error('No fixture cache')},writeFileSync(){}};
  if(name==='http'||name==='https')return {request(){throw new Error('Network forbidden in fixture')}};
  if(name==='./dnsx'||name==='./upstream')return {};
  return require(name);
 },fixtureCall:(path,bean,callback)=>{calls.push(path);const value=responses[path];callback(value instanceof Error?value:null,value instanceof Error?null:value);}});
 vm.runInContext(readFileSync(new URL('../companion/lib/magis.js',import.meta.url),'utf8')+'\ncall=fixtureCall;module.exports.fixtureSlb=getSlb;',context);
 return {calls,core:context.module.exports,run:source=>vm.runInContext(source,context),read:()=>new Promise((resolve,reject)=>context.module.exports.fixtureSlb((error,result)=>error?reject(error):resolve(result)))};
}
const usable={cdn_list:[{tag:'vod',main_addr:'https://vod.example',url_list:[{tag:'free',sign_type:'cfl',url:'fixture-auth'}]}]};
test('VOD discovery tries v14 when v15 responds successfully without usable free routes',async()=>{
 const f=fixture({'v15/getSlbInfo':{cdn_list:[]},'v14/getSlbInfo':usable});
 assert.equal(await f.read(),usable);assert.deepEqual(f.calls,['v15/getSlbInfo','v14/getSlbInfo']);
 assert.equal(await f.read(),usable);assert.equal(f.calls.length,2,'Usable result is cached');
});
test('VOD discovery keeps a usable v15 result and also falls back on v15 errors',async()=>{
 let f=fixture({'v15/getSlbInfo':usable});assert.equal(await f.read(),usable);assert.equal(f.calls.length,1);
 f=fixture({'v15/getSlbInfo':new Error('v15 unavailable'),'v14/getSlbInfo':usable});assert.equal(await f.read(),usable);assert.equal(f.calls.length,2);
});
test('VOD discovery never turns paid-only routes into free routes or caches unusable results',async()=>{
 const paid={cdn_list:[{tag:'vod',main_addr:'https://paid.example',url_list:[{tag:'paid',sign_type:'cfl',url:'fixture-auth'}]}]};
 const f=fixture({'v15/getSlbInfo':paid,'v14/getSlbInfo':paid});
 await assert.rejects(f.read(),/no expuso CDN de vod libre/);await assert.rejects(f.read(),/no expuso CDN de vod libre/);assert.equal(f.calls.length,4);
});
test('VOD resolution preserves the supplied scheme and credentials separately for each CDN',async()=>{
 const context=vm.createContext({Buffer,Date,console,module:{exports:{}},require:name=>{
  if(name==='./audio-language')return require('../companion/lib/audio-language.js');
  if(name==='fs')return {readFileSync(){throw new Error('No cache')},writeFileSync(){}};
  if(name==='http'||name==='https')return {request(){throw new Error('Network forbidden')}};
  if(name==='./dnsx'||name==='./upstream')return {};return require(name);
 }});
 vm.runInContext(readFileSync(new URL('../companion/lib/magis.js',import.meta.url),'utf8')+`
 loadPlay=function(id,series,cb){cb(null,{play:{name:'Fixture'},episode:{},tracks:[{contentId:'media-1',videoFormat:'ts',licenseList:[{license:'fixture-license'}]}]});};
 getSlb=function(cb){cb(null,{cdn_list:[
 {tag:'vod',main_addr:'http://plain.example:8080',url_list:[{tag:'free',sign_type:'cfl',url:'plain-auth'}]},
 {tag:'vod',main_addr:'https://secure.example',url_list:[{tag:'free',sign_type:'cfl',url:'secure-auth'}]},
 {tag:'vod',main_addr:'bare.example',url_list:[{tag:'free',sign_type:'cfl',url:'bare-auth'}]}
 ]});};`,context);
 const stream=await new Promise((resolve,reject)=>context.module.exports.resolve('media-1','',{},(e,s)=>e?reject(e):resolve(s)));
 assert.equal(stream.url,'http://plain.example:8080/vod/media-1_media.ts');assert.equal(stream.headers['Content-Auth'],'plain-auth');
 assert.equal(stream.backupUrls[0].url,'https://secure.example/vod/media-1_media.ts');assert.equal(stream.backupUrls[0].headers['Content-Auth'],'secure-auth');
 assert.equal(stream.backupUrls[1].url,'https://bare.example/vod/media-1_media.ts');assert.equal(stream.backupUrls[1].headers['Content-Auth'],'bare-auth');
});
test('automatic resolution prefers a declared Latin Spanish variant and respects explicit nondefault variants',async()=>{
 const f=fixture({});f.run(`loadPlay=function(id,series,cb){cb(null,{play:{},episode:{},tracks:[{contentId:'pt',videoFormat:'mp4',audioInfo:'por',licenseList:[{license:'fixture'}]},{contentId:'es',videoFormat:'mp4',audioInfo:'es-ES',licenseList:[{license:'fixture'}]},{contentId:'lat',videoFormat:'mp4',audioInfo:'es-MX',licenseList:[{license:'fixture'}]}]});};getSlb=function(cb){cb(null,{cdn_list:[{tag:'vod',main_addr:'https://vod.example',url_list:[{tag:'free',sign_type:'cfl',url:'fixture'}]}]});};`);
 const resolve=options=>new Promise((yes,no)=>f.core.resolve('title','',options,(error,result)=>error?no(error):yes(result)));
 const automatic=await resolve({preferredAudio:'es',trackIndex:0});assert.equal(automatic.trackIndex,2);assert.ok(automatic.url.endsWith('/lat_media.mp4'));assert.equal(automatic.availableTracks[2].audio,'es-MX');const manual=await resolve({preferredAudio:'es',trackIndex:1});assert.equal(manual.trackIndex,1);const explicitFirst=await resolve({preferredAudio:'es',trackIndex:0,trackExplicit:true});assert.equal(explicitFirst.trackIndex,0);assert.ok(explicitFirst.url.endsWith('/pt_media.mp4'));
});
test('VOD metadata preserves group quality and parses fractional FPS without mutating provider tracks',()=>{
 const f=fixture({});
 const result=JSON.parse(f.run(`JSON.stringify((function(){var input={totalMovieList:[{quality:'1080p',movieList:[{contentId:'one',frameRate:'24000/1001',videoFormat:'mp4'}]},{quality:'2160p',movieList:[{contentId:'two',fps:'60',videoFormat:'mp4'}]}]};return {tracks:collectTracks(input).map(trackSummary),mutated:!!input.totalMovieList[0].movieList[0].groupQuality,decimal:trackFrameRate({fps:'23,976'}),invalid:trackFrameRate({fps:'1/0'}),interlaced:trackHeight({quality:'1080i'})};})())`));
 assert.equal(result.tracks[0].height,1080);assert.equal(result.tracks[0].quality,'1080p');assert.ok(Math.abs(result.tracks[0].frameRate-23.976)<0.001);assert.equal(result.tracks[1].height,2160);assert.equal(result.tracks[1].frameRate,60);assert.equal(result.mutated,false);assert.equal(result.decimal,23.976);assert.equal(result.invalid,0);assert.equal(result.interlaced,1080);
});
