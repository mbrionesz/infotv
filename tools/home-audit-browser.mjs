import http from 'node:http';import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import path from 'node:path';import {once} from 'node:events';import assert from 'node:assert/strict';import {browserHarness} from './browser-harness.mjs';
const root=path.resolve('app'),out=path.resolve(process.env.SCREENSHOT_DIR||'docs/screenshots/frontend-review');let browser;mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{if(req.url.includes('$WEBAPIS/')){res.setHeader('Content-Type','text/javascript');res.end('');return;}try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw new Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
try{
 server.listen(0,'127.0.0.1');await once(server,'listening');browser=await browserHarness();
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'XuperStandalone',{configurable:true,set:function(api){Object.defineProperty(window,'XuperStandalone',{value:api,configurable:true,writable:true});api.core.home=function(a,b,cb){cb(null,{items:[]})};api.core.getLiveCategories=function(cb){cb(null,[])};api.core.getLiveChannels=function(a,b,c,cb){cb(null,[{channelCode:'demo-one',name:'Canal de demostración'},{channelCode:'demo-two',name:'Señal de prueba'}],false)};api.core.poster=function(url,cb){fetch(url).then(function(r){return r.blob()}).then(function(blob){cb(null,{blob:blob})},cb)};var call=api.core.call;api.core.call=function(method,payload,cb){if(['catalogPage','catalogQuery','catalogSearch'].indexOf(method)<0)return call(method,payload,cb);var rows;if(payload.root==='series'){rows=[['Reacher','search-reacher.jpg'],['Outer Banks','search-outer-banks.jpg'],['El Chapo','search-chapo.jpg'],['Betty','search-betty.jpg'],['El señor de los cielos','search-senor-cielos.jpg'],['One Piece','search-one-piece.jpg'],['Secret Woman','search-secret-woman.jpg']].map(function(row,i){return {id:'demo-series-'+i,title:row[0],poster:'assets/catalog/'+row[1],year:'',country:''}})}else{rows=(window.XUPERTV_CATALOG.items||[]).filter(function(row){return row.poster&&row.poster.indexOf('search-')<0}).slice(0,18)}cb(null,{items:rows,total:rows.length,loaded:rows.length,hasMore:false,facets:{genres:[],years:[],countries:[],resolutions:[]}})};}});`});
 await browser.command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html'});await browser.waitFor('!!window.__xuper&&__xuper.state.screen==="home"');

 await browser.waitFor('document.querySelectorAll(".dashboard-action").length===6');
 assert.equal(await browser.evaluate('getComputedStyle(document.querySelector(".live-main")).display'),'none');
 for(const index of [0,1,2,3,4,5]){
 await browser.evaluate('__xuper.show("home");__xuper.focus(document.querySelectorAll(".dashboard-action")['+index+']);__xuper.key(13)');
 if(index===0){await browser.waitFor('!!document.getElementById("xt-guide")');await browser.evaluate('XuperGuide.close()');}
 if(index===1||index===2){await browser.waitFor('!!document.getElementById("xt-catalog")');assert.equal(await browser.evaluate('document.querySelector("#xt-catalog h1").textContent'),index===1?'Películas':'Series');await browser.evaluate('XuperCatalog.close()');}
 if(index===3){await browser.waitFor('!!document.querySelector(".xt-keyboard")');await browser.evaluate('XuperCatalog.handle({keyCode:10009});XuperCatalog.close()');}
 if(index===4||index===5)assert.equal(await browser.evaluate('__xuper.state.screen'),'settings');
 }
 await browser.evaluate('__xuper.show("home");__xuper.focus(".live-focus");__xuper.key(39);__xuper.key(40)');
 assert.equal(await browser.evaluate('__xuper.state.focus===document.querySelectorAll(".dashboard-action")[4]'),true);
 assert.ok(await browser.evaluate('__xuper.state.focus.offsetParent!==null'));
 await browser.evaluate('__xuper.show("home");__xuper.focus(document.querySelector(".tab-item"))');for(let step=0;step<6;step++)await browser.evaluate('__xuper.key(40)');assert.equal(await browser.evaluate('__xuper.state.focus.textContent.trim()'),'Mi lista');await browser.evaluate('__xuper.key(39)');assert.equal(await browser.evaluate('__xuper.state.screen'),'home');assert.equal(await browser.evaluate('__xuper.state.focus===document.querySelector(".dashboard-action")'),true);await browser.evaluate('__xuper.focus(Array.from(document.querySelectorAll(".tab-item")).filter(function(el){return el.offsetParent!==null}).pop());__xuper.key(13)');assert.equal(await browser.evaluate('__xuper.state.screen'),'settings');
 await browser.evaluate('__xuper.show("home");__xuper.focus(document.querySelectorAll(".tab-item")[1]);__xuper.key(39)');
 assert.equal(await browser.evaluate('XuperCatalog.active'),false);assert.equal(await browser.evaluate('XuperGuide.active'),false);
 assert.equal(await browser.evaluate('__xuper.state.focus===document.querySelector(".dashboard-action")'),true);
 await browser.evaluate('__xuper.focus(document.querySelectorAll(".tab-item")[1]);__xuper.key(13)');
 assert.equal(await browser.evaluate('document.querySelector("#xt-catalog h1").textContent'),'Destacados');await browser.evaluate('XuperCatalog.close()');
 await browser.evaluate('__xuper.show("home");window.auditCall=XuperStandalone.core.call;XuperStandalone.core.call=function(method,payload,cb){if(method.indexOf("catalog")===0)return cb(new Error("fallo de prueba"));return auditCall(method,payload,cb)};XuperCatalog.open("movies")');
 assert.equal(await browser.evaluate('document.querySelector(".xt-catalog-retry").hidden'),false);
 assert.equal(await browser.evaluate('document.querySelector(".xt-catalog-retry").classList.contains("selected")'),true);
 await browser.evaluate('XuperStandalone.core.call=auditCall;XuperCatalog.handle({keyCode:13})');
 await browser.waitFor('document.querySelectorAll(".xt-catalog-card").length>0');
 await browser.evaluate('XuperCatalog.close()');
 assert.deepEqual(browser.errors,[]);console.log('PASS: all six dashboard destinations, D-Pad grid and empty-preview removal.');
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}
