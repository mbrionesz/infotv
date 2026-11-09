import http from 'node:http';import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import path from 'node:path';import {once} from 'node:events';import assert from 'node:assert/strict';import {browserHarness} from './browser-harness.mjs';
const root=path.resolve('app'),out=path.resolve(process.env.SCREENSHOT_DIR||'docs/screenshots/frontend-review');let browser;mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{if(req.url.includes('$WEBAPIS/')){res.setHeader('Content-Type','text/javascript');res.end('');return;}try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw new Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
try{
 server.listen(0,'127.0.0.1');await once(server,'listening');browser=await browserHarness();
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'XuperStandalone',{configurable:true,set:function(api){Object.defineProperty(window,'XuperStandalone',{value:api,configurable:true,writable:true});api.core.home=function(a,b,cb){cb(null,{items:[]})};api.core.getLiveCategories=function(cb){cb(null,[])};api.core.getLiveChannels=function(a,b,c,cb){cb(null,[{channelCode:'demo-one',name:'Canal de demostración'},{channelCode:'demo-two',name:'Señal de prueba'}],false)};api.core.poster=function(url,cb){fetch(url).then(function(r){return r.blob()}).then(function(blob){cb(null,{blob:blob})},cb)};var call=api.core.call;api.core.call=function(method,payload,cb){if(['catalogFullPage','catalogPage','catalogQuery','catalogSearch'].indexOf(method)<0)return call(method,payload,cb);var rows;if(payload.root==='series'){rows=[['Reacher','search-reacher.jpg'],['Outer Banks','search-outer-banks.jpg'],['El Chapo','search-chapo.jpg'],['Betty','search-betty.jpg'],['El señor de los cielos','search-senor-cielos.jpg'],['One Piece','search-one-piece.jpg'],['Secret Woman','search-secret-woman.jpg']].map(function(row,i){return {id:'demo-series-'+i,title:row[0],poster:'assets/catalog/'+row[1],year:'',country:''}})}else{rows=(window.XUPERTV_CATALOG.items||[]).filter(function(row){return row.poster&&row.poster.indexOf('search-')<0}).slice(0,18)}cb(null,{items:rows,total:rows.length,loaded:rows.length,hasMore:false,facets:{genres:[],years:[],countries:[],resolutions:[]}})};}});`});
 await browser.command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html'});await browser.waitFor('!!window.__xuper&&__xuper.state.screen==="home"');

 const audit=[];
 for(const width of [1920,3840]){
 await browser.command('Emulation.setDeviceMetricsOverride',{width,height:width*9/16,screenWidth:width,screenHeight:width*9/16,deviceScaleFactor:1,mobile:false});
 await browser.evaluate('__xuper.openSettings()');
 for(const id of ['profile','history','addons','share','playback','parent','display','netdiag','feedback','about']){
 await browser.evaluate('__xuper.settingsPanel('+JSON.stringify(id)+');__xuper.focus(document.querySelector(".settings-item.is-selected"))');
 await browser.evaluate('__xuper.key(39)');
 if(id==='playback'){
 for(let i=0;i<8;i++)await browser.evaluate('__xuper.key(40)');
 const position=await browser.evaluate('({group:__xuper.state.focus._group,scroll:document.getElementById("settings-right").scrollTop,visible:(function(){var a=__xuper.state.focus.getBoundingClientRect(),b=document.getElementById("settings-right").getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom})()})');
 assert.equal(position.group,'style');assert.ok(position.scroll>0);assert.ok(position.visible);
 for(const group of ['screen','audio','subLang','size','style','font']){
 const value=await browser.evaluate('(function(){var el=document.querySelector(".settings-panel.is-active .pb-opt[data-unused]");var options=Array.from(document.querySelectorAll(".settings-panel.is-active .pb-opt")).filter(function(x){return x._group==='+JSON.stringify(group)+'});__xuper.focus(options[1]);__xuper.key(13);return {value:__xuper.state.playback['+JSON.stringify(group)+'],checked:options[1].classList.contains("is-checked")}})()');assert.equal(value.value,1);assert.ok(value.checked);
 }
 await browser.evaluate('__xuper.focus(document.querySelector(".xt-setting-action"));__xuper.key(13);__xuper.key(13)');
 await browser.evaluate('__xuper.focus(Array.from(document.querySelectorAll(".xt-setting-action")).find(b=>b.textContent.startsWith("Subtítulos")));__xuper.key(13);__xuper.key(13);__xuper.key(13)');
 await browser.evaluate('__xuper.focus(Array.from(document.querySelectorAll(".xt-setting-action")).find(b=>b.textContent.includes("TMDB")));__xuper.key(13)');assert.ok(await browser.evaluate('!!document.querySelector(".xt-tmdb-settings")'));await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{keyCode:10009,bubbles:true}))');assert.equal(await browser.evaluate('!!document.querySelector(".xt-tmdb-settings")'),false);
 await browser.evaluate('__xuper.focus(Array.from(document.querySelectorAll(".settings-panel.is-active .pb-opt")).filter(function(x){return x._group==="style"})[1])');await browser.screenshot(path.join(out,'ajustes-final-'+width+'.png'));
 }
 if(id==='parent')await browser.evaluate('__xuper.key(13);__xuper.key(13)');
 if(id==='display')await browser.evaluate('__xuper.key(39);__xuper.key(13);__xuper.key(37);__xuper.key(13)');
 await browser.screenshot(path.join(out,"menu-"+id+"-"+width+".png"));audit.push({width,id});
 }
 await browser.evaluate('__xuper.focus(document.querySelector(".settings-item"))');for(let i=0;i<12;i++)await browser.evaluate('__xuper.key(40)');
 assert.equal(await browser.evaluate('__xuper.state.focus._index'),9);
 assert.ok(await browser.evaluate('document.getElementById("settings-menu").scrollTop>0'));
 }
 assert.deepEqual(browser.errors,[]);console.log('PASS settings: independent column scrolling at 1080p/4K; all ten panels; all playback groups, switches and display mode. '+JSON.stringify(audit));
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}
