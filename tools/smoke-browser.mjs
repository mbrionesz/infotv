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
  if (req.headers['content-auth'] !== 'local-test' || req.headers['content-license'] !== 'local-license') { res.writeHead(403); res.end(); return; }
  const file = path.resolve(temporary, '.' + req.url);
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
  execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size=640x360:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','8','-c:v','libx264','-threads','1','-profile:v','baseline','-pix_fmt','yuv420p','-g','48','-sc_threshold','0','-c:a','aac','-ac','2','-hls_time','2','-hls_list_size','0','-hls_flags','independent_segments','-hls_key_info_file',path.join(temporary,'keyinfo'),'-hls_segment_filename',path.join(temporary,'part%02d.ts'),path.join(temporary,'live.m3u8')]);
  server.listen(0,'127.0.0.1'); media.listen(0,'127.0.0.1');
  await Promise.all([once(server,'listening'),once(media,'listening')]);
  const streamUrl = `http://127.0.0.1:${media.address().port}/live.m3u8`;
  browser = await browserHarness();
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`
    Object.defineProperty(window,'XuperStandalone',{configurable:true,set:function(api){
      Object.defineProperty(window,'XuperStandalone',{configurable:true,writable:true,value:api});
      var core=api.core;
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
  assert.equal(await browser.evaluate('XuperStandalone.version'),'0.2.0');
  assert.equal(await browser.evaluate('__xuper.channels.length'),2);
  mkdirSync('dist',{recursive:true});
  await browser.screenshot('dist/browser-home.png');
  await browser.evaluate('__xuper.focus(".live-focus");__xuper.key(40);__xuper.key(40)');
  assert.equal(await browser.evaluate('__xuper.state.focus === document.querySelector(".modern-quick-card")'),true);
  await browser.evaluate('__xuper.key(39);__xuper.key(13)');
  await browser.waitFor('__xuper.state.tab === 2');
  await browser.screenshot('dist/browser-movies.png');
  await browser.evaluate('__xuper.openSearch()');
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}));document.dispatchEvent(new KeyboardEvent("keyup",{keyCode:10009,bubbles:true}))');
  assert.equal(await browser.evaluate('__xuper.state.screen'),'home');
  await browser.evaluate('__xuper.show("player");__xuper.key(37)');
  await browser.waitFor('document.querySelector(".infotv-channel-credit").getBoundingClientRect().width>0');
  assert.equal(await browser.evaluate('document.querySelector(".infotv-channel-credit").textContent'),'XuperTizen by Matias');
  await browser.screenshot('dist/browser-channels.png');
  await browser.evaluate('__xuper.key(39)');
  assert.equal(await browser.evaluate('document.querySelector(".infotv-channel-credit").getBoundingClientRect().width'),0);
  await browser.waitFor('document.getElementById("player-video").currentTime > 0.5',180);
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.engine'),'hls.js');
  const progress = await browser.evaluate('document.getElementById("player-video").currentTime');
  assert.ok(progress>0);
  assert.ok(seen.some(request=>request.path.endsWith('.m3u8')));
  assert.ok(seen.some(request=>request.path.endsWith('.ts')));
  assert.ok(seen.some(request=>request.path.endsWith('/key.bin')));
  assert.ok(seen.every(request=>request.auth==='local-test' && request.license==='local-license'));
  assert.equal(appRequests.some(request=>request.includes('/rpc/')),false);
  await browser.screenshot('dist/standalone-hls-test.png');
  await browser.evaluate('document.getElementById("player-video").pause()');
  assert.equal(await browser.evaluate('document.getElementById("player-video").paused'),true);
  await browser.evaluate('document.getElementById("player-video").play()');
  await browser.waitFor('!document.getElementById("player-video").paused');
  await browser.evaluate('__xuper.key(40)');
  await browser.waitFor('XuperPlayer.diagnostics.engine === "hls.js" && document.getElementById("player-video").currentTime>0.5',180);
  await browser.evaluate('__xuper.show("home")');
  await browser.waitFor('XuperPlayer.diagnostics.engine === ""');
  assert.equal(await browser.evaluate('XuperPlayer.diagnostics.error'),'');
  assert.deepEqual(browser.errors,[]);
  console.log('PASS: autonomous startup without pairing/RPC; real HLS.js decodes AES-128 H.264/AAC via cross-origin authorized manifest+segments+key; pause/resume, channel change, teardown, UI and branding. Provider catalog mocked; not a real channel or Samsung test.');
} finally {
  if(browser) await browser.close();
  server.closeAllConnections();server.close();media.closeAllConnections();media.close();
  rmSync(temporary,{recursive:true,force:true});
}
