import http from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-harness.mjs';
const root=path.resolve('app'),shots='docs/ux-usability/0.10.6';mkdirSync(shots,{recursive:true});let browser;
const server=http.createServer((req,res)=>{
 if(req.url.includes('$WEBAPIS/')){res.end('');return;}
 if(req.url==='/channel-logo.svg'){res.setHeader('Content-Type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><rect width="160" height="60" rx="8" fill="#182e48"/><text x="80" y="43" text-anchor="middle" font-family="Arial" font-size="36" fill="#c7eeff">TV</text></svg>');return;}
 if(req.url.startsWith('/__down')){res.setHeader('Content-Type','application/octet-stream');res.end(Buffer.alloc(Number(new URL(req.url,'http://localhost').searchParams.get('bytes'))));return;}
 try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch(_){res.writeHead(404);res.end();}
});
try{
 server.listen(0,'127.0.0.1');await once(server,'listening');browser=await browserHarness();
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`
 localStorage.removeItem('xt.tmdbToken');window.tvResolves=0;window.speedRequests=0;
 const XHR=window.XMLHttpRequest;window.XMLHttpRequest=function(){const xhr=new XHR(),open=xhr.open;xhr.open=function(method,url,...rest){if(String(url).startsWith('https://speed.cloudflare.com/')){speedRequests++;url=location.origin+'/__down'+new URL(url).search;}return open.call(this,method,url,...rest)};return xhr;};
 Object.defineProperty(window,'XuperStandalone',{configurable:true,set(api){Object.defineProperty(window,'XuperStandalone',{value:api,writable:true,configurable:true});
 api.core.home=(r,p,cb)=>cb(null,{items:[]});api.core.getLiveCategories=cb=>cb(null,Array.from({length:35},(_,i)=>({id:'cat-'+i,name:'Categoría '+i})));
 api.core.getLiveChannels=(c,p,s,cb)=>cb(null,Array.from({length:120},(_,i)=>({channelCode:'qa-'+i,name:'Canal de prueba '+i,index:i+1,logo:location.origin+'/channel-logo.svg'})),false);
 api.core.resolveLive=(id,cb)=>{tvResolves++;cb(new Error('Señal de prueba no disponible'));};
 api.core.poster=(url,cb)=>fetch(url).then(r=>r.blob()).then(blob=>cb(null,{blob}),cb);
 api.core.diagnostics=cb=>cb(null,{fixture:true});const call=api.core.call;api.core.call=(m,p,cb)=>{if(m==='catalogDiscover')return cb(null,{editorial:[],facets:{genres:[]}});if(m==='catalogFullPage')return cb(null,{items:[],facets:{genres:[]},hasMore:false});return call(m,p,cb);};
 }});
 `});
 await browser.command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html'});
 await browser.waitFor('window.XuperShell&&XuperCatalog.active');assert.equal(await browser.evaluate('XuperShell.current'),'movies');
 const key=code=>browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:'+code+',bubbles:true}))');
 await browser.evaluate('XuperShell.focusHeader(1)');await key(37);await browser.waitFor('XuperGuide.active');assert.equal(await browser.evaluate('XuperShell.focused'),true);await key(40);
 const visible=()=>browser.evaluate('(()=>{const b=document.querySelector(".xt-guide-channels button.selected"),r=b.getBoundingClientRect(),p=b.parentElement.getBoundingClientRect();return !b.hidden&&r.top>=p.top-1&&r.bottom<=p.bottom+1})()');
 for(let i=0;i<100;i++){await key(40);assert.ok(await visible(),'Channel '+i+' stays visible');}
 assert.equal(await browser.evaluate('document.querySelector(".xt-guide-channels button.selected")._index'),100);
 assert.equal(await browser.evaluate('document.querySelectorAll(".xt-guide-preview, .xt-guide-art, #xt-guide video").length'),0);
 assert.equal(await browser.evaluate('document.querySelectorAll(".xt-guide-channels button").length'),12);
 assert.equal(await browser.evaluate('tvResolves'),0,'Browsing does not start playback');
 assert.equal(await browser.evaluate('getComputedStyle(document.querySelector(".xt-channel-logo img")).objectFit'),'contain');await browser.screenshot(shots+'/tv-lista-foco.png');
 for(let i=0;i<100;i++){await key(38);assert.ok(await visible());}
 await key(37);for(let i=0;i<33;i++)await key(40);
 assert.ok(await browser.evaluate('(()=>{const b=document.querySelector(".xt-guide-categories button.selected"),r=b.getBoundingClientRect(),p=b.parentElement.getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1})()'));
 for(let i=0;i<33;i++)await key(38);await key(39);await key(39);await key(13);
 assert.ok(await browser.evaluate('JSON.parse(localStorage.getItem("xuper.guideFavorites"))["qa-0"]'));
 await key(10009);await key(39);assert.equal(await browser.evaluate('XuperCatalog.root'),'movies');await key(39);assert.equal(await browser.evaluate('XuperCatalog.root'),'series');await key(39);assert.equal(await browser.evaluate('__xuper.state.screen'),'home','Gear needs OK');await key(13);assert.equal(await browser.evaluate('__xuper.state.screen'),'settings');await key(10009);await browser.waitFor('XuperCatalog.active&&XuperCatalog.root==="series"');
 for(let i=0;i<6;i++){await browser.evaluate('XuperShell.focusHeader(2)');await key(37);await key(37);await key(39);await key(39);}
 assert.equal(await browser.evaluate('document.querySelectorAll("#xt-catalog").length'),1);assert.equal(await browser.evaluate('document.querySelectorAll("#xt-guide").length'),0);
 await browser.evaluate('XuperStandalone.openDiagnostics();XuperStandalone.probeCdns=async()=>({results:[{host:"test.example",scheme:"https:",httpStatus:200,elapsedMs:48},{host:"other.example",scheme:"https:",httpStatus:404,elapsedMs:90}]});document.querySelector(".xt-diag-cdn").click();document.querySelector(".xt-diag-speed").click()');
 await browser.waitFor('document.querySelector("[data-metric=speed].is-ok")');assert.equal(await browser.evaluate('document.querySelectorAll(".xt-diagnostics pre").length'),0);assert.ok(await browser.evaluate('(()=>{const b=document.querySelector(".xt-diag-body");return b.scrollWidth<=b.clientWidth})()'),'Diagnostic must not scroll sideways');assert.equal(await browser.evaluate('speedRequests'),4);assert.equal(await browser.evaluate('document.querySelectorAll(".xt-cdn-row.is-ok").length'),1);assert.equal(await browser.evaluate('document.querySelectorAll(".xt-cdn-row.is-warning").length'),1);
 for(const [width,height]of [[1280,720],[3840,2160]]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await browser.waitFor('__xuperViewport.w==='+width);assert.ok(await browser.evaluate('Array.from(document.querySelectorAll(".xt-diag-actions button")).every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})'));}
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});await browser.screenshot(shots+'/diagnostico.png');await key(10009);assert.equal(await browser.evaluate('!!document.querySelector(".xt-diagnostics")'),false);
 assert.deepEqual(browser.errors,[]);console.log('PASS movies startup; automatic tabs, gear OK; 100 channels down/up with focus visible; 35 categories; bounded 12 rows; logos without cropping; favorites; repeated section/settings return; measured 4 MiB HTTP fixture; green 200/amber404; diagnostic controls visible 720p/4K. Provider/network mocked.');
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}
