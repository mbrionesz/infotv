export function httpsAlternative(value){
  try{const url=new URL(value);if(url.protocol!=='http:'||url.hostname==='localhost'||/^\d+(?:\.\d+){3}$/.test(url.hostname)||url.hostname.indexOf('.')<0)return '';url.protocol='https:';return url.href;}catch(_){return '';}
}
export function probeManifest(url,headers={},timeout=6500){
  const transport=typeof window!=='undefined'&&window.XuperNativeTransport;
  if(transport&&transport.snapshot().available){
    let rejectPending,active=true;const promise=new Promise((resolve,reject)=>{
      rejectPending=reject;transport.request({url,headers,timeout}).then(result=>{
        if(!active)return;active=false;
        const fail=(kind,message,status=0)=>{const error=new Error(message);error.stage='manifest';error.kind=kind;error.status=status;reject(error);};
        if(!result||result.status<200||result.status>=300)return fail('http','La señal rechazó la lista HLS (HTTP '+(result&&result.status||0)+').',result&&result.status||0);
        if(result.body.byteLength>256*1024)return fail('too-large','Lista HLS demasiado grande');
        const text=new TextDecoder().decode(result.body);if(!/^\s*#EXTM3U/.test(text))return fail('invalid-playlist','La respuesta no es una lista HLS.',result.status);resolve({text,status:result.status});
      },()=>{if(active){active=false;const error=new Error('Error de red o TLS en sockets Samsung');error.kind='network-or-cors';reject(error);}});
    });return {promise,cancel:()=>{if(active){active=false;const error=new Error('Cambio de canal');error.kind='cancelled';rejectPending(error);}}};
  }
  let xhr;let cancel;
  const promise=new Promise((resolve,reject)=>{
    xhr=new XMLHttpRequest();let finished=false;
    function fail(kind,message,status=0){if(finished)return;finished=true;const error=new Error(message);error.stage='manifest';error.kind=kind;error.status=status;reject(error);}
    xhr.open('GET',url,true);xhr.timeout=timeout;
    for(const name of Object.keys(headers))if(!/^(user-agent|host|content-length|cookie|origin|referer|connection|accept-encoding)$/i.test(name))xhr.setRequestHeader(name,headers[name]);
    xhr.onerror=()=>fail('network-or-cors','No se pudo descargar la lista HLS: error de red, TLS o CORS.');
    xhr.ontimeout=()=>fail('timeout','La lista HLS no respondió en 6,5 segundos.');
    xhr.onabort=()=>fail('cancelled','Cambio de canal');
    xhr.onprogress=event=>{if(event.loaded>256*1024){fail('too-large','La lista HLS supera el límite de esta versión.');xhr.abort();}};
    xhr.onload=()=>{
      if(finished)return;
      if(xhr.status<200||xhr.status>=300)return fail('http','La señal rechazó la lista HLS (HTTP '+xhr.status+').',xhr.status);
      if(!/^\s*#EXTM3U/.test(xhr.responseText||''))return fail('invalid-playlist','La señal devolvió una respuesta que no es una lista HLS.',xhr.status);
      finished=true;resolve({text:xhr.responseText,status:xhr.status});
    };
    cancel=()=>xhr.abort();xhr.send();
  });
  return {promise,cancel:()=>cancel&&cancel()};
}
