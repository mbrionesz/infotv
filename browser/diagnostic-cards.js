export function stabilityLabel(report){
 if(!Array.isArray(report.samples)||report.samples.length<3)return {label:'Sin datos suficientes',state:'warning'};
 const variable=report.jitterMs>Math.max(80,report.latencyMs*.5);
 return {label:variable?'Variable en esta prueba':'Estable en esta prueba',state:variable?'warning':'ok'};
}
export function createDiagnosticCards({playback={},signal,internet,cdns,dns,close}){
 const panel=document.createElement('section');panel.className='xt-diagnostics xt-diagnostics-cards';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Diagnóstico de conexión');
 panel.innerHTML='<h1>Tu conexión</h1><p>Comprueba internet, DNS y servidores del canal.</p><div class="xt-diag-body"><div class="xt-diag-card-grid"></div><h2>Servidores del canal</h2><div class="xt-cdn-results" aria-live="polite">Pulsa Latencia CDN para comprobar los servidores de una señal abierta.</div><p class="xt-diag-note">Mediciones HTTP, no ping ICMP. Una respuesta no garantiza disponibilidad del vídeo. La estabilidad es una observación breve, no una garantía.</p></div><div class="xt-diag-actions"><button class="xt-diag-close">Cerrar</button><button class="xt-diag-network">Comprobar DNS</button><button class="xt-diag-cdn">Latencia CDN</button><button class="xt-diag-speed">Probar internet · 4 MiB</button></div>';
 const cards={};
 function card(id,label,value,note){const box=document.createElement('article');box.className='xt-diag-card';box.dataset.metric=id;const title=document.createElement('small'),result=document.createElement('strong'),detail=document.createElement('p');title.textContent=label;result.textContent=value;detail.textContent=note;box.appendChild(title);box.appendChild(result);box.appendChild(detail);panel.querySelector('.xt-diag-card-grid').appendChild(box);cards[id]={box,result,detail};}
 function update(id,value,note,state=''){const c=cards[id];c.result.textContent=(state==='ok'?'✓ ':'')+value;c.detail.textContent=note;c.box.className='xt-diag-card'+(state?' is-'+state:'');}
 const media=playback.media||{};
 card('latency','Latencia de internet','Sin medir','Tiempo de respuesta HTTP hacia Cloudflare.');
 card('speed','Descarga','Sin medir','Prueba manual de 4 MiB. No mide el enlace Wi-Fi.');
 card('stability','Estabilidad','Sin medir','Se estima con tres muestras de latencia.');
 card('dns','DNS seguro','Sin comprobar','Se conserva la configuración de DNS de la app.');
 card('playback','Reproducción',media.width?media.width+' × '+media.height:'Sin señal activa',playback.engine||'Abre un canal o vídeo para ver su formato.');
 card('buffer','Reserva de vídeo',Number.isFinite(media.bufferSeconds)?media.bufferSeconds.toFixed(1)+' s':'—','Datos de la reproducción al abrir el panel.');
 const alive=()=>!signal.aborted&&panel.isConnected;
 panel.querySelector('.xt-diag-close').onclick=close;
 panel.querySelector('.xt-diag-speed').onclick=async()=>{
  const button=panel.querySelector('.xt-diag-speed');if(button.disabled)return;button.disabled=true;update('speed','Midiendo…','Descarga limitada a 4 MiB.');
  try{const report=await internet({signal});if(!alive())return;update('latency',report.latencyMs+' ms','Respuesta HTTP, incluida la conexión.','ok');update('speed',report.downloadMbps+' Mbps','Estimación hacia Cloudflare · 4 MiB.','ok');const stability=stabilityLabel(report);update('stability',stability.label,'Variación '+report.jitterMs+' ms · '+report.samples.length+' muestras.',stability.state);}
  catch(_){if(alive()){update('speed','No medible','La conexión, TLS o CORS impidieron la prueba.','warning');update('stability','Sin comprobar','No se puede concluir estabilidad sin muestras.','warning');}}
  finally{button.disabled=false;}
 };
 panel.querySelector('.xt-diag-cdn').onclick=async()=>{
  const button=panel.querySelector('.xt-diag-cdn');if(button.disabled)return;button.disabled=true;const area=panel.querySelector('.xt-cdn-results');area.textContent='Comprobando servidores…';
  try{const report=await cdns({signal});if(!alive())return;area.textContent='';if(!report.results.length)area.textContent='Abre primero un canal para obtener sus servidores.';
   for(const row of report.results){const ok=row.httpStatus>=200&&row.httpStatus<400,line=document.createElement('article');line.className='xt-cdn-row '+(ok?'is-ok':'is-warning');const host=document.createElement('strong'),time=document.createElement('span'),state=document.createElement('small');host.textContent=row.host;time.textContent=row.httpStatus?row.elapsedMs+' ms':'Sin medición';state.textContent=(ok?'✓ Responde':row.httpStatus?'Respuesta con aviso':'No medible')+(row.httpStatus?' · HTTP '+row.httpStatus:'');line.appendChild(host);line.appendChild(time);line.appendChild(state);area.appendChild(line);}
  }catch(_){if(alive())area.textContent='No se pudo medir la conexión a estos servidores.';}finally{button.disabled=false;}
 };
 panel.querySelector('.xt-diag-network').onclick=async()=>{
  const button=panel.querySelector('.xt-diag-network');if(button.disabled)return;button.disabled=true;update('dns','Comprobando…','Consultando el transporte de la app.');
  try{const report=await dns();if(!alive())return;const hosts=report.hosts||[],secure=hosts.filter(h=>h.mode==='secure-dns'&&h.httpStatus&&!h.fallback),answered=hosts.filter(h=>h.status==='answered');
   if(secure.length)update('dns','En uso',secure.length+' conexiones por DNS seguro.','ok');
   else if(report.available||report.secureDnsCapable)update('dns','Transporte disponible','Aún no hay una conexión confirmada por DNS seguro.');
   else if(answered.length)update('dns','DoH responde','Prueba de resolución; no confirma la ruta del vídeo.','warning');
   else update('dns','Sin confirmar','Sin respuesta verificable; puede usarse el DNS del TV.','warning');
  }catch(_){if(alive())update('dns','No medible','No fue posible completar esta comprobación.','warning');}finally{button.disabled=false;}
 };
 panel.dataset.action='0';panel.querySelector('button').classList.add('is-focused');return panel;
}
