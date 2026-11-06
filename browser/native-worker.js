/* Dedicated raw-socket worker; imported by the browser transport broker. */
let api=null;
if(typeof tizentvwasm==='undefined'){
 self.postMessage({ready:false,reason:'Tizen Sockets Extension no disponible'});
}else{
 try{
  importScripts('native/transport.js');
  const module=XuperNative({locateFile:name=>'native/'+name,onRuntimeInitialized:function(){
   api=module;
   if(api._net_init()!==0||api._net_probe()!==0){self.postMessage({ready:false,reason:'No inició HTTP/TLS'});return;}
   self.postMessage({ready:true,engine:'samsung-wasm-curl'});
  },print:()=>{},printErr:()=>{},onAbort:()=>self.postMessage({ready:false,reason:'No pudo iniciar WebAssembly/TLS'})});
 }catch(error){self.postMessage({ready:false,reason:'Falló la carga del transporte Samsung: '+String(error.message||error).slice(0,180)});}
}
self.onmessage=event=>{
 const {id,method,options}=event.data||{};if(!api)return;
 try{
  if(method==='dns'){
   const ok=api.cwrap('net_doh','number',['string'])(options.host);
   const result=ok===1?JSON.parse(api.UTF8ToString(api._net_report())):{};
   self.postMessage({id,result});return;
  }
  const bytes=options.body?new Uint8Array(options.body):new Uint8Array(0),ptr=api._malloc(Math.max(1,bytes.length));
  let status;
  try{
   api.HEAPU8.set(bytes,ptr);
   status=api.cwrap('net_request','number',['string','string','string','number','number','string','number','string','number'])(options.url,options.method||'GET',options.headers||'',ptr,bytes.length,options.host,options.port,options.ip||'',options.timeout||12000);
  }finally{api._free(ptr);}
  if(status<0)throw new Error(api.UTF8ToString(api._net_error())||'Fallo HTTP/TLS');
  const body=api.HEAPU8.slice(api._net_body(),api._net_body()+api._net_size()).buffer;
  self.postMessage({id,result:{status,body,headers:api.UTF8ToString(api._net_headers())}},[body]);
 }catch(error){self.postMessage({id,error:String(error.message||'Fallo del transporte')});}
};
