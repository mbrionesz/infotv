'use strict';
const {spawn}=require('node:child_process'),crypto=require('node:crypto'),path=require('node:path');
const {createMediaProxy}=require('./media-proxy.cjs');
function isVlcComplete(state,eofSeen){return !!(state.ready&&state.duration>0&&!state.refreshRequired&&(state.time>=state.duration-1||eofSeen&&state.time>=Math.max(0,state.duration-3)));}
function vlcEnvironment(executable,source=process.env){const env={...source};for(const key of Object.keys(env))if(/^(VLC_(?:PLUGIN_PATH|DATA_PATH|LIB_PATH)|LUA_PATH|LUA_CPATH)$/i.test(key))delete env[key];env.VLC_PLUGIN_PATH=path.join(path.dirname(executable),'plugins');env.VLC_DATA_PATH=path.dirname(executable);return env;}
function createVlcMedia({executable,resolver,onClosed=()=>{},proxyFactory=createMediaProxy,outputOptions=[],onDiagnostic=()=>{},getWindowHandle=()=>null,spawnProcess=spawn,controlTimeoutMs=10000,decoderRetryMs=8000,startupTimeoutMs=45000,pollMs=250}){
 let session=null,lastClosed=null;
 const copy=value=>JSON.parse(JSON.stringify(value));
 function current(id){if(!session||session.id!==id||session.closed)throw Error('Sesión de reproducción caducada');return session;}
 function network(item){return item.proxy?.snapshot?.()||{phase:'unknown',httpStatus:0,bytes:0,error:''};}
 function update(item,data){
  const state=item.state;state.controlReady=true;if(data.length>0)state.duration=data.length;
  if(data.time>=0&&data.state!=='stopped'&&(data.stats?.decodedvideo>0||data.stats?.displayedpictures>0))state.time=Math.max(Number(data.time)||0,data.position>0&&data.length>0?data.position*data.length:0);
  state.position=Number(data.position)||0;state.vlcState=data.state;state.paused=data.state==='paused';state.stats={decodedvideo:data.stats?.decodedvideo||0,decodedaudio:data.stats?.decodedaudio||0,displayedpictures:data.stats?.displayedpictures||0};
  if(state.stats.decodedvideo>0||(data.stats?.displayedpictures||0)>0){state.ready=true;state.stage='playing';}
  const tracks=[];for(const [name,stream]of Object.entries(data.information?.category||{})){
   if(name==='meta')continue;const type=String(stream.Type||stream.Tipo||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(!['audio','video','subtitle','subtitulo'].includes(type))continue;
   const id=Number(stream.ID||stream.Original_ID||(name.match(/\d+/)||[])[0]);tracks.push({id:Number.isFinite(id)?id:tracks.length,type:/subtitle|subtitulo/.test(type)?'sub':type,language:stream.Language||stream.Idioma||'',name:stream.Name||stream.Language||stream.Idioma||stream.Codec||'',codec:stream.Codec||stream['Códec']||'',selected:type==='audio'&&(typeof stream.Selected==='boolean'?stream.Selected:item.audioId===undefined?!tracks.some(track=>track.type==='audio'):id===item.audioId)});
   if(type==='video'){const dimensions=String(stream.Video_resolution||stream.Resolution||stream['Video resolution']||'').match(/(\d+)x(\d+)/);if(dimensions){state.width=Number(dimensions[1]);state.height=Number(dimensions[2]);}}
  }state.tracks=tracks;state.fps=Number(data.fps)||0;state.network=network(item);
 }
 function request(item,params={}){return new Promise((resolve,reject)=>{
  if(item.closed||!item.process?.stdin||item.pending.size>=16)return reject(Error('Control privado no disponible'));
  const generation=item.generation,requestId=++item.serial,command=params.command;let payload={action:'status'};
  if(command==='open'||command==='in_play')payload={action:'open',url:item.proxy.url,time:item.state.time,language:item.language,hwnd:item.hwnd?String(item.hwnd):'',software:!!item.softwareRetried||outputOptions.includes('--avcodec-hw=none'),videoOutput:outputOptions.includes('--vout=wingdi')?'wingdi':'',silent:outputOptions.includes('--aout=dummy')};
  else if(command==='pl_forcepause'||command==='pl_forceresume')payload={action:'pause',paused:command==='pl_forcepause'};
  else if(command==='seek')payload={action:'seek',time:Number(params.val)};
  else if(command==='audio_track')payload={action:'audio',track:Number(params.val)};
  else if(command==='subtitle_track')payload={action:'subtitle-off'};
  else if(command==='addsubtitle')payload={action:'subtitle',url:params.val};
  const timer=setTimeout(()=>{item.pending.delete(requestId);reject(Error('El motor no respondió al comando '+payload.action));},payload.action==='open'?20000:3000);
  item.pending.set(requestId,{resolve:data=>{if(item.closed||generation!==item.generation)return reject(Error('Control sustituido'));try{update(item,data);resolve(data);}catch(_){reject(Error('Respuesta inválida del controlador privado'));}},reject,timer});
  item.process.stdin.write(JSON.stringify({...payload,requestId})+'\n',error=>{if(error){const pending=item.pending.get(requestId);if(pending){clearTimeout(pending.timer);item.pending.delete(requestId);pending.reject(Error('Se cerró el control privado del motor'));}}});
 });}
 function stopChild(item){const child=item.process;item.process=null;item.generation++;item.protocolReady?.reject(Error('Reproducción cancelada'));item.protocolReady=null;for(const pending of item.pending.values()){clearTimeout(pending.timer);pending.reject(Error('Control sustituido'));}item.pending.clear();child?.kill();}
 function finish(item){if(item.closed)return;item.state.network=network(item);item.closed=true;clearInterval(item.timer);item.proxy?.close();lastClosed={...item.state,closed:true};onClosed(copy(lastClosed));}
 function close(id){const item=session;if(!item||id&&item.id!==id)return;finish(item);stopChild(item);if(session===item)session=null;}
 async function launch(item,software){
  stopChild(item);const generation=item.generation;item.state.controlReady=false;item.state.control={transport:'private-pipe',protocol:1};item.logTail='';item.eofSeen=false;
  if(item.closed)throw Error('Reproducción cancelada');
  const pref=String(typeof item.options.preferredAudio==='object'?item.options.preferredAudio?.language:item.options.preferredAudio||'es');item.language=/^en|^eng/.test(pref)?'en,eng':/^pt|^por/.test(pref)?'pt,por':'es,spa';
  if(item.hwnd===undefined)item.hwnd=getWindowHandle();item.softwareRetried=!!software;item.state.decoder=software?'software':'automatic';
  let readyResolve,readyReject;const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});item.protocolReady={reject:readyReject};
  const timer=setTimeout(()=>readyReject(Error('El controlador privado del motor no pudo iniciar.')),controlTimeoutMs);
  const child=item.process=spawnProcess(path.join(path.dirname(executable),'XuperMediaHost.exe'),[],{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],cwd:path.dirname(executable),env:vlcEnvironment(executable)});
  let buffer='';child.stdout.setEncoding('utf8');child.stdout.on('error',()=>{});child.stdin.on('error',()=>{});
  child.stdout.on('data',chunk=>{if(item.closed||generation!==item.generation)return;buffer+=chunk;if(buffer.length>1024*1024){fail(item,'El motor envió una respuesta inválida.');return;}let at;while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);try{const message=JSON.parse(line);if(message.event==='ready'&&message.protocol===1){clearTimeout(timer);item.protocolReady=null;item.state.controlReady=true;readyResolve();continue;}const pending=item.pending.get(message.requestId);if(!pending)continue;clearTimeout(pending.timer);item.pending.delete(message.requestId);if(message.error)pending.reject(Error('Motor de vídeo: '+String(message.error).replace(/https?:\/\/\S+/g,'[medio]').slice(0,120)));else pending.resolve(message.result);}catch(_){}}});
  child.stderr?.on('data',chunk=>{if(item.closed||generation!==item.generation)return;const text=chunk.toString();item.logTail=(item.logTail+text).slice(-2048);onDiagnostic(text.replace(/https?:\/\/\S+/g,'[media]').slice(0,4096));});
  child.once('error',error=>{if(item.closed||generation!==item.generation)return;clearTimeout(timer);item.state.error=error.code==='ENOENT'?'No se encontró el controlador incluido. Reinstala XuperWindows.':'Windows no pudo iniciar el controlador de vídeo ('+(error.code||'SPAWN_ERROR')+').';readyReject(Error(item.state.error));finish(item);});
  child.once('exit',code=>{if(item.closed||generation!==item.generation)return;clearTimeout(timer);item.state.exitCode=code;readyReject(Error('El controlador de vídeo terminó antes de iniciar.'));if(!item.state.ready&&!item.softwareRetried&&network(item).bytes>0&&network(item).httpStatus<400&&!network(item).error){item.pendingFallback=true;item.process=null;item.state.stage='software-decoder';return;}if(!item.state.ended)item.state.error=item.state.error||'Se cerró el controlador de vídeo ('+code+').';finish(item);});
  try{await ready;}finally{clearTimeout(timer);}
  if(item.closed)throw Error(item.state.error||'Reproducción cancelada');item.state.stage='loading-media';request(item,{command:'open'}).catch(error=>{if(item.generation===generation&&!item.closed)fail(item,error.message);});
 }
 function startupError(item){const net=network(item);if(net.httpStatus>=400)return 'El servidor de vídeo respondió HTTP '+net.httpStatus+'.';if(net.error)return 'No se pudo descargar el vídeo ('+net.error+').';if(net.bytes>0)return 'VLC recibe datos, pero no consiguió decodificar la imagen'+(item.softwareRetried?' con el respaldo por software.':'.');return 'VLC respondió, pero el servidor no empezó a enviar el vídeo.';}
 function fail(item,message){if(item.closed)return;item.state.error=message;finish(item);stopChild(item);}
 async function softwareFallback(item){
  if(item.closed||item.retrying||item.softwareRetried)return;item.retrying=true;item.softwareRetried=true;item.state.softwareFallbacks=1;item.state.stage='software-decoder';item.state.time=Number(item.options.startTime)||0;item.subtitleApplied=false;item.receivedAt=Date.now();
  try{await launch(item,true);}finally{item.retrying=false;}
 }
 async function monitor(item){
  if(item.closed||item.busy||item.retrying)return;if(item.pendingFallback){item.pendingFallback=false;await softwareFallback(item).catch(error=>fail(item,error.message));return;}if(item.waitingRefresh){if(Date.now()-item.startedAt>startupTimeoutMs)fail(item,'No se pudo renovar la autorización del vídeo.');return;}item.busy=true;
  try{await request(item);item.controlFailures=0;if(item.state.vlcState==='ended'){item.state.ended=true;if(item.state.duration>0)item.state.time=item.state.duration;finish(item);stopChild(item);return;}if(item.state.vlcState==='error'&&!item.state.refreshRequired){if(!item.state.ready&&!item.softwareRetried&&network(item).bytes>0&&network(item).httpStatus<400){await softwareFallback(item).catch(error=>fail(item,error.message));return;}fail(item,startupError(item));return;}
   if(item.state.ready){if(!item.subtitleApplied){item.subtitleApplied=true;await request(item,{command:'subtitle_track',val:-1});if(item.subtitleChoice?.url)await subtitle(item.id,item.subtitleChoice).catch(()=>{});}return;}
   const net=network(item),elapsed=Date.now()-item.startedAt;item.state.network=net;if(net.bytes>0&&!item.receivedAt)item.receivedAt=Date.now();const decoderElapsed=item.receivedAt?Date.now()-item.receivedAt:0;item.state.stage=net.bytes>0?(item.softwareRetried?'software-decoder':'decoding'):'waiting-network';
   if(item.state.refreshRequired){if(elapsed>startupTimeoutMs)fail(item,'No se pudo renovar la autorización del vídeo.');return;}
   if(net.httpStatus>=400||net.error){fail(item,startupError(item));return;}
   if(net.bytes>0&&!item.softwareRetried&&decoderElapsed>=decoderRetryMs){await softwareFallback(item).catch(error=>fail(item,error.message));return;}
   if(elapsed>=startupTimeoutMs&&(!item.receivedAt||decoderElapsed>=15000))fail(item,startupError(item));
  }catch(_){if(!item.closed&&!item.retrying&&++item.controlFailures>=8)fail(item,'Se perdió la conexión con el motor de vídeo de XuperWindows.');}
  finally{item.busy=false;}
 }
 async function open(options){
  close();const id=crypto.randomBytes(16).toString('hex'),item=session={id,closed:false,generation:0,options,port:0,password:'',proxy:null,process:null,pending:new Map(),serial:0,timer:null,busy:false,controlFailures:0,startedAt:Date.now(),subtitleChoice:options.subtitle||null,state:{id,engine:'vlc',stage:'starting-engine',controlReady:false,time:Number(options.startTime)||0,duration:Number(options.duration)||0,ready:false,paused:false,ended:false,tracks:[],width:0,height:0,stats:{},softwareFallbacks:0}};
  try{item.proxy=await proxyFactory({stream:options,resolver,onAuthFailure:()=>{item.state.refreshRequired=true;}});if(item.closed){item.proxy.close();throw Error('Reproducción cancelada');}await launch(item,false);if(item.closed)throw Error(item.state.error||'Reproducción cancelada');item.timer=setInterval(()=>monitor(item),pollMs);return {id};}
  catch(error){if(!item.closed){item.state.error=error.message;close(id);}throw error;}
 }
 async function command(id,action,value){const item=current(id);if(action==='pause')return request(item,{command:value?'pl_forcepause':'pl_forceresume'});if(action==='seek'&&Number.isFinite(value)&&value>=0)return request(item,{command:'seek',val:value});if(action==='audio'&&Number.isInteger(value)){item.audioId=value;return request(item,{command:'audio_track',val:value});}throw Error('Comando no permitido');}
 function subtitle(id,choice){const item=current(id);item.subtitleChoice=choice||null;return choice?.url?request(item,{command:'addsubtitle',val:item.proxy.subtitle(choice.url)}):request(item,{command:'subtitle_track',val:-1});}
 async function refresh(id,stream){
  const item=current(id),now=Date.now();if(!item.lastRefresh||now-item.lastRefresh>60000)item.refreshes=0;if((item.refreshes||0)>=2)throw Error('No se pudo renovar el vídeo');item.refreshes=(item.refreshes||0)+1;item.lastRefresh=now;item.startedAt=now;item.proxy.update(stream);item.state.refreshRequired=false;
  if(item.waitingRefresh||!item.process){item.waitingRefresh=false;item.retrying=true;try{await launch(item,item.softwareRetried);}finally{item.retrying=false;}return;}
  await request(item,{command:'in_play',input:item.proxy.url,option:'start-time='+item.state.time});if(item.subtitleChoice?.url&&item.state.ready)await subtitle(id,item.subtitleChoice);
 }
 return {open,command,subtitle,refresh,close,snapshot(id){if(lastClosed?.id===id)return copy(lastClosed);const item=current(id);item.state.network=network(item);return copy(item.state);},diagnostics(){return session&&!session.closed?copy({...session.state,network:network(session)}):copy(lastClosed||{engine:'vlc',stage:'idle'});}};
}
module.exports={createVlcMedia,isVlcComplete,vlcEnvironment};
