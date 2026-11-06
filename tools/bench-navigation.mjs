import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import {browserHarness} from './browser-harness.mjs';
const root=path.resolve(process.argv[2]||'app');let browser;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 if(req.url.includes('$WEBAPIS/')){res.setHeader('Content-Type','text/javascript');res.end('');return;}
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}
});
try{
 server.listen(0,'127.0.0.1');await once(server,'listening');browser=await browserHarness();
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'XuperStandalone',{configurable:true,set:function(api){Object.defineProperty(window,'XuperStandalone',{value:api,writable:true,configurable:true});api.core.home=function(r,p,cb){cb(null,{items:[]})};api.core.getLiveCategories=function(cb){cb(null,[])};api.core.getLiveChannels=function(c,p,s,cb){cb(null,Array.from({length:2000},function(_,i){return {name:'Canal de prueba '+i,channelCode:'test'+i,index:i+1}}),false)};}});`});
 await browser.command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/index.html`});
 await browser.waitFor('!!window.__xuper');await browser.evaluate('__xuper.skipWelcome()');await browser.waitFor('__xuper.state.screen==="home"');
 await browser.command('Emulation.setCPUThrottlingRate',{rate:6});
 const metrics=await browser.evaluate(`(async function(){var times=[],frames=[];__xuper.focus(document.querySelector('.tab-item'));for(var i=0;i<40;i++){var start=performance.now();__xuper.key(i%16<8?40:38);times.push(performance.now()-start);await new Promise(requestAnimationFrame);frames.push(performance.now()-start);}times.sort(function(a,b){return a-b});frames.sort(function(a,b){return a-b});return {cpuThrottle:6,simulatedChannels:2000,domNodes:document.querySelectorAll('*').length,homeChannelRows:document.querySelectorAll('.live-row').length,handlerP50Ms:times[20],handlerP95Ms:times[38],nextFrameP95Ms:frames[38]};})()`);
 if(await browser.evaluate('!!window.XuperGuide')){
   await browser.evaluate('XuperGuide.open()');await browser.waitFor('document.querySelectorAll(".xt-guide-channels button").length===12');
   metrics.guideRows=await browser.evaluate('document.querySelectorAll(".xt-guide-channels button").length');
   await browser.screenshot('dist/guide-2000-channels.png');
 }
 mkdirSync('dist',{recursive:true});const name=process.argv[3]||'navigation-current';writeFileSync('dist/'+name+'.json',JSON.stringify(metrics,null,2)+'\n');console.log(JSON.stringify(metrics));
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}
