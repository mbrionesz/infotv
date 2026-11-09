import {execFileSync} from 'node:child_process';import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import {once} from 'node:events';import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';import {browserHarness} from './browser-harness.mjs';
const latencyMode=process.env.XUPER_LATENCY_TEST==='1',segmentSeconds=latencyMode?5:2;
const temp=mkdtempSync(path.join(os.tmpdir(),'xuper-live-')),root=path.resolve('app');let browser,startedAt=0,manifestGets=0,playlistFailures=0,fragmentFailures=0,outageFailures=0,workerMessages=0,parsingFailures=0,duplicateLists=0,sequenceFailures=0,sequenceProbe=0,malformedUrisSent=0;const seen=[];
const policy=readFileSync(path.join(root,'config.xml'),'utf8').match(/<tizen:content-security-policy>([^<]+)</)[1];
const media=http.createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Auth,Content-License,Range');res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 const url=new URL(req.url,'http://localhost');
 seen.push({url:url.pathname,range:req.headers.range,auth:req.headers['content-auth'],license:req.headers['content-license']});
 if(req.headers.range){res.writeHead(416);res.end();return;}
 if(!((req.headers['content-auth']==='live-test'&&req.headers['content-license']==='live-license')||(req.headers['content-auth']==='backup-live-test'&&req.headers['content-license']==='backup-live-license'))){res.writeHead(403);res.end();return;}
 if(url.pathname==='/live.m3u8'){
  manifestGets++;if(!startedAt)startedAt=Date.now();const elapsed=Date.now()-startedAt;
  if(!latencyMode&&elapsed>6000&&playlistFailures===0){playlistFailures++;res.writeHead(404);res.end();return;}
  if(!latencyMode&&elapsed>=18000&&parsingFailures===0){parsingFailures++;res.setHeader('Content-Type','application/vnd.apple.mpegurl');res.end('#EXTM3U\n#EXTINF:2.000,\npart10.ts\n');return;}
  if(!latencyMode&&elapsed>=32000&&elapsed<36000){outageFailures++;res.writeHead(503);res.end();return;}
  const start=Math.min(latencyMode?12:83,Math.floor(elapsed/(segmentSeconds*1000)));let sequence=start;if(sequenceProbe){sequenceFailures++;sequence=Math.max(0,start-20);sequenceProbe--;}let text='#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:'+segmentSeconds+'\n#EXT-X-MEDIA-SEQUENCE:'+sequence+'\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin",IV=0x000102030405060708090a0b0c0d0e0f\n';
  for(let i=start;i<start+6;i++)text+='#EXTINF:'+segmentSeconds+'.000,\npart'+String(i).padStart(2,'0')+'.ts'+(sequenceProbe?'?stream=other':'')+'\n';
  if(!latencyMode&&elapsed>=12000&&elapsed<16000){duplicateLists++;text=text.replace('#EXT-X-TARGETDURATION:2\n','#EXT-X-TARGETDURATION:2\n#EXT-X-TARGETDURATION:2\n');}
  const brokenOrigin='http://127.0.0.1%20:'+media.address().port;
  text=text.replace('URI="key.bin"','URI="'+brokenOrigin+'/key.bin"').replace(/^(part\d+\.ts)$/gm,(_line,file)=>brokenOrigin+'/'+file);malformedUrisSent++;
  res.setHeader('Content-Type','application/vnd.apple.mpegurl');res.end(text);return;
 }
 if(url.pathname.endsWith('.ts')&&!latencyMode&&Date.now()-startedAt>10000&&fragmentFailures===0){fragmentFailures++;res.writeHead(503);res.end();return;}
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
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size='+(latencyMode?'1280x720':'320x180')+':rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t',latencyMode?'90':'180','-c:v','libx264','-threads','1','-profile:v','baseline','-pix_fmt','yuv420p','-g',String(segmentSeconds*24),'-sc_threshold','0','-c:a','aac','-ac','2','-hls_time',String(segmentSeconds),'-hls_list_size','0','-hls_flags','independent_segments','-hls_key_info_file',path.join(temp,'keyinfo'),'-hls_segment_filename',path.join(temp,'part%02d.ts'),path.join(temp,'all.m3u8')]);
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
   api.core.resolveLive=function(c,cb){window.liveResolves=(window.liveResolves||0)+1;cb(null,{url:${JSON.stringify(stream)},mime:'application/vnd.apple.mpegurl',headers:{'Content-Auth':'live-test','Content-License':'live-license'},backupUrls:[{url:${JSON.stringify(stream+'?cdn=backup')},headers:{'Content-Auth':'backup-live-test','Content-License':'backup-live-license'}}]})};
  }
 });`});
 await browser.command('Page.navigate',{url:`http://127.0.0.1:${app.address().port}/index.html`});await browser.waitFor('!!window.__xuper&&__xuper.state.screen==="home"');
 if(latencyMode)await browser.evaluate('localStorage.setItem("xt.lowDelay720","on")');
 await browser.evaluate(`XuperNativeTransport.ensure=async function(){return true};XuperNativeTransport.snapshot=function(){return {available:true,engine:'local-test-adapter'}};XuperNativeTransport.request=async function(options){var start=performance.now();var response=await fetch(options.url,{headers:options.headers||{}});var first=performance.now();return {status:response.status,body:await response.arrayBuffer(),headers:'',url:options.url,metrics:{firstByteMs:first-start,totalMs:performance.now()-start}}};window.playAbortInjected=false;var video=document.getElementById('player-video'),original=video.play;video.play=function(){if(!playAbortInjected){playAbortInjected=true;return Promise.reject(new DOMException('Fixture interruption','AbortError'))}return original.call(this)};__xuper.show('player');`);
 await browser.waitFor('XuperPlayer.diagnostics.stage==="playing"&&!document.getElementById("player-video").paused&&document.getElementById("player-video").currentTime>0.5',150);
 assert.equal(await browser.evaluate('XuperPlayer.diagnostics.autoplayBlocked'),false);assert.equal(await browser.evaluate('__xuper.state.streamError.includes("Pulsa OK")'),false);
 assert.equal(await browser.evaluate('XuperPlayer.diagnostics.hlsVersion'),'1.7.4');
 if(!latencyMode){
  await browser.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))');await new Promise(r=>setTimeout(r,300));assert.equal(await browser.evaluate('document.getElementById("player-video").paused'),true);
  await browser.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:false});document.dispatchEvent(new Event("visibilitychange"))');await browser.waitFor('!document.getElementById("player-video").paused');
  await browser.evaluate('window.dispatchEvent(new Event("offline"));window.dispatchEvent(new Event("online"))');await browser.waitFor('XuperPlayer.history().some(function(e){return e.kind==="network-online-recovery"})');
  assert.equal(await browser.evaluate('JSON.stringify(XuperPlayer.history()).includes("live-license")'),false);
 }
 const initialGate=await browser.evaluate('XuperPlayer.diagnostics.bufferGate');if(!latencyMode){assert.equal(initialGate.releaseTargetSeconds,3);assert.ok(initialGate.releasedBufferSeconds>=2.95);}
 if(latencyMode){
  await browser.waitFor('XuperPlayer.diagnostics.liveLatency.alignmentSeeks>=1&&XuperPlayer.diagnostics.liveLatency.engineTargetSeconds===10&&XuperPlayer.diagnostics.liveLatency.seconds<11.5',250);
  const samples=[];for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,500));samples.push(await browser.evaluate('({latency:XuperPlayer.diagnostics.liveLatency,media:{time:document.getElementById("player-video").currentTime,paused:document.getElementById("player-video").paused,frames:document.getElementById("player-video").getVideoPlaybackQuality().totalVideoFrames},startupMs:XuperPlayer.diagnostics.startupMs,channelOpenMs:XuperPlayer.diagnostics.channelOpenMs})'));}
  assert.ok(samples.some(row=>row.latency.seconds<=11.5));assert.ok(samples.every(row=>row.latency.engineTargetSeconds===10));assert.ok(samples.at(-1).media.time-samples[0].media.time>8);assert.ok(samples.every(row=>!row.media.paused),'Latency tuning must not impose a pause while video remains buffered');assert.ok(samples.at(-1).media.frames-samples[0].media.frames>170,'Decoded frames must advance, not just seek the playback clock');
  await browser.evaluate('document.getElementById("player-video").pause()');const pausedTime=await browser.evaluate('document.getElementById("player-video").currentTime');await new Promise(resolve=>setTimeout(resolve,3000));assert.equal(await browser.evaluate('document.getElementById("player-video").currentTime'),pausedTime);
  await browser.evaluate('document.getElementById("player-video").play()');await browser.waitFor('XuperPlayer.diagnostics.liveLatency.alignmentSeeks>=2&&XuperPlayer.diagnostics.liveLatency.seconds<11.5',250);
  const resumed=await browser.evaluate('XuperPlayer.diagnostics.liveLatency');assert.deepEqual(browser.errors,[]);
  mkdirSync('dist',{recursive:true});writeFileSync('dist/live-latency-v062.json',JSON.stringify({synthetic:true,samsungHardware:false,segmentSeconds,samples,resumed},null,2)+'\n');console.log('PASS: genuine rolling 720p HLS with five-second segments reaches a ten-second engine target and measured edge distance, advances decoded video, respects Pause and realigns on resume.');
 }else{
 await browser.evaluate('var stalledVideo=document.getElementById("player-video");Object.defineProperty(stalledVideo,"buffered",{configurable:true,get:function(){return {length:1,start:function(){return stalledVideo.currentTime},end:function(){return stalledVideo.currentTime+0.1}}}});stalledVideo.dispatchEvent(new Event("waiting"))');
 assert.equal(await browser.evaluate('document.getElementById("player-video").paused'),false);
 await browser.evaluate('delete document.getElementById("player-video").buffered');
 assert.equal(await browser.evaluate('XuperPlayer.diagnostics.bufferGate.waiting'),false);
 console.log('Live HLS started; exercising rolling playlist updates and transient 404/503 for 60 seconds, including a four-second playlist outage after 30 seconds.');
 const samples=[];for(let i=0;i<30;i++){await new Promise(resolve=>setTimeout(resolve,2000));const sample=await browser.evaluate('({time:document.getElementById("player-video").currentTime,error:XuperPlayer.diagnostics.error,stage:XuperPlayer.diagnostics.stage,retries:XuperPlayer.diagnostics.networkRetries,cdn:XuperPlayer.diagnostics.cdnAttempt,media:XuperPlayer.diagnostics.media,worker:XuperPlayer.diagnostics.worker,playlistError:XuperPlayer.diagnostics.playlistError,networkRecoveries:XuperPlayer.diagnostics.networkRecoveries,playlistRepairs:XuperPlayer.diagnostics.playlistRepairs})');samples.push(sample);assert.equal(sample.error,'');}
 assert.ok(samples.at(-1).time-samples[0].time>40);assert.ok(manifestGets>=20);assert.ok(outageFailures>0);assert.ok(parsingFailures>0);assert.ok(duplicateLists>0);assert.ok(samples.some(sample=>sample.playlistRepairs>0));assert.ok(samples.some(sample=>sample.media&&sample.media.measuredFps>10));assert.ok(samples.some(sample=>sample.playlistError&&sample.playlistError.kind==='missing-target-duration'&&sample.playlistError.hasTargetDuration===false&&sample.playlistError.characters>0));assert.ok(samples.some(sample=>sample.networkRecoveries>0));workerMessages=await browser.evaluate('hlsWorkerMessages');assert.ok(workerMessages>10,'HLS must actually transmux in the local worker');assert.equal(samples.at(-1).worker,true);assert.ok(samples.at(-1).media.totalFrames>500);assert.equal(samples.at(-1).media.playbackRate,1);assert.equal(playlistFailures,1);assert.equal(fragmentFailures,1);assert.equal(samples.at(-1).cdn,1);assert.ok(samples.at(-1).retries>=2);
 assert.ok(seen.every(row=>!row.range&&row.auth==='live-test'&&row.license==='live-license'));assert.deepEqual(browser.errors,[]);
 assert.ok(malformedUrisSent>20);assert.ok(await browser.evaluate('XuperPlayer.diagnostics.uriRepairs>20'));assert.deepEqual(await browser.evaluate('XuperPlayer.diagnostics.playlistHosts'),['127.0.0.1']);
 sequenceProbe=1000;
 await browser.waitFor('XuperPlayer.diagnostics.playlistTimelineError&&XuperPlayer.diagnostics.playlistTimelineError.kind==="media-sequence-regression"',180);
 const sequenceDiagnostic=await browser.evaluate('XuperPlayer.diagnostics.playlistTimelineError');
 assert.ok(sequenceFailures>0);assert.equal(sequenceDiagnostic.kind,'media-sequence-regression');assert.ok(sequenceDiagnostic.received<sequenceDiagnostic.previous);assert.ok(sequenceDiagnostic.atMs>0);
 await browser.waitFor('XuperPlayer.diagnostics.sequenceRestarts===1',180);sequenceProbe=0;
 await browser.waitFor('XuperPlayer.diagnostics.stage==="playing"&&!document.getElementById("player-video").paused',180);
 assert.equal(await browser.evaluate('XuperPlayer.diagnostics.cdnAttempt'),1);
 const sequenceRecovery=await browser.evaluate('({restarts:XuperPlayer.diagnostics.sequenceRestarts,ms:XuperPlayer.diagnostics.sequenceRecoveryMs})');
 const recoveredTime=await browser.evaluate('document.getElementById("player-video").currentTime');
 await browser.waitFor('document.getElementById("player-video").currentTime>'+String(recoveredTime+0.5));
 await browser.evaluate('document.getElementById("player-video").pause()');sequenceProbe=1000;
 await browser.waitFor('XuperPlayer.diagnostics.sequenceFailovers===1&&XuperPlayer.diagnostics.cdnAttempt===2',180);sequenceProbe=0;
 await browser.waitFor('XuperPlayer.diagnostics.bufferGate&&XuperPlayer.diagnostics.bufferGate.userPaused',100);
 assert.equal(await browser.evaluate('document.getElementById("player-video").paused'),true);
 await browser.evaluate('document.getElementById("player-video").play()');
 await browser.waitFor('XuperPlayer.diagnostics.stage==="playing"&&!document.getElementById("player-video").paused',180);
 assert.equal(await browser.evaluate('XuperPlayer.diagnostics.sequenceRestarts'),1);
 for(let i=0;i<50&&!seen.some(row=>row.url.endsWith('.ts')&&row.auth==='backup-live-test'&&row.license==='backup-live-license');i++)await new Promise(resolve=>setTimeout(resolve,100));
 assert.ok(seen.some(row=>row.url.endsWith('.ts')&&row.auth==='backup-live-test'&&row.license==='backup-live-license'),'Backup must fetch its own authorized media: '+JSON.stringify(seen.slice(-12)));
 const sequenceFailover=await browser.evaluate('({restarts:XuperPlayer.diagnostics.sequenceRestarts,failovers:XuperPlayer.diagnostics.sequenceFailovers,cdn:XuperPlayer.diagnostics.cdnAttempt})');
 // Wait for a clean backup refresh before injecting a new regression. The
 // first backup list may still belong to the preceding injected incident.
 const cleanSequence=Math.floor((Date.now()-startedAt)/(segmentSeconds*1000));
 await browser.waitFor('XuperPlayer.diagnostics.playlistHistory.some(row=>row.cdnAttempt===2&&row.serverMediaSequence>='+cleanSequence+')',100);
 sequenceProbe=1000;
 await browser.waitFor('XuperPlayer.diagnostics.sequenceRestarts===2&&XuperPlayer.diagnostics.sequenceRestartPending===true',180);
 await browser.evaluate('XuperPlayer.stop()');const stoppedGets=manifestGets;await new Promise(resolve=>setTimeout(resolve,500));assert.equal(manifestGets,stoppedGets);assert.equal(await browser.evaluate('XuperPlayer.diagnostics.engine'),'');

 await browser.evaluate(`__xuper.show('home');delete document.getElementById('player-video').play;window.fixtureBlockPlay=true;var basePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(fixtureBlockPlay)return Promise.reject(new DOMException('Fixture gesture gate','NotAllowedError'));return basePlay.call(this)};XuperGuide.open();XuperGuide.focusContent();XuperGuide.handle({keyCode:13});`);
 await browser.waitFor('XuperGuide.diagnostics().autoplayBlocked===true');const resolvedBefore=await browser.evaluate('liveResolves');
 await browser.evaluate('fixtureBlockPlay=false;document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:13,bubbles:true}))');
 await browser.waitFor('document.getElementById("player-video").currentTime>0.5',150);
 assert.equal(await browser.evaluate('liveResolves'),resolvedBefore);assert.equal(await browser.evaluate('XuperGuide.diagnostics().autoplayBlocked'),false);assert.deepEqual(browser.errors,[]);
 mkdirSync('dist',{recursive:true});writeFileSync('dist/live-continuity.json',JSON.stringify({synthetic:true,samsungHardware:false,malformedUrisSent,manifestGets,playlistFailures,fragmentFailures,outageFailures,workerMessages,parsingFailures,duplicateLists,sequenceFailures,sequenceDiagnostic,sequenceRecovery,sequenceFailover,initialGate,samples},null,2)+'\n');
 console.log('PASS: 60 seconds of decoded moving-window AES-128 HLS, native-loader adapter, local HLS worker active, live playlist 404 and fragment 503 recovery plus outage after 30 seconds, no invalid Range, no false OK prompt no CDN reset, and genuine gesture retry without re-resolving the channel.');
}
}catch(error){if(browser)console.error(JSON.stringify(await browser.evaluate('XuperPlayer.diagnostics')));throw error;}finally{if(browser)await browser.close();for(const server of [app,media]){server.closeAllConnections();server.close();}rmSync(temp,{recursive:true,force:true});}
