const KEY='xt.catalogStatistics.v1',LIMIT=90;
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const date=value=>Number.isFinite(value)&&Number.isFinite(new Date(value).getTime());
function entry(value){if(!value||!integer(value.total)||!date(value.changedAt))return null;const result={total:value.total,changedAt:value.changedAt};if(integer(value.movies)&&integer(value.series)&&value.movies+value.series===value.total){result.movies=value.movies;result.series=value.series;}return result;}
export function createCatalogStatistics(storage){
 let history=[],lastCheckedAt=null,status='saved',persisted=true;
 try{const data=JSON.parse(storage.getItem(KEY)||'null');if(data&&data.version===1&&Array.isArray(data.history)){for(const raw of data.history.slice(-LIMIT)){const item=entry(raw);if(item&&(!history.length||history[history.length-1].total!==item.total))history.push(item);}if(date(data.lastCheckedAt))lastCheckedAt=data.lastCheckedAt;}}catch(_){}
 function snapshot(){return {version:1,history:history.map(item=>Object.assign({},item)),lastCheckedAt,status,persisted};}
 function record(report){if(!report||report.complete!==true||!integer(report.total)||!date(report.checkedAt))return false;
  const latest=history[history.length-1];if(latest&&report.checkedAt<latest.changedAt)return false;
  if(!latest||latest.total!==report.total){const item={total:report.total,changedAt:report.checkedAt},reports=report.reports||[];const movies=reports.find(r=>r.root==='movies'),series=reports.find(r=>r.root==='series');if(movies&&series&&integer(movies.total)&&integer(series.total)&&movies.total+series.total===item.total){item.movies=movies.total;item.series=series.total;}history.push(item);history=history.slice(-LIMIT);}
  lastCheckedAt=report.checkedAt;status='ok';try{storage.setItem(KEY,JSON.stringify({version:1,history,lastCheckedAt}));persisted=true;}catch(_){persisted=false;}return true;
 }
 return {record,snapshot,failed(){status='unavailable';}};
}
export function createCatalogStatisticsPanel(store,document){let panel=null;
 const format=value=>new Date(value).toLocaleString('es-CL');
 function add(parent,tag,cls,text){const node=document.createElement(tag);node.className=cls;node.textContent=text;parent.appendChild(node);return node;}
 function render(){if(!panel)return;const win=document.defaultView,focus=win&&win.__xuper&&win.__xuper.state.focus,focused=focus&&panel.contains(focus),focusIndex=focused?Array.from(panel.querySelectorAll('.xt-catalog-stat-row')).indexOf(focus):-1;panel.textContent='';const data=store.snapshot(),latest=data.history[data.history.length-1];
  add(panel,'div','xt-setting-kicker','INFORMACIÓN DEL PORTAL');add(panel,'h1','xt-setting-title','Estadísticas del catálogo');
  add(panel,'p','xt-setting-body','Películas y Series · totales informados por el portal. Solo registramos cambios en el número total.');
  const card=add(panel,'div','xt-catalog-stat-card','');const badge=add(card,'span','xt-catalog-stat-status '+(data.status==='ok'?'is-ok':''),data.status==='ok'?'✓ Conteo recibido':data.status==='unavailable'?'◷ Sin actualización reciente':'◷ Último dato guardado');badge.setAttribute('role','status');
  add(card,'strong','xt-catalog-stat-total',latest?latest.total.toLocaleString('es-CL')+' títulos':'Sin conteo todavía');
  if(latest){add(card,'p','xt-setting-body','Último cambio · '+format(latest.changedAt));if(latest.movies!==undefined)add(card,'p','xt-setting-body','▣ Películas: '+latest.movies.toLocaleString('es-CL')+' · ▤ Series: '+latest.series.toLocaleString('es-CL'));}
  if(data.lastCheckedAt)add(card,'p','xt-setting-footnote','Última comprobación · '+format(data.lastCheckedAt));
  if(!data.persisted)add(panel,'p','xt-setting-body','No se pudo guardar el último dato en este televisor. Se conserva en esta sesión.');
  add(panel,'h2','xt-catalog-stat-heading','Historial de cambios');
  if(!latest)add(panel,'p','xt-setting-body','El historial aparecerá cuando el portal entregue un conteo completo.');
  const list=add(panel,'div','xt-catalog-stat-list','');list.setAttribute('role','list');
  const rows=data.history.slice().reverse();rows.forEach((item,index)=>{const row=add(list,'div','focusable xt-catalog-stat-row','');row.tabIndex=-1;row.setAttribute('role','listitem');row._onFocus=()=>{const adjust=()=>{if(!win||!win.__xuper||win.__xuper.state.focus!==row)return;const parent=panel.closest('.scrollable');if(!parent)return;const r=row.getBoundingClientRect(),p=parent.getBoundingClientRect(),scale=p.height/parent.clientHeight||1;if(r.bottom>p.bottom-12)parent.scrollTop+=(r.bottom-p.bottom+16)/scale;else if(r.top<p.top+12)parent.scrollTop-=(p.top-r.top+16)/scale;};if(win)win.requestAnimationFrame(adjust);};add(row,'span','',format(item.changedAt));add(row,'strong','',item.total.toLocaleString('es-CL')+' títulos');const prior=rows[index+1];if(prior){const diff=item.total-prior.total;add(row,'span','xt-catalog-stat-delta',(diff>0?'+':'')+diff.toLocaleString('es-CL'));}});
  if(focused&&focusIndex>=0){const target=list.children[Math.min(focusIndex,list.children.length-1)];if(target)win.__xuper.focus(target);}
  add(panel,'p','xt-setting-footnote','Hasta 90 cambios guardados como JSON local. Se conservan al limpiar caché. El conteo no verifica títulos únicos ni garantiza que todos estén disponibles.');
 }
 return {mount(node){panel=node;render();},render};
}
