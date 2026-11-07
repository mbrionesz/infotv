export function requestSignal(){
 const listeners=new Set();return {aborted:false,error:null,subscribe(fn){if(this.aborted){fn();return ()=>{};}listeners.add(fn);return ()=>listeners.delete(fn);},abort(error){if(this.aborted)return;this.aborted=true;this.error=error||Object.assign(new Error('Petición cancelada'),{name:'AbortError'});for(const fn of Array.from(listeners))fn();listeners.clear();}};
}
export function abortable(value,signal){
 if(!signal)return Promise.resolve(value);
 if(signal.aborted)return Promise.reject(signal.error);
 return new Promise((resolve,reject)=>{const off=signal.subscribe(()=>reject(signal.error));Promise.resolve(value).then(v=>{off();resolve(v);},e=>{off();reject(e);});});
}
