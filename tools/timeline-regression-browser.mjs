import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-harness.mjs';
const root=path.resolve('app'),temp=mkdtempSync(path.join(tmpdir(),'xt-timeline-'));
let browser,started=0,bad=0,requests=0,persistent=false;
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 if(name.includes('$WEBAPIS/')){res.setHeader('Content-Type','text/javascript');res.end('');return;}
 if(name==='/live.m3u8'){
  if(!started)started=Date.now();const elapsed=Date.now()-started,start=Math.min(30,Math.floor(elapsed/2000));requests++;
  // Same segment timeline, but a misrouted response uses a different sequence namespace.
  const broken=persistent||elapsed>6500&&bad<1;let sequence=10000+start;if(broken){sequence-=1451;bad++;}
  let text='#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:'+sequence+'\n';
  for(let i=start;i<start+6;i++)text+='#EXTINF:2.000,\n/seg'+String(i).padStart(2,'0')+'.ts\n';
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/vnd.apple.mpegurl');res.end(text);return;
 }
 try{const file=name.endsWith('.ts')?path.join(temp,path.basename(name)):path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)&&!file.startsWith(temp+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ts':'video/mp2t'})[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch(_){res.writeHead(404);res.end();}
});
try{
 execFileSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','testsrc=size=320x180:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','80','-c:v','libx264','-threads','1','-preset','ultrafast','-pix_fmt','yuv420p','-g','48','-sc_threshold','0','-c:a','aac','-hls_time','2','-hls_list_size','0','-hls_segment_filename',path.join(temp,'seg%02d.ts'),path.join(temp,'all.m3u8')]);
 server.listen(0,'127.0.0.1');await once(server,'listening');browser=await browserHarness();
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'XuperStandalone',{configurable:true,set:function(api){Object.defineProperty(window,'XuperStandalone',{value:api,writable:true,configurable:true});api.core.home=function(a,b,cb){cb(null,{items:[]})};api.core.getLiveCategories=function(cb){cb(null,[])};api.core.getLiveChannels=function(a,b,c,cb){cb(null,[{name:'Timeline fixture',channelCode:'timeline'}],false)};api.core.resolveLive=function(code,cb){cb(null,{url:location.origin+'/live.m3u8',mime:'application/vnd.apple.mpegurl',headers:{}})}}});`});
 await browser.command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html'});await browser.waitFor('!!window.__xuper&&__xuper.state.screen==="home"');await browser.evaluate('__xuper.show("player")');await browser.waitFor('document.getElementById("player-video").currentTime>0.5',150);
 const samples=[];for(let i=0;i<22;i++){await new Promise(r=>setTimeout(r,500));samples.push(await browser.evaluate('({time:document.getElementById("player-video").currentTime,ready:document.getElementById("player-video").readyState,frames:document.getElementById("player-video").getVideoPlaybackQuality().totalVideoFrames,rejected:XuperPlayer.diagnostics.playlistRejected||0,restarts:XuperPlayer.diagnostics.sequenceRestarts})'));}
 if(process.env.XUPER_TIMELINE_BASELINE==='1'){console.log('BASELINE',JSON.stringify({bad,requests,samples}));}
 else{
  assert.equal(bad,1);assert.ok(samples.some(s=>s.rejected>=1));assert.ok(samples.every(s=>s.time<120),'Rejected sequence must not produce a multi-hour clock jump');assert.ok(samples.at(-1).frames-samples[0].frames>150);assert.equal(samples.at(-1).restarts,0,'A single stale response should not restart playback');
  // Force the exact observed clock-vs-buffer mismatch without relying on firmware.
  await browser.evaluate('window.timelineVideo=document.getElementById("player-video");window.timelineOwn=Object.getOwnPropertyDescriptor(timelineVideo,"currentTime");Object.defineProperty(timelineVideo,"currentTime",{configurable:true,get:function(){return 7317.827},set:function(){}})');
  await browser.waitFor('XuperPlayer.diagnostics.timelineResets>=1',80);
  await browser.evaluate('if(timelineOwn)Object.defineProperty(timelineVideo,"currentTime",timelineOwn);else delete timelineVideo.currentTime');await browser.waitFor('XuperPlayer.diagnostics.stage==="playing"&&document.getElementById("player-video").currentTime<120',150);
  persistent=true;await browser.waitFor('(XuperPlayer.diagnostics.playlistRejected||0)>=4',150);await browser.waitFor('XuperPlayer.diagnostics.sequenceRestarts+XuperPlayer.diagnostics.sequenceFailovers>=2||!!XuperPlayer.diagnostics.error',150);
  // Back remains usable while a source returns inconsistent playlists.
  await browser.evaluate('__xuper.show("home");__xuper.focus(".live-focus");__xuper.key(39)');assert.equal(await browser.evaluate('__xuper.state.focus.getAttribute("aria-label")'),'Películas');assert.equal(await browser.evaluate('XuperPlayer.diagnostics.engine'),'');
  assert.deepEqual(browser.errors,[]);console.log('PASS: wrong sequence namespace rejected before HLS merge, transient retry keeps decoded frames advancing, 7317s clock mismatch resets media instead of network retries, persistent mismatch is bounded, Home navigation works. '+JSON.stringify({bad,requests,samples}));
 }
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();rmSync(temp,{recursive:true,force:true});}
