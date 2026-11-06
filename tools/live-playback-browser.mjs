import {execFileSync} from 'node:child_process';import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import {once} from 'node:events';import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';import {browserHarness} from './browser-harness.mjs';
const temp=mkdtempSync(path.join(os.tmpdir(),'xuper-live-')),root=path.resolve('app');let browser,startedAt=0,manifestGets=0,playlistFailures=0,fragmentFailures=0,outageFailures=0,workerMessages=0;const seen=[];
const policy=readFileSync(path.join(root,'config.xml'),'utf8').match(/<tizen:content-security-policy>([^<]+)</)[1];
const media=http.createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Auth,Content-License,Range');res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 const url=new URL(req.url,'http://localhost');
 seen.push({url:url.pathname,range:req.headers.range,auth:req.headers['content-auth'],license:req.headers['content-license']});
 if(req.headers.range){res.writeHead(416);res.end();return;}
 if(req.headers['content-auth']!=='live-test'||req.headers['content-license']!=='live-license'){res.writeHead(403);res.end();return;}
 if(url.pathname==='/live.m3u8'){
  manifestGets++;if(!startedAt)startedAt=Date.now();const elapsed=Date.now()-startedAt;
  if(elapsed>6000&&playlistFailures===0){playlistFailures++;res.writeHead(404);res.end();return;}
  if(elapsed>=32000&&elapsed<36000){outageFailures++;res.writeHead(503);res.end();return;}
  const start=Math.min(38,Math.floor(elapsed/2000));let text='#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:'+start+'\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin",IV=0x000102030405060708090a0b0c0d0e0f\n';
  for(let i=start;i<start+6;i++)text+='#EXTINF:2.000,\npart'+String(i).padStart(2,'0')+'.ts\n';
  res.setHeader('Content-Type','application/vnd.apple.mpegurl');res.end(text);return;
 }
 if(url.pathname.endsWith('.ts')&&Date.now()-startedAt>10000&&fragmentFailures===0){fragmentFailures++;res.writeHead(503);res.end();return;}
 const file=path.resolve(temp,'.'+url.pathname);if(!file.startsWith(temp+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',url.pathname.endsWith('.bin')?'application/octet-stream':'video/mp2t');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}
});
const app=http.createServer((req,res)=>{
 res.setHeader('Content-Security-Policy',policy);
 if(req.url.includes('$WEBAPIS/')){res.setHeader('Content-Type','text/javascript');res.end('');return;}
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}
});
try{
 writeFileSync(path.join(temp,'key.bin'),randomBytes(16));writeFileSync(path.join(temp,'keyinfo'),'key.bin\n'+path.join(temp,'key.bin')+'\n000102030405060708090a0b0c0d0e0f\n');
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size=320x180:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','90','-c:v','libx264','-threads','1','-profile:v','baseline','-pix_fmt','yuv420p','-g','48','-sc_threshold','0','-c:a','aac','-ac','2','-hls_time','2','-hls_list_size','0','-hls_flags','independent_segments','-hls_key_info_file',path.join(temp,'keyinfo'),'-hls_segment_filename',path.join(temp,'part%02d.ts'),path.join(temp,'all.m3u8')]);
 app.listen(0,'127.0.0.1');media.listen(0,'127.0.0.1');await Promise.all([once(app,'listening'),once(media,'listening')]);const stream=`http://127.0.0.1:${media.address().port}/live.m3u8`;
 browser=await browserHarness();await browser.command('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (SMART-TV; Tizen 9.0) Chrome/130 Safari/537.36'});
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.hlsWorkerMessages=0;var NativeWorker=window.Worker;window.Worker=class extends NativeWorker{constructor(url,options){super(url,options);if(String(url).includes('hls-worker.js'))this.addEventListener('message',()=>window.hlsWorkerMessages++);}};
 Object.defineProperty(window,'XuperStandalone',{
  configurable:true,
  set:function(api){
   window.hlsWorkerMessages=0;var NativeWorker=window.Worker;window.Worker=class extends NativeWorker{constructor(url,options){super(url,options);if(String(url).includes('hls-worker.js'))this.addEventListener('message',()=>window.hlsWorkerMessages++);}};
 Object.defineProperty(window,'XuperStandalone',{value:api,configurable:true,writable:true});
   api.core.home=function(r,p,cb){cb(null,{items:[]})};
   api.core.getLiveCategories=function(cb){cb(null,[])};
   api.core.getLiveChannels=function(c,p,s,cb){cb(null,[{name:'Live rolling fixture',channelCode:'live-fixture',index:1}],false)};
   api.core.resolveLive=function(c,cb){window.liveResolves=(window.liveResolves||0)+1;cb(null,{url:${JSON.stringify(stream)},mime:'application/vnd.apple.mpegurl',headers:{'Content-Auth':'live-test','Content-License':'live-license'}})};
  }
 });`});
 await browser.command('Page.navigate',{url:`http://127.0.0.1:${app.address().port}/index.html`});await browser.waitFor('!!window.__xuper&&__xuper.state.screen==="home"');
 await browser.evaluate(`XuperNativeTransport.ensure=async function(){return true};XuperNativeTransport.snapshot=function(){return {available:true,engine:'local-test-adapter'}};XuperNativeTransport.request=async function(options){var start=performance.now();var response=await fetch(options.url,{headers:options.headers||{}});var first=performance.now();return {status:response.status,body:await response.arrayBuffer(),headers:'',url:options.url,metrics:{firstByteMs:first-start,totalMs:performance.now()-start}}};window.playAbortInjected=false;var video=document.getElementById('player-video'),original=video.play;video.play=function(){if(!playAbortInjected){playAbortInjected=true;return Promise.reject(new DOMException('Fixture interruption','AbortError'))}return original.call(this)};__xuper.show('player');`);
 await browser.waitFor('document.getElementById("player-video").currentTime>0.5',150);
 assert.equal(await browser.evaluate('XuperPlayer.diagnostics.autoplayBlocked'),false);assert.equal(await browser.evaluate('__xuper.state.streamError.includes("Pulsa OK")'),false);
 console.log('Live HLS started; exercising rolling playlist updates and transient 404/503 for 60 seconds, including a four-second playlist outage after 30 seconds.');
 const samples=[];for(let i=0;i<30;i++){await new Promise(resolve=>setTimeout(resolve,2000));const sample=await browser.evaluate('({time:document.getElementById("player-video").currentTime,error:XuperPlayer.diagnostics.error,stage:XuperPlayer.diagnostics.stage,retries:XuperPlayer.diagnostics.networkRetries,cdn:XuperPlayer.diagnostics.cdnAttempt,media:XuperPlayer.diagnostics.media,worker:XuperPlayer.diagnostics.worker})');samples.push(sample);assert.equal(sample.error,'');}
 assert.ok(samples.at(-1).time-samples[0].time>48);assert.ok(manifestGets>=20);assert.ok(outageFailures>0);workerMessages=await browser.evaluate('hlsWorkerMessages');assert.ok(workerMessages>10,'HLS must actually transmux in the local worker');assert.equal(samples.at(-1).worker,true);assert.ok(samples.at(-1).media.totalFrames>500);assert.equal(samples.at(-1).media.playbackRate,1);assert.equal(playlistFailures,1);assert.equal(fragmentFailures,1);assert.equal(samples.at(-1).cdn,1);assert.ok(samples.at(-1).retries>=2);
 assert.ok(seen.every(row=>!row.range&&row.auth==='live-test'&&row.license==='live-license'));assert.deepEqual(browser.errors,[]);
 await browser.evaluate(`__xuper.show('home');window.fixtureBlockPlay=true;var basePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(fixtureBlockPlay)return Promise.reject(new DOMException('Fixture gesture gate','NotAllowedError'));return basePlay.call(this)};XuperGuide.open();XuperGuide.handle({keyCode:39});XuperGuide.handle({keyCode:13});`);
 await browser.waitFor('XuperGuide.diagnostics().autoplayBlocked===true');const resolvedBefore=await browser.evaluate('liveResolves');
 await browser.evaluate('fixtureBlockPlay=false;document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:13,bubbles:true}))');
 await browser.waitFor('document.querySelector("#xt-guide video").currentTime>0.5',150);
 assert.equal(await browser.evaluate('liveResolves'),resolvedBefore);assert.equal(await browser.evaluate('XuperGuide.diagnostics().autoplayBlocked'),false);assert.deepEqual(browser.errors,[]);
 mkdirSync('dist',{recursive:true});writeFileSync('dist/live-continuity.json',JSON.stringify({synthetic:true,samsungHardware:false,manifestGets,playlistFailures,fragmentFailures,outageFailures,workerMessages,samples},null,2)+'\n');
 console.log('PASS: 60 seconds of decoded moving-window AES-128 HLS, native-loader adapter, local HLS worker active, live playlist 404 and fragment 503 recovery plus outage after 30 seconds, no invalid Range, no false OK prompt no CDN reset, and genuine gesture retry without re-resolving the channel.');
}finally{if(browser)await browser.close();for(const server of [app,media]){server.closeAllConnections();server.close();}rmSync(temp,{recursive:true,force:true});}
