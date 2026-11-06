// Readiness probe through the configured HTTPS proxy. Never prints sessions,
// signatures, stream URLs or authorization headers. Not a CORS/widget test.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';
import Module from 'node:module';
const require = createRequire(import.meta.url);
const report = {};
function request(options, callback) {
  const req = new EventEmitter(); const chunks = []; let child; let timeout = 15000; let aborted = false;
  req.write = value => chunks.push(Buffer.from(value));
  req.setTimeout = ms => { timeout = ms; return req; };
  req.abort = () => { aborted = true; child?.kill(); };
  req.end = () => {
    const target = (options.protocol || 'https:') + '//' + options.hostname + (options.port ? ':' + options.port : '') + options.path;
    const args = ['--silent','--show-error','--max-time',String(timeout/1000),'-X',options.method||'GET','--write-out','\n%{http_code}'];
    for(const [key,value] of Object.entries(options.headers||{})) if(key.toLowerCase()!=='content-length') args.push('-H',key+': '+value);
    if(chunks.length) args.push('--data-binary','@-');
    args.push(target); child=spawn('curl',args,{stdio:['pipe','pipe','pipe']});
    const output=[];child.stdout.on('data',chunk=>output.push(chunk));child.stderr.on('data',()=>{});
    child.on('error',error=>req.emit('error',error));
    child.on('close',code=>{
      if(aborted){req.emit('close');return;}
      if(code!==0){req.emit('error',new Error('Proxy/TLS transport failed ('+code+')'));req.emit('close');return;}
      const body=Buffer.concat(output);const split=body.lastIndexOf(10);
      const response=new EventEmitter();response.statusCode=Number(body.subarray(split+1).toString());response.headers={};response.resume=()=>{};
      callback(response);response.emit('data',body.subarray(0,split));response.emit('end');req.emit('close');
    });
    child.stdin.on('error',()=>{});child.stdin.end(Buffer.concat(chunks));
  };
  return req;
}
const http=require('node:http'),https=require('node:https');
http.request=https.request=request;
http.get=https.get=(options,callback)=>{const req=request(options,callback);req.end();return req;};
require('../companion/lib/dnsx.js').prepare=(options,callback)=>callback(null,options);
require('../companion/lib/upstream.js').agentFor=()=>undefined;
const filename=fileURLToPath(new URL('../companion/lib/magis.js',import.meta.url));
let source=readFileSync(filename,'utf8');
const start=source.indexOf('function refreshSeeds(e) {');const end=source.indexOf('\nfunction ',start+1);
source=source.slice(0,start)+'function refreshSeeds(e){if(e)e(new Error("No borrowed sessions in probe"));}\n'+source.slice(end);
const compiled=new Module(filename);compiled.filename=filename;compiled.paths=Module._nodeModulePaths(fileURLToPath(new URL('../companion/lib/',import.meta.url)));compiled._compile(source,filename);
const core=compiled.exports;
const call=(method,...args)=>new Promise((resolve,reject)=>core[method](...args,(error,...data)=>error?reject(error):resolve(data)));
const stop=setTimeout(()=>{console.log(JSON.stringify({...report,error:'Probe deadline exceeded'}));process.exit(1);},45000);
try{
  await call('ensureSession');report.guestSession=!!core.session.ready;
  const [categories]=await call('getLiveCategories');report.categories=categories.length;
  const [channels]=await call('getLiveChannels',null,1,10);report.channels=channels.length;
  if(channels[0]?.channelCode){const [stream]=await call('resolveLive',channels[0].channelCode);report.resolved=!!stream.url;report.format=stream.mime;}
  console.log(JSON.stringify(report));clearTimeout(stop);process.exit(0);
}catch(error){console.log(JSON.stringify({...report,error:String(error.portalCode||error.message).slice(0,180)}));clearTimeout(stop);process.exit(1);}
