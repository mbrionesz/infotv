import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
const {createLibmpvMedia}=createRequire(import.meta.url)('../../desktop/libmpv-media.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('libmpv adapter retains measured reserve and real presentation generation without fabricated VLC frames',async()=>{
 let launch,closed=false;
 const state={ready:true,state:'playing',time:12,length:7200,seekable:true,presentation:{configured:true,generation:1},stats:{},cache:{bufferSeconds:173.2,forwardBytes:1000000},information:{category:{'Stream 0':{Type:'Audio',ID:0,Language:'spa',Selected:true}}}};
 const media=createLibmpvMedia({executable:'/tmp/test/libmpv-2.dll',resolver:{},pollMs:10,spawnProcess:(exe,args,options)=>{
  launch={exe,args,options,commands:[]};const child=new EventEmitter();child.stdout=new EventEmitter();child.stdout.setEncoding=()=>{};child.stderr=new EventEmitter();child.stdin=new EventEmitter();child.kill=()=>{};
  child.stdin.write=(line,cb)=>{const request=JSON.parse(line);launch.commands.push(request);if(request.action==='pause'||request.action==='seek-end')state.state=request.paused?'paused':'playing';if(request.action==='seek'){state.time=request.time;state.presentation.generation++;}queueMicrotask(()=>child.stdout.emit('data',JSON.stringify({requestId:request.requestId,result:state})+'\n'));cb?.();};
  queueMicrotask(()=>{child.stdout.emit('data','{"event":"ready","protocol":1}\n');child.stdout.emit('data','{"event":"mpv-cache-policy","prefetchBytes":67108864}\n');});return child;
 },proxyFactory:async()=>({url:'http://127.0.0.1/cap/media',snapshot:()=>({httpStatus:206,bytes:4000}),close(){closed=true;}})});
 try{const {id}=await media.open({url:'https://example.test/movie.ts',preferredAudio:'es'});for(let i=0;i<30&&!media.snapshot(id).ready;i++)await wait(10);let snapshot=media.snapshot(id);assert.equal(snapshot.engine,'libmpv');assert.equal(snapshot.ready,true);assert.equal(snapshot.cache.bufferSeconds,173.2);assert.equal(snapshot.cachePolicy.goalSeconds,180);assert.equal(snapshot.stats.displayedpictures,0);assert.equal(snapshot.tracks[0].id,0);assert.equal(snapshot.tracks[0].selected,true);assert.match(launch.exe,/XuperMpvHost.exe$/);assert.equal(launch.options.shell,false);assert.match(launch.commands[0].language,/es-419/);await media.command(id,'pause',true);snapshot=await media.command(id,'seek',3600);assert.equal(snapshot.seek.status,'confirmed');assert.equal(snapshot.time,3600);assert.equal(snapshot.paused,true);await assert.rejects(media.command(id,'subtitle-style',{font:8,size:0,color:0}),/inválido/);await media.command(id,'subtitle-style',{font:1,size:2,color:3});assert.ok(launch.commands.some(c=>c.action==='subtitle-style'&&c.style.color===3));}finally{media.close();}assert.equal(closed,true);
});
