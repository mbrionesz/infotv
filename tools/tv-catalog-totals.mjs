// Node.js 22+ on Windows/macOS/Linux. Uses the local Apps2Samsung inspector.
const args=process.argv.slice(2),option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1];};
const root=option('--root','series'),port=Number(option('--port','9222'));
if(!['series','movies','kids','anime'].includes(root)||!Number.isInteger(port)||port<1||port>65535)throw new Error('Usa --root series|movies|kids|anime y un puerto válido.');
let socket,timer;
try{
 const response=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('El inspector respondió HTTP '+response.status);
 const pages=(await response.json()).filter(page=>page.webSocketDebuggerUrl);
 const target=pages.find(page=>/xuper|infotv/i.test(page.title||''))||(pages.length===1?pages[0]:null);
 if(!target)throw new Error('Abre XuperTizen en Debug de Apps2Samsung; no se encontró un destino único.');
 const url=new URL(target.webSocketDebuggerUrl);
 if(url.protocol!=='ws:'||!['localhost','127.0.0.1'].includes(url.hostname)||Number(url.port)!==port)throw new Error('El inspector no devolvió un WebSocket local válido.');
 const result=await new Promise((resolve,reject)=>{
  socket=new WebSocket(url);timer=setTimeout(()=>reject(new Error('La consulta tardó más de 150 segundos')),150000);
  socket.addEventListener('error',()=>reject(new Error('No se pudo conectar al inspector local')));
  socket.addEventListener('close',()=>reject(new Error('Se cerró la conexión del inspector')));
  socket.addEventListener('open',()=>socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'XuperStandalone.compareCatalogTotals('+JSON.stringify(root)+')',awaitPromise:true,returnByValue:true}})));
  socket.addEventListener('message',event=>{let message;try{message=JSON.parse(event.data);}catch(_){return;}if(message.id!==1)return;if(message.error||message.result?.exceptionDetails)return reject(new Error('La app no pudo consultar el catálogo. Usa XuperTizen 0.9.3 o posterior y revisa la conexión del TV.'));const value=message.result?.result?.value;if(!value)return reject(new Error('Sin resultado del catálogo'));resolve(value);});
 });
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error('XT_CATALOG_ERROR: '+error.message);process.exitCode=1;}finally{clearTimeout(timer);if(socket)socket.close();}
