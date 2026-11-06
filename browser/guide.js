import {addonPresets,savedAddons,playlistUrl,addonId,playlistMime} from './addons.js';
import {createPlayer} from './player.js';
import {createButtonWindow} from './button-window.js';
import {openKeyboard} from './keyboard.js';
const fold=text=>String(text||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function createGuide(core){
  let panel=null,active=false,column=0,category=0,channel=0,action=0,categories=[],all=[],visible=[],query='',keyboard=null;
  let sequence=0,playSequence=0,page=1,hasMore=false,loading=false,selected=null,stream=null,filterTimer=null,switchTimer=null;
  let favorites={};try{favorites=JSON.parse(localStorage.getItem('xuper.guideFavorites')||'{}');}catch(_){}
  const preview=createPlayer(()=>stream);const addonCache=new Map();let customAddons=savedAddons(localStorage),portalCategories=[];
  function rebuildCategories(){const id=categories[category]&&categories[category].id;categories=[{id:76182,name:'Todos'},{id:'__favorites',name:'Favoritos'},...portalCategories,...addonPresets,...customAddons,{id:'__m3u_add',name:'+ Añadir lista M3U'}];category=Math.max(0,categories.findIndex(item=>item.id===id));if(panel)renderCategories();}
  function addList(){if(keyboard)return;keyboard=openKeyboard({title:'URL de lista M3U · Guardar para añadir',mode:'url',onSubmit:value=>{try{const url=playlistUrl(value);const exists=[...addonPresets,...customAddons].find(item=>item.url===url);if(exists){category=categories.findIndex(item=>item.id===exists.id);return;}if(customAddons.length>=20)throw new Error('Máximo 20 listas personalizadas.');const item={id:'m3u:custom:'+addonId(url),name:'M3U · '+new URL(url).hostname,url,custom:true};customAddons.push(item);localStorage.setItem('xuper.m3uLists',JSON.stringify(customAddons));rebuildCategories();category=categories.findIndex(row=>row.id===item.id);}catch(error){status(error.message);}},onClose:()=>{keyboard=null;if(categories[category]&&categories[category].url)load();}});}
  function button(text,handler){const node=document.createElement('button');node.textContent=text;node.onclick=handler;return node;}
  function status(text){if(panel)panel.querySelector('.xt-guide-status').textContent=text;}
  let categoryWindow,channelWindow,actionButtons;
  function renderCategories(){categoryWindow.render(categories,category);}
  function renderChannels(){
    channelWindow.render(visible,channel,item=>selected&&selected.channelCode===item.channelCode);
    panel.querySelector('.xt-guide-count').textContent=visible.length+' canales'+(loading?' · cargando…':hasMore?' · ↓ para cargar más':'');
    panel.querySelector('.xt-guide-query').textContent=query?'Buscar: '+query:'Buscar canal';
    panel.querySelector('.xt-guide-empty').textContent=visible.length?'':loading?'Cargando canales…':'No hay coincidencias';
  }
  function focus(){
    if(!panel)return;
    panel.dataset.column=String(column);
    actionButtons.forEach((node,i)=>node.classList.toggle('selected',column===2&&i===action));
  }
  function filter(){
    const key=fold(query);visible=key?all.filter(item=>item._search.indexOf(key)>=0):all.slice();channel=Math.min(channel,Math.max(0,visible.length-1));renderChannels();focus();
  }
  function load(more=false,force=false){
    if(categories[category]&&categories[category].id==='__m3u_add'){addList();return;}
    if(loading&&more)return;
    const run=more?sequence:++sequence;
    if(!more){playSequence++;page=1;all=[];visible=[];channel=0;preview.stop();selected=null;stream=null;}
    loading=true;renderCategories();renderChannels();status('Consulta de canales…');
    if(categories[category]&&categories[category].id==='__favorites'){
      all=Object.keys(favorites).map(key=>Object.assign({},favorites[key],{_search:fold(favorites[key].name)}));loading=false;hasMore=false;filter();status('Tus favoritos guardados');return;
    }
    const addon=categories[category];
    if(addon&&addon.url){
      const apply=(error,items)=>{if(!active||run!==sequence)return;loading=false;hasMore=false;if(error){status(error.message||String(error));renderChannels();return;}all=(items||[]).map(item=>Object.assign({},item,{_search:fold(item.name+' '+item.group)}));filter();status('Lista M3U · '+all.length+' canales · busca también por grupo · Amarillo actualiza'+(addon.custom?' · Rojo en categoría elimina':''));};
      const hit=addonCache.get(addon.url);if(!force&&hit&&Date.now()-hit.at<300000)apply(null,hit.items);
      else core.fetchM3u(addon.url,(error,items)=>{if(!error){addonCache.delete(addon.url);addonCache.set(addon.url,{at:Date.now(),items});if(addonCache.size>3)addonCache.delete(addonCache.keys().next().value);}apply(error,items);});return;
    }
    core.getLiveChannels(categories[category]&&categories[category].id,page,100,(error,items,moreAvailable,metadata)=>{
      if(!active||run!==sequence)return;loading=false;
      if(error){status(error.message||String(error));renderChannels();return;}
      const known=new Set(all.map(item=>item.channelCode||item.streamUrl));
      (items||[]).forEach(item=>{const id=item.channelCode||item.streamUrl;if(!known.has(id)){known.add(id);all.push(Object.assign({},item,{_search:fold(item.name)}));}});
      hasMore=!!moreAvailable;page++;filter();status(metadata&&metadata.stale?'Lista guardada; sin conexión confirmada al proveedor.':'Elige un canal y pulsa OK para reproducir.');
    });
  }
  function play(){
    const item=visible[channel];if(!item)return;
    if(selected&&selected.channelCode===item.channelCode&&preview.diagnostics.autoplayBlocked){preview.playFromGesture();return;}
    clearTimeout(switchTimer);const run=++playSequence;selected=item;status('Resolviendo '+item.name+'…');
    const resolved=(error,result)=>{
      if(!active||run!==playSequence)return;
      if(error){status('Resolución: '+(error.message||String(error)));return;}
      stream=result;panel.querySelector('.xt-guide-title').textContent=item.name;
      panel.querySelector('.xt-guide-info').textContent=item.now||'En vivo';
      preview.open(panel.querySelector('video'),result.url,{mime:result.mime,live:true,refreshStream:!item.streamUrl?done=>core.resolveLive(item.channelCode,(error,fresh)=>{if(!error)stream=fresh;done(error,fresh);},{force:true}):null,onStarted:()=>status('Reproduciendo · '+preview.diagnostics.engine),onError:message=>status(message)});
      renderChannels();
    };
    if(item.streamUrl)resolved(null,{url:item.streamUrl,headers:{},mime:playlistMime(item.streamUrl)});else core.resolveLive(item.channelCode,resolved);
  }
  function fullscreen(){
    const target=selected||visible[channel];if(!target)return;
    const items=visible.slice();let index=items.indexOf(target);if(index<0){items.push(target);index=items.length-1;}close();
    if(window.__xuper){__xuper.channels.splice(0,__xuper.channels.length,...items);__xuper.state.channel=Math.max(0,index);__xuper.show('player');}
  }
  function search(){
    if(keyboard)return;
    keyboard=openKeyboard({title:'Buscar canales',value:query,onChange:value=>{query=value;clearTimeout(filterTimer);filterTimer=setTimeout(filter,100);},onClose:()=>{keyboard=null;filter();}});
  }
  function open(options={}){
    if(active)return;
    if(window.__xuper)__xuper.show('home');
    active=true;panel=document.createElement('section');panel.id='xt-guide';panel.className='xt-panel';
    panel.innerHTML='<header><div><span class="xt-eyebrow">TV EN VIVO</span><h1>Encuentra tu canal</h1><p>XuperTizen by Matias</p></div><button class="xt-guide-query">Buscar canal</button></header><div class="xt-guide-columns"><section><h2>Categorías</h2><div class="xt-guide-categories"></div></section><section><h2>Canales <small class="xt-guide-count"></small></h2><div class="xt-guide-channels"></div></section><section class="xt-guide-preview"><video playsinline></video><h2 class="xt-guide-title">Selecciona una señal</h2><p class="xt-guide-info">OK reproduce en esta vista. Azul abre pantalla completa.</p><div class="xt-guide-actions"></div><p class="xt-guide-status" role="status"></p></section></div><footer>← → Columnas · ↑ ↓ Elegir · OK Reproducir · Rojo Favorito · Verde Buscar · Amarillo Actualizar · Azul Pantalla completa · Return Volver</footer>';
    document.getElementById('app').appendChild(panel);panel.querySelector('.xt-guide-query').onclick=search;
    categoryWindow=createButtonWindow(panel.querySelector('.xt-guide-categories'),item=>item.name||'Categoría',index=>{category=index;column=0;load();});
    channelWindow=createButtonWindow(panel.querySelector('.xt-guide-channels'),(item,i)=>(favorites[item.channelCode]?'★ ':'')+(item.index||i+1)+'  '+item.name,index=>{channel=index;column=1;play();});
    const empty=document.createElement('p');empty.className='xt-guide-empty';panel.querySelector('.xt-guide-channels').appendChild(empty);
    const actions=panel.querySelector('.xt-guide-actions');actions.appendChild(button('Pantalla completa',fullscreen));actions.appendChild(button('Diagnóstico',()=>window.XuperStandalone.openDiagnostics(preview.diagnostics)));
    actionButtons=Array.from(actions.children);
    portalCategories=[];column=0;category=0;rebuildCategories();if(options.addons)category=customAddons.length?categories.findIndex(item=>item.id===customAddons[0].id):categories.findIndex(item=>item.id==='__m3u_add');if(options.addons&&!customAddons.length){renderCategories();renderChannels();addList();}else load();focus();
    core.getLiveCategories((error,result)=>{if(!active||error||!result||!result.length)return;portalCategories=result.filter(item=>String(item.id)!=='76182');rebuildCategories();});
  }
  function close(){
    if(keyboard){keyboard.close();keyboard=null;}
    active=false;sequence++;playSequence++;clearTimeout(filterTimer);clearTimeout(switchTimer);preview.stop();if(panel)panel.remove();panel=null;
  }
  function handle(event){
    if(!active)return false;
    if([447,448,449].includes(event.keyCode))return false; // System owns volume.
    if(keyboard){keyboard.handle(event);return true;}
    const key=event.keyCode;
    if([10009,461,27].includes(key)){close();return true;}
    if(key===403){
      const cat=categories[category];if(column===0&&cat&&cat.custom){customAddons=customAddons.filter(item=>item.id!==cat.id);try{localStorage.setItem('xuper.m3uLists',JSON.stringify(customAddons));}catch(_){}addonCache.delete(cat.url);rebuildCategories();load();return true;}
      const item=visible[channel];if(item&&item.channelCode){if(favorites[item.channelCode])delete favorites[item.channelCode];else favorites[item.channelCode]={name:item.name,channelCode:item.channelCode,index:item.index,streamUrl:item.streamUrl||''};try{localStorage.setItem('xuper.guideFavorites',JSON.stringify(favorites));}catch(_){}renderChannels();status('Favoritos actualizados');}return true;
    }
    if(key===404){search();return true;}if(key===405){load(false,true);return true;}if(key===406){fullscreen();return true;}
    if(key===37)column=Math.max(0,column-1);else if(key===39){if(column===0)load();column=Math.min(2,column+1);}
    else if(key===38||key===40){
      const delta=key===40?1:-1;
      if(column===0){category=Math.max(0,Math.min(categories.length-1,category+delta));renderCategories();}
      if(column===1){channel=Math.max(0,Math.min(visible.length-1,channel+delta));renderChannels();if(channel>=visible.length-2&&hasMore&&!query)load(true);}
      if(column===2)action=1-action;
    }else if(key===13){if(column===0){load();column=1;}else if(column===1)play();else if(action===0)fullscreen();else window.XuperStandalone.openDiagnostics(preview.diagnostics);}
    else if(key===427||key===428){channel=(channel+(key===427?1:-1)+visible.length)%Math.max(1,visible.length);renderChannels();clearTimeout(switchTimer);switchTimer=setTimeout(play,160);}
    else if([415,19,10252].includes(key)){const video=panel.querySelector('video');if(video.paused)video.play().catch(()=>{});else video.pause();}
    focus();return true;
  }
  return {open,openAddons:()=>open({addons:true}),close,handle,get active(){return active;},diagnostics:()=>preview.diagnostics};
}
