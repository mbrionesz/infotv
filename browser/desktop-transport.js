// Renderer receives a narrow bridge, never Node or unrestricted IPC access.
import {abortable,requestSignal} from './request-signal.js';
export function createDesktopTransport(bridge){
 let closed=false,serial=0;const pending=new Map();let last={available:true,engine:'windows-node-https',hosts:[]};
 function cancelled(){return Object.assign(new Error('Petición cancelada'),{name:'AbortError'});}
 function cancelAll(){for(const job of pending.values())job.abort();pending.clear();}
 return {
  ensure:()=>Promise.resolve(!closed),snapshot:()=>({...last,available:!closed}),
  async diagnose(){last=await bridge.diagnose();return last;},
  async request(options){
   if(closed)throw Error('Transporte cerrado');
   const id=++serial,signal=requestSignal();let off;
   const abort=()=>{signal.abort(options.signal?.error||cancelled());bridge.cancel(id);};
   if(options.signal?.aborted)throw options.signal.error||cancelled();
   pending.set(id,{abort});
   try{
    off=options.signal?.subscribe(abort);
    const body=options.body;
    const result=await abortable(bridge.request(id,{url:options.url,method:options.method||'GET',headers:options.headers||{},body:body==null?null:body,timeout:options.timeout||12000}),signal);
    if(signal.aborted)throw signal.error;
    if(result?.body&&!(result.body instanceof ArrayBuffer))result.body=new Uint8Array(result.body).buffer;
    return result;
   }catch(error){
    // Electron serializes IPC errors and drops their original name. Preserve
    // intentional cancellation so a replaced audio stream cannot fail its successor.
    if(signal.aborted)throw signal.error;
    throw error;
   }finally{pending.delete(id);off?.();}
  },
  dispose(){closed=true;cancelAll();},reset(){cancelAll();closed=false;}
 };
}
