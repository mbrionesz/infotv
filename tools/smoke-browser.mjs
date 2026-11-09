import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { browserHarness } from './browser-harness.mjs';

const temporary = mkdtempSync(path.join(tmpdir(), 'xuper-hls-'));
const seen = [];
const appRoot = path.resolve('app');
const widgetPolicy = readFileSync(path.join(appRoot,'config.xml'),'utf8').match(/<tizen:content-security-policy>([^<]+)</)[1];
const media = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Auth,Content-License,App,App-Version,Range');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  seen.push({ path:req.url, auth:req.headers['content-auth'], license:req.headers['content-license'] });
  const publicStream=req.url.startsWith('/public/');
  const fifth=req.url.startsWith('/fifth/');
  const backup=req.url.startsWith('/backup/');
  if (!publicStream&&(req.headers['content-auth'] !== (fifth?'fifth-auth':backup?'backup-auth':'local-test') || req.headers['content-license'] !== (fifth?'fifth-license':backup?'backup-license':'local-license'))) { res.writeHead(403); res.end(); return; }
  if(req.url==='/denied.m3u8'){res.writeHead(403);res.end('Denied');return;}
  const file = path.resolve(temporary, '.' + req.url.replace(/^\/(?:backup|public|fifth)/,''));
  if (!file.startsWith(temporary + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    res.setHeader('Content-Type', file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : file.endsWith('.bin') ? 'application/octet-stream' : 'video/mp2t');
    res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
const appRequests = [];
const server = http.createServer((req, res) => {
  appRequests.push(req.url);
  res.setHeader('Content-Security-Policy',widgetPolicy);
  if(req.url==='/vendor/core-worker.js')res.setHeader('Content-Security-Policy',widgetPolicy.replace(/connect-src[^;]+;/,"connect-src 'self' http://127.0.0.1:*;"));
  if(req.url==='/vendor/native-worker-probe.js'){res.setHeader('Content-Type','text/javascript');res.end(`self.tizentvwasm={SocketsHostBindings:new Proxy({},{get:function(){return function(){return -1}}}),SockFlags:{SOCK_CLOEXEC:524288,SOCK_NONBLOCK:2048}};importScripts('/vendor/native-worker.js');`);return;}
  if(req.url==='/addon-fixture.m3u'){res.setHeader('Content-Type','text/plain');res.end('#EXTM3U\n#EXTINF:-1 group-title="Noticias",Canal M3U fixture\nhttp://127.0.0.1:'+media.address().port+'/public/live.m3u8');return;}
  if(req.url==='/native-list.m3u'){res.setHeader('Content-Type','text/plain');res.end('#EXTM3U\n#EXTINF:-1,Native bridge fixture\nhttps://example.com/fixture.m3u8');return;}
  if (req.url.includes('$WEBAPIS/')) { res.setHeader('Content-Type','text/javascript'); res.end('// No Samsung AVPlay in desktop Chromium.'); return; }
  const file = path.resolve(appRoot, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(appRoot + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
let browser;
try {
  writeFileSync(path.join(temporary,'key.bin'),randomBytes(16));
  writeFileSync(path.join(temporary,'keyinfo'),'key.bin\n'+path.join(temporary,'key.bin')+'\n000102030405060708090a0b0c0d0e0f\n');
  execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size=1280x720:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','8','-c:v','libx264','-threads','1','-profile:v','baseline','-pix_fmt','yuv420p','-g','48','-sc_threshold','0','-c:a','aac','-ac','2','-hls_time','2','-hls_list_size','0','-hls_flags','independent_segments','-hls_key_info_file',path.join(temporary,'keyinfo'),'-hls_segment_filename',path.join(temporary,'part%02d.ts'),path.join(temporary,'live.m3u8')]);
  server.listen(0,'127.0.0.1'); media.listen(0,'127.0.0.1');
  await Promise.all([once(server,'listening'),once(media,'listening')]);
  const streamUrl = `http://127.0.0.1:${media.address().port}/live.m3u8`;
  browser = await browserHarness();
  await browser.command('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (SMART-TV; Tizen 9.0) AppleWebKit/537.36 Chrome/130 Safari/537.36'});
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`
    Object.defineProperty(window,'XuperStandalone',{configurable:true,set:function(api){
      Object.defineProperty(window,'XuperStandalone',{configurable:true,writable:true,value:api});
      var core=api.core;
      var originalCall=core.call;
      core.call=function(method,payload,cb){
        if(method==='catalogDiscover'||method==='catalogFullPage'||method==='catalogPage'||method==='catalogQuery'||method==='catalogSearch'){
          var rows=Array.from({length:36},function(_,i){return {id:(payload.root==='series'?'series-test-':'test-')+i,title:'Título de prueba '+i,year:'2024',country:'Chile',poster:i<6?'assets/catalog/sintel.jpg':''}});
          if(method==='catalogDiscover'){cb(null,{root:payload.root,period:payload.period||'recent',latestTitle:'Novedades recientes',latest:rows.slice(0,12),editorial:rows.slice(0,12),genres:['Drama'],countryOptions:{featured:[],all:[{id:'Chile',name:'Chile'}]},note:'Datos de prueba'});return;}
          cb(null,{items:rows,total:21000,loaded:21000,facets:{genres:['Drama'],years:['2024'],countries:['Chile'],resolutions:[]},hasMore:true});return;
        }
        return originalCall(method,payload,cb);
      };
      core.detail=function(id,cb){var series=id.indexOf('series-test-')===0;cb(null,{item:{id:id,title:series?'Serie local de prueba':'Película local de prueba',type:series?'teleplay':'movie',genres:[]},episodes:series?[{id:'episode-1',number:1,title:'Capítulo de prueba',seriesNumber:1},{id:'episode-2',number:2,title:'Segundo capítulo',seriesNumber:2}]:[],seasons:[]})};
      core.mediaInfo=function(id,seriesId,cb){cb(null,{audio:'es',subtitles:[]})};
      core.resolve=function(id,seriesId,options,cb){window.vodResolved=window.vodResolved||[];vodResolved.push(id);cb(null,{url:${JSON.stringify(streamUrl)},mime:'application/vnd.apple.mpegurl',headers:{'Content-Auth':'local-test','Content-License':'local-license'}})};
      core.home=function(root,page,cb){cb(null,{items:[]})};
      core.getLiveCategories=function(cb){cb(null,[{id:'test',columnId:'test',name:'Pruebas locales'}])};
      core.getLiveChannels=function(col,page,size,cb){cb(null,[{channelCode:'local',name:'Canal de prueba local',index:1},{channelCode:'local2',name:'Segundo canal de prueba',index:2}],false)};
      core.resolveLive=function(code,cb){cb(null,{url:${JSON.stringify(streamUrl)},mime:'application/vnd.apple.mpegurl',headers:{'Content-Auth':'local-test','Content-License':'local-license'}})};
    }});
  `});
  await browser.command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/index.html`});
  await browser.waitFor('!!window.__xuper && __xuper.state.screen === "home"');
  assert.equal(await browser.evaluate('!!document.getElementById("infotv-connection")'),false);
  if (!(await browser.evaluate('!!window.XuperStandalone'))) throw new Error('Standalone startup: '+browser.errors.join('\n'));
  assert.equal(await browser.evaluate('XuperStandalone.version'),'0.10.2');
  assert.equal(await browser.evaluate('__xuper.channels.length'),2);
  mkdirSync('dist',{recursive:true});
  await browser.screenshot('dist/browser-home.png');
  await browser.command('Emulation.setDeviceMetricsOverride',{width:3840,height:2160,deviceScaleFactor:1,mobile:false});
  await browser.waitFor('document.getElementById("app").getBoundingClientRect().width>3800');
  assert.ok(await browser.evaluate('document.getElementById("app").getBoundingClientRect().right<=innerWidth+2'));
  await browser.screenshot('dist/home-4k-v060.png');
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  await browser.waitFor('document.getElementById("app").getBoundingClientRect().width<2000');
  await browser.evaluate('__xuper.focus(".live-focus");__xuper.key(39);__xuper.key(39);__xuper.key(39)');
  assert.equal(await browser.evaluate('__xuper.state.focus === document.querySelectorAll(".dashboard-action")[3]'),true);
  await browser.evaluate('XuperCatalog.open("movies")');
  await browser.waitFor('document.querySelectorAll(".xt-discovery-card").length>0');await browser.evaluate('Array.from(document.querySelectorAll(".xt-discovery-actions button")).find(function(button){return button.textContent==="Explorar catálogo"}).click()');
  await browser.waitFor('!!document.getElementById("xt-catalog") && document.querySelectorAll(".xt-catalog-card").length===36');
  await browser.screenshot('dist/browser-movies.png');
  await browser.evaluate('XuperCatalog.close()');
  await browser.evaluate('__xuper.openSearch()');
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}));document.dispatchEvent(new KeyboardEvent("keyup",{keyCode:10009,bubbles:true}))');
  assert.equal(await browser.evaluate('__xuper.state.screen'),'home');
  const nativeProbe=await browser.evaluate('new Promise(function(resolve,reject){var worker=new Worker("/vendor/native-worker-probe.js");var timer=setTimeout(function(){worker.terminate();reject(new Error("Native wasm initialization timeout"))},10000);worker.onmessage=function(event){clearTimeout(timer);worker.terminate();resolve(event.data)};worker.onerror=function(){clearTimeout(timer);worker.terminate();reject(new Error("Native wasm worker initialization failed"))}})');
  assert.equal(nativeProbe.ready,false);assert.equal(nativeProbe.reason,'No inició HTTP/TLS');
  const worker = await browser.evaluate('new Promise(function(resolve){XuperStandalone.core.call("parseM3u",{text:"#EXTM3U\\n#EXTINF:-1,Prueba worker\\nhttps://example.com/test.m3u8"},function(error,result){resolve({error:error&&error.message,count:result&&result.channels.length})})})');
  assert.equal(worker.error,null);assert.equal(worker.count,1);
  const cache=await browser.evaluate('new Promise(function(resolve){XuperStandalone.core.diagnostics(function(error,data){resolve(data)})})');
  assert.equal(cache.worker,true);assert.equal(cache.cryptoVerified,true);assert.equal(cache.cache,true);
  const posterURL=`http://127.0.0.1:${server.address().port}/images/icon-large.png`;
  const thumb=await browser.evaluate('new Promise(function(resolve,reject){XuperStandalone.core.poster('+JSON.stringify(posterURL)+',function(error,data){if(error){reject(error.message);return}createImageBitmap(data.blob).then(function(bitmap){var size={w:bitmap.width,h:bitmap.height};bitmap.close();resolve(size)})})})');
  assert.ok(thumb.w<=320&&thumb.h<=480);
  await new Promise(resolve=>setTimeout(resolve,50));
  const beforePoster=appRequests.filter(url=>url==='/images/icon-large.png').length;
  await browser.evaluate('new Promise(function(resolve){XuperStandalone.core.poster('+JSON.stringify(posterURL)+',function(error,data){resolve(!!data)})})');
  assert.equal(appRequests.filter(url=>url==='/images/icon-large.png').length,beforePoster);
  // Persist an expired category page. The real worker must return it promptly
  // while its refresh is denied by the fixture's worker CSP (offline simulation).
  await browser.evaluate(`new Promise(function(resolve,reject){var request=indexedDB.open('xuper-tizen-v3',1);request.onsuccess=function(){var db=request.result;var tx=db.transaction('metadata','readwrite');tx.objectStore('metadata').put({key:'liveCategories:{}',value:{categories:[{id:'cached-test',name:'Guardada sin conexión'}]},saved:Date.now()-3600000,expires:Date.now()-1000});tx.oncomplete=function(){db.close();resolve()};tx.onerror=reject};request.onerror=reject})`);
  const stale=await browser.evaluate('new Promise(function(resolve){var start=performance.now();XuperStandalone.core.call("liveCategories",{},function(error,data){resolve({error:error&&error.message,stale:data&&data.stale,name:data&&data.categories[0].name,ms:performance.now()-start})})})');
  assert.equal(stale.error,null);assert.equal(stale.stale,true);assert.equal(stale.name,'Guardada sin conexión');assert.ok(stale.ms<1000);
  await browser.waitFor('document.querySelectorAll(".dashboard-poster").length>=6');
  await browser.evaluate('window.homePosterActions=Array.from(document.querySelectorAll(".dashboard-poster")).map(function(node){return node._activate})');
  for(let poster=0;poster<6;poster++){
    await browser.evaluate('homePosterActions['+poster+']()');
    await browser.waitFor('__xuper.state.screen==="detail"');
    await browser.evaluate('__xuper.focus(document.querySelector(".detail-btn"));__xuper.key(13)');
    await browser.waitFor('__xuper.state.screen==="player"&&document.getElementById("player-video").currentTime>0.2',150);
    assert.equal(await browser.evaluate('__xuper.state.detail.id'),'test-'+poster);
    await new Promise(resolve=>setTimeout(resolve,300));
    for(let back=0;back<5&&await browser.evaluate('__xuper.state.screen')!=='home';back++){await new Promise(resolve=>setTimeout(resolve,300));await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');}
    assert.equal(await browser.evaluate('__xuper.state.screen'),'home');
  }
  console.log('PASS: all six home posters open and decode their movie fixture.');
  const vodResults=[];
  for(const kind of ['movies','series']){
    await browser.evaluate('XuperCatalog.open('+JSON.stringify(kind)+',{browse:true})');
    await browser.waitFor('document.querySelectorAll(".xt-catalog-card").length===36');
    await browser.evaluate('for(var i=0;i<10&&!document.querySelector(".xt-catalog-card.selected");i++)XuperCatalog.handle({keyCode:40})');
    for(let row=0;row<6;row++){
      for(let column=0;column<6;column++){
        const visible=await browser.evaluate('(function(){var card=document.querySelector(".xt-catalog-card.selected"),grid=document.querySelector(".xt-catalog-grid"),a=card.getBoundingClientRect(),b=grid.getBoundingClientRect();return a.top>=b.top-2&&a.bottom<=b.bottom+2})()');assert.equal(visible,true);
        if(column<5)await browser.evaluate('XuperCatalog.handle({keyCode:'+(row%2===0?39:37)+'})');
      }
      if(row<5)await browser.evaluate('XuperCatalog.handle({keyCode:40})');
    }
    await browser.evaluate('XuperCatalog.close();XuperCatalog.open('+JSON.stringify(kind)+',{browse:true});for(var i=0;i<10&&!document.querySelector(".xt-catalog-card.selected");i++)XuperCatalog.handle({keyCode:40});XuperCatalog.handle({keyCode:13})');
    await browser.waitFor('__xuper.state.screen==="detail"');
    await browser.evaluate('__xuper.focus(document.querySelector(".detail-btn"));__xuper.key(13)');
    await browser.waitFor('__xuper.state.screen==="player"&&document.querySelector("#player-video").currentTime>0.2',150);
    assert.equal(await browser.evaluate('__xuper.state.playerMode'),'vod');
    assert.equal(await browser.evaluate('Array.from(document.querySelectorAll(".detail-btn")).some(function(el){return el._kind==="subscribe"})'),false);
    if(kind==='series')assert.ok(await browser.evaluate('document.querySelectorAll(".detail-episode").length>0'));
    const result=await browser.evaluate('({kind:__xuper.state.detail.type,startupMs:XuperPlayer.diagnostics.startupMs,mediaTime:document.querySelector("#player-video").currentTime})');vodResults.push(result);
    for(let back=0;back<4&&await browser.evaluate('__xuper.state.screen')!=='detail';back++){await new Promise(resolve=>setTimeout(resolve,300));await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');}
    if(kind==='series'){
      await browser.evaluate('__xuper.focus(document.querySelectorAll(".detail-episode")[1]);__xuper.key(13)');
      await browser.waitFor('__xuper.state.screen==="player"&&vodResolved.indexOf("episode-2")>=0&&document.getElementById("player-video").currentTime>0.2',150);
      assert.equal(await browser.evaluate('__xuper.state.playerEpisode.id'),'episode-2');
      for(let back=0;back<3&&await browser.evaluate('__xuper.state.screen')!=='detail';back++){
        await new Promise(resolve=>setTimeout(resolve,300));await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');
      }
      assert.equal(await browser.evaluate('__xuper.state.screen'),'detail');
    }

    await browser.evaluate('__xuper.focus(document.querySelector(".detail-btn"));__xuper.key(13)');
    assert.equal(await browser.evaluate('__xuper.state.screen'),'player');
    for(const screen of ['detail','home']){
      for(let back=0;back<3&&await browser.evaluate('__xuper.state.screen')!==screen;back++){
        await new Promise(resolve=>setTimeout(resolve,300));
        await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');
      }
      assert.equal(await browser.evaluate('__xuper.state.screen'),screen);
    }
    await browser.evaluate('if(XuperCatalog.active)XuperCatalog.close()');
  }
  await browser.evaluate('homePosterActions[0]()');
  await browser.waitFor('__xuper.state.screen==="detail"');
    await browser.evaluate('__xuper.focus(document.querySelector(".detail-btn"));__xuper.key(13)');
    await browser.waitFor('__xuper.state.screen==="player"&&document.getElementById("player-video").currentTime>0.2',150);
  assert.equal(await browser.evaluate('__xuper.state.playerEpisode'),null,'A movie must not inherit the last series episode');
  await new Promise(resolve=>setTimeout(resolve,300));await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');
  console.log('PASS VOD: actual detail, episode selection, HLS decode and fullscreen/back for movie and series fixtures: '+JSON.stringify(vodResults));
  assert.equal(appRequests.includes('/vendor/vod.js'),false,'The progressive VOD libraries must not load for HLS');
  await browser.evaluate('XuperGuide.open()');
  await browser.waitFor('document.querySelectorAll(".xt-guide-channels button:not([hidden])").length===2');
  const sameRows=await browser.evaluate('(()=>{var nodes=Array.from(document.querySelectorAll(".xt-guide-channels button"));XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:40});XuperGuide.handle({keyCode:38});XuperGuide.handle({keyCode:37});return nodes.every((node,i)=>node===document.querySelectorAll(".xt-guide-channels button")[i])})()');
  assert.equal(sameRows,true);
  await browser.screenshot('dist/guide-v3.png');
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:404,bubbles:true}))');
  assert.equal(await browser.evaluate('!!document.querySelector(".xt-keyboard")'),true);
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');
  assert.equal(await browser.evaluate('!!document.querySelector(".xt-keyboard")'),false);
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:39,bubbles:true}));document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:13,bubbles:true}))');
  await browser.waitFor('document.getElementById("player-video").currentTime>0.5',180);
  await browser.waitFor('document.querySelector(".xt-playback-info").textContent.includes("1280×720")');
  assert.equal(await browser.evaluate('getComputedStyle(document.querySelector(".xt-guide-channels button")).fontSize'),'24px');
  await browser.screenshot('dist/guide-v3.png');
  await browser.waitFor('!XuperGuide.active && document.getElementById("player-video").currentTime>0.5',180);
  await browser.evaluate('__xuper.show("home")');
  await browser.evaluate('XuperGuide.close()');
  await browser.evaluate('__xuper.show("player");__xuper.key(37)');
  await browser.waitFor('document.querySelector(".infotv-channel-credit").getBoundingClientRect().width>0');
  assert.equal(await browser.evaluate('document.querySelector(".infotv-channel-credit").textContent'),'XuperTizen by Matias');
  await browser.screenshot('dist/browser-channels.png');
  await browser.evaluate('__xuper.key(39)');
  assert.equal(await browser.evaluate('document.querySelector(".infotv-channel-credit").getBoundingClientRect().width'),0);
  await browser.waitFor('document.getElementById("player-video").currentTime > 0.5',180);
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.engine'),'hls.js');
  await browser.waitFor('document.querySelector(".xt-playback-info").textContent.includes("1280×720")');
  const progress = await browser.evaluate('document.getElementById("player-video").currentTime');
  assert.ok(progress>0);
  assert.ok(seen.some(request=>request.path.endsWith('.m3u8')));
  assert.ok(seen.some(request=>request.path.endsWith('.ts')));
  assert.ok(seen.some(request=>request.path.endsWith('/key.bin')));
  assert.equal(seen.some(request=>request.path.includes('/media/abort')),false);
  assert.ok(seen.every(request=>request.auth==='local-test' && request.license==='local-license'));
  assert.equal(appRequests.some(request=>request.includes('/rpc/')),false);
  await browser.screenshot('dist/standalone-hls-test.png');
  await browser.waitFor('XuperPlayer.diagnostics.liveLatency.mode==="stable"');
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.liveLatency.targetSegments'),3);
  await browser.evaluate('document.getElementById("player-video").pause()');
  assert.equal(await browser.evaluate('document.getElementById("player-video").paused'),true);
  await browser.evaluate('document.getElementById("player-video").play()');
  await browser.waitFor('!document.getElementById("player-video").paused');
  await browser.evaluate('__xuper.key(40)');
  await browser.waitFor('XuperPlayer.diagnostics.engine === "hls.js" && document.getElementById("player-video").currentTime>0.5',180);
  await browser.evaluate('__xuper.show("home")');
  await browser.waitFor('XuperPlayer.diagnostics.engine === ""');
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.error'),'');
  await browser.evaluate('XuperStandalone.core.resolveLive=function(code,cb){cb(null,{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/denied.m3u8'))+',mime:"application/vnd.apple.mpegurl",headers:{"Content-Auth":"local-test","Content-License":"local-license"}})};__xuper.show("player")');
  await browser.waitFor('XuperPlayer.diagnostics.httpStatus===403 && !!XuperPlayer.diagnostics.error');
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.stage'),'manifest');
  await browser.evaluate('XuperStandalone.handleRemote({keyCode:406})');
  await browser.waitFor('!!document.querySelector(".xt-diagnostics")');
  assert.equal(await browser.evaluate('document.querySelector(".xt-diagnostics pre").textContent.includes("local-license")'),false);
  await browser.screenshot('dist/error-manifest-403.png');
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:405,bubbles:true}))');
  await browser.waitFor('document.querySelector(".xt-diagnostics pre").textContent.includes("dnsOverride")');
  assert.equal(await browser.evaluate('JSON.parse(document.querySelector(".xt-diagnostics pre").textContent).red.dnsOverride'),false);
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}));__xuper.show("home")');
  await browser.evaluate('XuperStandalone.core.resolveLive=function(code,cb){cb(null,{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/denied.m3u8'))+',mime:"application/vnd.apple.mpegurl",headers:{"Content-Auth":"local-test","Content-License":"local-license"},backupUrls:[{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/backup/live.m3u8'))+',headers:{"Content-Auth":"backup-auth","Content-License":"backup-license"}}]})};__xuper.show("player")');
  await browser.waitFor('XuperPlayer.diagnostics.cdnAttempt===2 && document.getElementById("player-video").currentTime>0.5',180);
  const backups=seen.filter(request=>request.path.startsWith('/backup/'));
  assert.ok(backups.some(request=>request.path.endsWith('.ts')));assert.ok(backups.some(request=>request.path.endsWith('/key.bin')));
  assert.ok(backups.every(request=>request.auth==='backup-auth'&&request.license==='backup-license'));
  await browser.evaluate('__xuper.show("home");XuperStandalone.core.resolveLive=function(code,cb){cb(null,{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/denied.m3u8'))+',mime:"application/vnd.apple.mpegurl",headers:{"Content-Auth":"local-test","Content-License":"local-license"},backupUrls:[{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/absent-two.m3u8'))+',headers:{"Content-Auth":"local-test","Content-License":"local-license"}},{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/absent-three.m3u8'))+',headers:{"Content-Auth":"local-test","Content-License":"local-license"}},{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/absent-four.m3u8'))+',headers:{"Content-Auth":"local-test","Content-License":"local-license"}},{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/fifth/live.m3u8'))+',headers:{"Content-Auth":"fifth-auth","Content-License":"fifth-license"}}]})};__xuper.show("player")');
  await browser.waitFor('XuperPlayer.diagnostics.cdnAttempt===5&&document.getElementById("player-video").currentTime>0.5',250);
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.cdnAvailable'),5);
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.cdnReceived'),5);
  assert.ok(seen.filter(item=>item.path.startsWith('/fifth/')).every(item=>item.auth==='fifth-auth'&&item.license==='fifth-license'));
  await browser.evaluate('__xuper.show("home");__xuper.settingsPanel("netdiag");__xuper.focus(".xt-open-diagnostics");__xuper.key(13)');
  await browser.waitFor('!!document.querySelector(".xt-diagnostics .xt-diag-network")');
  assert.equal(await browser.evaluate('document.querySelectorAll(".xt-diag-summary>div").length'),4);
  const cdnReport=await browser.evaluate('XuperStandalone.probeCdns()');assert.ok(cdnReport.results.some(row=>row.httpStatus===403));
  await browser.evaluate('document.querySelector(".xt-diag-cdn").click()');await browser.waitFor('document.querySelectorAll(".xt-cdn-row").length>0');
  await browser.command('Emulation.setDeviceMetricsOverride',{width:3840,height:2160,deviceScaleFactor:1,mobile:false});
  await browser.screenshot('dist/diagnostics-4k-v060.png');
  await browser.evaluate('document.querySelector(".xt-diag-close").click();__xuper.settingsPanel("about")');
  assert.equal(await browser.evaluate('document.querySelector("#settings-right .is-active").textContent.includes("LG")'),false);
  await browser.screenshot('dist/settings-4k-v060.png');
  await browser.evaluate('__xuper.settingsPanel("playback");document.querySelector(".xt-setting-action")._activate()');
  assert.equal(await browser.evaluate('localStorage.getItem("xt.lowDelay720")'),"on");
  assert.equal(await browser.evaluate('document.querySelectorAll(".xt-playback-card .pb-row").length'),5);
  await browser.evaluate('__xuper.focus(document.querySelector(".xt-playback-card .xt-setting-action"));__xuper.key(40)');
  assert.equal(await browser.evaluate('__xuper.state.focus.textContent.indexOf("Subtítulos")===0'),true);
  await browser.evaluate('document.querySelector(".xt-setting-action")._activate();__xuper.settingsPanel("netdiag");XuperStandalone.openDiagnostics()');
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  assert.equal(await browser.evaluate('document.querySelector("#screen-settings .settings-panel.is-active").textContent.includes("transporte activo")'),true);
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}));__xuper.show("home");window.nativeRouteCalls=[];XuperNativeTransport.snapshot=function(){return {available:true,engine:"local-test-adapter"}};XuperNativeTransport.ensure=function(){return Promise.resolve(true)};XuperNativeTransport.request=async function(options){nativeRouteCalls.push(new URL(options.url).pathname);var headers={};Object.keys(options.headers||{}).forEach(function(name){if(!/^(user-agent|host|content-length|connection|accept-encoding|cookie)$/i.test(name))headers[name]=options.headers[name]});var response=await fetch(options.url,{method:options.method||"GET",headers:headers,body:options.body||undefined});return {status:response.status,body:await response.arrayBuffer(),headers:"",url:options.url}}');
  const bridge=await browser.evaluate('new Promise(function(resolve){XuperStandalone.core.fetchM3u(location.origin+"/native-list.m3u",function(error,items){resolve({error:error&&error.message,count:items&&items.length})})})');
  assert.equal(bridge.error,null);assert.equal(bridge.count,1);
  await browser.evaluate('__xuper.show("player")');
  await browser.waitFor('document.getElementById("player-video").currentTime>0.5',180);
  const nativeCalls=await browser.evaluate('nativeRouteCalls');assert.ok(nativeCalls.some(url=>url.endsWith('.m3u8')));assert.ok(nativeCalls.some(url=>url.endsWith('.ts')));assert.ok(nativeCalls.some(url=>url.endsWith('/key.bin')));
  await browser.evaluate('__xuper.show("home");XuperNativeTransport.request=async function(){return null};__xuper.show("player")');
  await browser.waitFor('document.getElementById("player-video").currentTime>0.5',180);
  assert.deepEqual(browser.errors,[]);
  await browser.evaluate('__xuper.show("home");XuperStandalone.core.getLiveCategories=function(cb){cb(null,[])};XuperGuide.open();for(var i=0;i<2;i++)XuperGuide.handle({keyCode:40});XuperGuide.handle({keyCode:13})');
  await browser.waitFor('!!document.querySelector(".xt-keyboard")');
  await browser.evaluate('for(var i=0;i<5;i++)XuperGuide.handle({keyCode:40});for(var i=0;i<4;i++)XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:13})');
  assert.equal(await browser.evaluate('document.querySelector(".xt-keyboard button").textContent'),'Q');
  await browser.evaluate('XuperGuide.handle({keyCode:13});for(var i=0;i<5;i++)XuperGuide.handle({keyCode:38});for(var i=0;i<4;i++)XuperGuide.handle({keyCode:37})');
  await browser.evaluate('var listUrl='+JSON.stringify(`http://127.0.0.1:${server.address().port}/addon-fixture.m3u`)+';for(var c of listUrl)XuperGuide.handle({keyCode:0,key:c});for(var i=0;i<5;i++)XuperGuide.handle({keyCode:40});for(var i=0;i<3;i++)XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:13})');
  await browser.waitFor('document.querySelector(".xt-guide-count").textContent.startsWith("1 canal")');
  assert.equal(await browser.evaluate('JSON.parse(localStorage.getItem("xuper.m3uLists")).length'),1);
  await browser.evaluate('XuperGuide.handle({keyCode:403});XuperGuide.handle({keyCode:13})');
  await browser.waitFor('document.getElementById("player-video").currentTime>0.5',180);
  assert.ok(await browser.evaluate('Object.values(JSON.parse(localStorage.getItem("xuper.guideFavorites"))).some(row=>row.streamUrl&&row.streamUrl.includes("/public/"))'));
  await browser.evaluate('XuperGuide.handle({keyCode:406})');
  await browser.waitFor('document.getElementById("player-video").currentTime>0.5',180);
  await browser.evaluate('__xuper.show("home");window.refreshCalls=0;XuperStandalone.core.getLiveChannels=function(c,p,s,cb){cb(null,[{channelCode:"renew-fixture",name:"Renovación 404"}],false)};XuperStandalone.core.resolveLive=function(code,cb,options){if(options&&options.force)refreshCalls++;cb(null,{url:' + JSON.stringify(streamUrl.replace('/live.m3u8','/public/live.m3u8')) + '.replace("/public/live.m3u8",options&&options.force?"/public/live.m3u8":"/public/expired.m3u8"),mime:"application/vnd.apple.mpegurl",headers:{}})};XuperGuide.open();XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:13})');
  await browser.waitFor('XuperGuide.diagnostics().sourceRefreshes===1&&document.getElementById("player-video").currentTime>0.5',180);
  assert.equal(await browser.evaluate('refreshCalls'),1);
  await browser.evaluate('__xuper.show("home");XuperGuide.close();XuperStandalone.core.resolveLive=function(code,cb,options){if(options&&options.force)refreshCalls++;cb(null,{url:'+JSON.stringify(streamUrl.replace('/live.m3u8','/public/expired.m3u8'))+',mime:"application/vnd.apple.mpegurl",headers:{}})};refreshCalls=0;XuperGuide.open();XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:13})');
  await browser.waitFor('XuperGuide.diagnostics().sourceRefreshes===1&&!!XuperGuide.diagnostics().error',180);
  assert.equal(await browser.evaluate('refreshCalls'),1);
  assert.equal(await browser.evaluate('XuperGuide.diagnostics().httpStatus'),404);
  await browser.evaluate('XuperGuide.close()');
  assert.deepEqual(browser.errors,[]);
  await browser.evaluate('XuperGuide.open();for(var i=0;i<2;i++)XuperGuide.handle({keyCode:40});XuperGuide.handle({keyCode:13})');
  await browser.waitFor('document.querySelector(".xt-guide-count").textContent.startsWith("1 canal")');
  const playlistReads=appRequests.filter(url=>url==='/addon-fixture.m3u').length;
  assert.equal(playlistReads,1);
  await browser.evaluate('XuperGuide.handle({keyCode:405})');
  await browser.waitFor('document.querySelector(".xt-guide-count").textContent.startsWith("1 canal")');
  assert.equal(appRequests.filter(url=>url==='/addon-fixture.m3u').length,2);
  await browser.evaluate('XuperGuide.handle({keyCode:37});XuperGuide.handle({keyCode:403})');
  assert.equal(await browser.evaluate('!!document.querySelector("[role=alertdialog]")'),true);
  await browser.evaluate('XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:13});XuperGuide.close()');
  assert.equal(await browser.evaluate('JSON.parse(localStorage.getItem("xuper.m3uLists")).length'),0);
  assert.equal(await browser.evaluate('(localStorage.getItem("xuper.searchHistory")||"").includes("addon-fixture")'),false);
  console.log('PASS: custom M3U URL via D-Pad keyboard, worker fetch/parse, playback, favorite, fullscreen; expired portal 404 renews once, permanent 404 remains an error.');
  console.log('PASS: worker, IndexedDB, paged catalog, three-column guide, QWERTY; autonomous startup without pairing/RPC; real HLS.js decodes AES-128 H.264/AAC via cross-origin authorized manifest+segments+key; pause/resume, channel change, teardown, UI and branding. Provider catalog mocked; not a real channel or Samsung test.');
} catch(error) {
  console.error('Unexpected fixture requests:',seen.filter(request=>request.auth!=='local-test'||request.license!=='local-license').map(request=>request.path));
  if(browser) console.error(await browser.evaluate('JSON.stringify({player:XuperPlayer.diagnostics,error:__xuper.state.streamError})'));
  throw error;
} finally {
  if(browser) await browser.close();
  server.closeAllConnections();server.close();media.closeAllConnections();media.close();
  rmSync(temporary,{recursive:true,force:true});
}
