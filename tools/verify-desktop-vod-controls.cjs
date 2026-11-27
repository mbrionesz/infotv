'use strict';
// Real Electron input + shared VOD UI + the packaged native engine. All media is local.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
let fixturePort=0;
module.exports=async function verifyVodControls(window,{desktopCapturer,screen,engine}){
 const media=fs.readFileSync(path.resolve('tests/fixtures/windows-controls-hevc.mp4'));
 let subtitleRequests=0;
 const server=http.createServer((req,res)=>{
  if(req.url==='/movie.mp4'){
   const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');const start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),media.length-1):media.length-1;
   if(start> end){res.writeHead(416,{'Content-Range':'bytes */'+media.length});res.end();return;}
   res.writeHead(range?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(range?{'Content-Range':`bytes ${start}-${end}/${media.length}`}:{})});res.end(media.subarray(start,end+1));return;
  }
  subtitleRequests++;res.writeHead(200,{'Content-Type':'application/x-subrip'});res.end('1\n00:00:00,000 --> 00:01:59,000\n'+(req.url==='/en.srt'?'English subtitle':'Subtítulo español')+'\n');
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});fixturePort=server.address().port;const origin='http://windows-controls.fixture.test';
 const evaluate=code=>window.webContents.executeJavaScript(code),delay=ms=>new Promise(r=>setTimeout(r,ms));
 fs.mkdirSync('dist',{recursive:true});const pointer=path.resolve('dist/windows-vod-pointer.exe');
 execFileSync(path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe'),['/nologo','/target:exe','/out:'+pointer,path.resolve('tools/windows-vod-pointer.cs')],{windowsHide:true});
 async function moveMouse(point,click=false){const bounds=window.getContentBounds();execFileSync(pointer,[String(Math.round(bounds.x+point.x)),String(Math.round(bounds.y+point.y)),...(click?['click']:[])],{windowsHide:true});await delay(180);}
 const wait=async(code,timeout=15000)=>{const deadline=Date.now()+timeout;while(Date.now()<deadline){if(await evaluate(code))return;await delay(80);}throw Error('VOD controls timeout: '+code+'\n'+JSON.stringify(await evaluate('XuperDesktop.mediaDiagnostics()')));};
 async function click(selector,index=0){const point=await evaluate(`(()=>{const b=document.querySelectorAll(${JSON.stringify(selector)})[${index}];if(!b||b.disabled)throw Error('Unavailable control: '+${JSON.stringify(selector)});b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);await moveMouse(point,true);}
 async function capture(name){await delay(300);const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:1920,height:1080}});const image=sources[0].thumbnail;fs.mkdirSync('dist',{recursive:true});const prefix=`dist/xuperwindows-${engine}-vod-${name}-${process.env.XUPER_QA_GPU==='1'?'gpu':'software'}`;fs.writeFileSync(prefix+'.png',image.toPNG());fs.writeFileSync(prefix+'-html.png',(await window.webContents.capturePage()).toPNG());return image;}
 // Check the exposed HUD, rather than just capturePage() which omits native HWNDs.
 async function assertDarkHud(image){const rect=await evaluate('(()=>{const r=document.querySelector(".vod-infobar-content").getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()'),display=screen.getPrimaryDisplay().bounds,bounds=window.getContentBounds(),size=image.getSize(),pixels=image.getBitmap(),sx=size.width/display.width,sy=size.height/display.height;let bright=0,count=0;for(let y=rect.top+3;y<rect.top+rect.height-3;y+=3)for(let x=rect.left+3;x<rect.left+rect.width-3;x+=3){const px=Math.round((bounds.x+x-display.x)*sx),py=Math.round((bounds.y+y-display.y)*sy);if(px<0||py<0||px>=size.width||py>=size.height)continue;const i=(py*size.width+px)*4;if(pixels[i]>220&&pixels[i+1]>220&&pixels[i+2]>220)bright++;count++;}assert.ok(count>500,'HUD must be visible in the captured desktop: '+JSON.stringify({count,rect,bounds,size,display}));assert.ok(bright/count<.18,'Mouse HUD must not expose a white native window/background: '+bright/count);}
 try{
  window.focus();window.webContents.focus();
  await evaluate(`window.__vodQaHtmlDownloads=0;window.__vodQaOriginalSubtitleLoader=XuperStandalone.loadSubtitles;XuperStandalone.loadSubtitles=function(){__vodQaHtmlDownloads++;return __vodQaOriginalSubtitleLoader.apply(this,arguments)};window.__vodQaOriginal={resolve:XuperStandalone.core.resolve,mediaInfo:XuperStandalone.core.mediaInfo,detail:XuperStandalone.core.detail};window.__vodQaInfo={audio:'es-MX,en',subtitles:[{lang:'es-MX',url:${JSON.stringify(origin+'/es.srt')},format:'srt'},{lang:'en',url:${JSON.stringify(origin+'/en.srt')},format:'srt'}]};XuperStandalone.core.mediaInfo=function(a,b,cb){cb(null,__vodQaInfo)};XuperStandalone.core.detail=function(id,cb){cb(null,{item:{id,title:'Prueba local de audio y subtítulos',type:'movie',portal:true,genres:[]},episodes:[],seasons:[]})};XuperStandalone.core.resolve=function(id,series,options,cb){cb(null,Object.assign({},__vodQaInfo,{url:${JSON.stringify(origin+'/movie.mp4')},codec:'H265',mime:'video/mp4',duration:120,headers:{}}))};__xuper.show('home');__xuper.vod.push({id:'windows-native-controls-qa',title:'Prueba local de audio y subtítulos',type:'movie',_portal:true});__xuper.openDetail(__xuper.vod.length-1);`);
  await wait('__xuper.state.detail._detailsLoaded');await click('.detail-btn');
  await wait(`XuperPlayer.diagnostics.engine===${JSON.stringify(engine)}&&XuperPlayer.diagnostics.stage==='playing'&&XuperPlayer.audioTracks().length===2`,30000);
  await evaluate('__xuper.hidePlayerControls()');await delay(250);
  // Real desktop mouse activity should restore the HUD over active native video.
  await moveMouse({x:80,y:80});
  await wait('document.getElementById("player-vod-infobar").classList.contains("is-active")');
  await assertDarkHud(await capture('mouse-hud'));
  await click('[data-vod-action=play]');await wait('document.getElementById("player-video").paused');
  const before=await evaluate('document.getElementById("player-video").currentTime');
  await click('[data-vod-action=settings]');await wait('document.getElementById("dialog-playsettings").classList.contains("is-active")');
  await wait('document.querySelectorAll("#dps-audio-options button").length===2');
  await click('#dps-audio-options button',1);
  await wait('XuperPlayer.audioTracks()[1].selected&&document.querySelectorAll("#dps-audio-options button.is-selected").length===1&&document.querySelectorAll("#dps-audio-options button")[1].classList.contains("is-selected")');
  assert.equal(await evaluate('document.getElementById("player-video").paused'),true);
  assert.ok(Math.abs(await evaluate('document.getElementById("player-video").currentTime')-before)<1);
  await wait('!document.getElementById("dps-sub-switch").disabled');if(!await evaluate('document.getElementById("dps-sub-switch").classList.contains("is-on")'))await click('#dps-sub-switch');await wait('!!document.querySelector("#dps-lang-options button.is-selected")');
  await click('#dps-lang-options button',1);await wait('!document.getElementById("dps-sub-switch").disabled&&document.querySelectorAll("#dps-lang-options button")[1].classList.contains("is-selected")');
  const state=await evaluate('XuperDesktop.mediaDiagnostics()');assert.equal(state.tracks.filter(t=>t.type==='audio'&&t.selected).length,1);assert.ok(state.tracks.some(t=>t.type==='sub'&&t.selected));assert.equal(state.subtitle.language,'en');
  await capture('english-audio-subtitles');
  await click('#dps-sub-switch');await wait('!document.getElementById("dps-sub-switch").disabled&&!document.getElementById("dps-sub-switch").classList.contains("is-on")');
  assert.equal((await evaluate('XuperDesktop.mediaDiagnostics()')).tracks.some(t=>t.type==='sub'&&t.selected),false);
  await click('#dps-audio-options button',0);await wait('XuperPlayer.audioTracks()[0].selected&&document.querySelectorAll("#dps-audio-options button")[0].classList.contains("is-selected")');
  await click('#dps-btn-exit');await wait('!document.getElementById("dialog-playsettings").classList.contains("is-active")');
  await evaluate('__xuper.showPlayerControls()');await delay(250);await click('[data-vod-action=play]');await wait('!document.getElementById("player-video").paused');
  await delay(3300);await wait('!document.getElementById("player-vod-infobar").classList.contains("is-active")');
  await moveMouse({x:110,y:100});await wait('document.getElementById("player-vod-infobar").classList.contains("is-active")');await assertDarkHud(await capture('mouse-hud-after-tracks'));
  assert.equal(await evaluate('__vodQaHtmlDownloads'),0,'The HTML subtitle parser must not download native subtitles again');assert.ok(subtitleRequests>=2,'Both selected native subtitle files must actually be requested');
  console.log('PASS '+engine+': real VOD GUI, native HEVC active, mouse HUD pixels, pause, single-click confirmed English/Spanish, subtitles on/change/off, retained position and three-second autohide. Local fixtures.');
 }finally{await evaluate('__xuper.show("home");Object.assign(XuperStandalone.core,window.__vodQaOriginal||{});if(window.__vodQaOriginalSubtitleLoader)XuperStandalone.loadSubtitles=__vodQaOriginalSubtitleLoader;delete window.__vodQaOriginal;');server.closeAllConnections();await new Promise(r=>server.close(r));}
};
// Only the test process replaces resolution for its synthetic fixture hostname;
// production DNS continues rejecting private/loopback addresses.
module.exports.installFixtureResolver=function(modulePath='../desktop/dns.cjs'){
 const dns=require(modulePath),create=dns.createResolver;
 dns.createResolver=(...args)=>{const resolver=create(...args),resolve=resolver.resolve;resolver.resolve=(host,...options)=>host==='windows-controls.fixture.test'?Promise.resolve({ip:'127.0.0.1',mode:'local-fixture'}):resolve(host,...options);return resolver;};
 // Preserve the production HTTP-port validation; only route this synthetic
 // hostname's socket to our unprivileged local fixture listener.
 const request=http.request;http.request=function(options,...args){if(options&&options.hostname==='windows-controls.fixture.test'&&fixturePort)options={...options,port:fixturePort};return request.call(this,options,...args);};
};
