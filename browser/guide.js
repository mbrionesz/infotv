import {readGuideFavorites} from './stored-ui.js';
import {allowContent} from './content-filter.js';
import {addonPresets,savedAddons,playlistUrl,addonId,playlistMime} from './addons.js';
import {createButtonWindow} from './button-window.js';
import {openKeyboard} from './keyboard.js';
const fold=text=>String(text||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function createGuide(core){
  let panel=null,active=false,column=0,category=0,channel=0,action=0,categories=[],all=[],visible=[],query='',keyboard=null;
  let suspended=false,deleteDialog=null,headerAction=0,headerButtons=[];
  let sequence=0,page=1,hasMore=false,loading=false,selected=null,filterTimer=null,switchTimer=null;
  let favorites=readGuideFavorites();
  const favoriteKey=item=>item&&String(item.channelCode||item.streamUrl||'');
  const addonCache=new Map();let customAddons=savedAddons(localStorage),portalCategories=[];
  function rebuildCategories(){const id=categories[category]&&categories[category].id;categories=[{id:76182,name:'Todos'},{id:'__favorites',name:'★ Mis canales'},...portalCategories.filter(allowContent),...addonPresets,...customAddons,{id:'__m3u_add',name:'+ Añadir lista M3U'}];category=Math.max(0,categories.findIndex(item=>item.id===id));if(panel)renderCategories();}
  function addList(){if(keyboard)return;keyboard=openKeyboard({title:'URL de lista M3U · Guardar para añadir',mode:'url',onSubmit:value=>{try{const url=playlistUrl(value);const exists=[...addonPresets,...customAddons].find(item=>item.url===url);if(exists){category=categories.findIndex(item=>item.id===exists.id);return;}if(customAddons.length>=20)throw new Error('Máximo 20 listas personalizadas.');const item={id:'m3u:custom:'+addonId(url),name:'M3U · '+new URL(url).hostname,url,custom:true};customAddons.push(item);localStorage.setItem('xuper.m3uLists',JSON.stringify(customAddons));rebuildCategories();category=categories.findIndex(row=>row.id===item.id);}catch(error){status(error.message);}},onClose:()=>{keyboard=null;if(categories[category]&&categories[category].url)load();}});}
  function button(text,handler){const node=document.createElement('button');node.textContent=text;node.onclick=handler;return node;}
  function status(text){if(panel)panel.querySelector('.xt-guide-status').textContent=text;}
  let categoryWindow,channelWindow,actionButtons;
  function renderCategories(){categoryWindow.render(categories,category);}
  function renderChannels(){
    channelWindow.render(visible,channel,item=>selected&&favoriteKey(selected)===favoriteKey(item));
    panel.querySelector('.xt-guide-count').textContent=visible.length+(visible.length===1?' canal':' canales')+(loading?' · cargando…':hasMore?' · ↓ para cargar más':'');
    panel.querySelector('.xt-guide-query').textContent=query?'Buscar: '+query:'Buscar canal';
    panel.querySelector('.xt-guide-empty').textContent=visible.length?'':loading?'Cargando canales…':categories[category]&&categories[category].id==='__favorites'?'Aún no tienes favoritos. Elige un canal y pulsa Favorito →.':'No hay coincidencias';
  }
  function deleteList(){const cat=categories[category];if(!cat||!cat.custom)return;const dialog=document.createElement('div');dialog.className='xt-confirm';dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-label','Eliminar lista de canales');const title=document.createElement('h2');title.textContent='¿Eliminar esta lista?';const text=document.createElement('p');text.textContent=cat.name;dialog.appendChild(title);dialog.appendChild(text);const cancel=button('Conservar',()=>{dialog.remove();deleteDialog=null;});const remove=button('Eliminar lista',()=>{customAddons=customAddons.filter(item=>item.id!==cat.id);try{localStorage.setItem('xuper.m3uLists',JSON.stringify(customAddons));}catch(_){}addonCache.delete(cat.url);dialog.remove();deleteDialog=null;rebuildCategories();load();});dialog.appendChild(cancel);dialog.appendChild(remove);panel.appendChild(dialog);deleteDialog={node:dialog,buttons:[cancel,remove],index:0};cancel.classList.add('selected');return true;}
  function toggleFavorite(){
    const item=visible[channel],key=favoriteKey(item);if(!key)return;
    const next=Object.assign(Object.create(null),favorites);const saved=!next[key];
    if(saved)next[key]={name:item.name,channelCode:item.channelCode||'',index:item.index,streamUrl:item.streamUrl||''};else delete next[key];
    try{localStorage.setItem('xuper.guideFavorites',JSON.stringify(next));}catch(_){status('No se pudo guardar en este televisor.');return;}
    favorites=next;
    if(categories[category]&&categories[category].id==='__favorites'){all=Object.keys(favorites).map(key=>Object.assign({},favorites[key],{_search:fold(favorites[key].name)}));filter();}else renderChannels();
    focus();status(saved?'Canal guardado en Mis canales.':'Canal eliminado de Mis canales.');
  }
  function showFavorites(){query='';category=categories.findIndex(item=>item.id==='__favorites');column=1;load();focus();}
  function focus(){
    if(!panel)return;
    panel.dataset.column=String(column);
    panel.querySelector('.xt-guide-delete').hidden=!(categories[category]&&categories[category].custom);
    headerButtons=Array.from(panel.querySelectorAll('.xt-guide-header-actions button')).filter(node=>!node.hidden);headerAction=Math.min(headerAction,headerButtons.length-1);
    panel.querySelector('footer').textContent='OK: ver canal · →: favorito · ↑: buscar y Mis canales · Volver: inicio';
    const item=visible[channel],favorite=panel.querySelector('.xt-guide-save');panel.querySelector('.xt-guide-title').textContent=item?item.name:'Selecciona una señal';if(actionButtons[0])actionButtons[0].disabled=!item;
    if(favorite){favorite.disabled=!item;favorite.textContent=item&&favorites[favoriteKey(item)]?'★ Quitar favorito':'☆ Agregar a favoritos';favorite.setAttribute('aria-pressed',String(!!item&&!!favorites[favoriteKey(item)]));}
    headerButtons.forEach((node,i)=>node.classList.toggle('selected',column===3&&i===headerAction));
    actionButtons.forEach((node,i)=>node.classList.toggle('selected',column===2&&i===action));
  }
  function filter(){
    const key=fold(query);visible=all.filter(item=>allowContent(item)&&(!key||item._search.indexOf(key)>=0));channel=Math.min(channel,Math.max(0,visible.length-1));renderChannels();focus();
  }
  function load(more=false,force=false){
    if(categories[category]&&categories[category].id==='__m3u_add'){addList();return;}
    if(loading&&more)return;
    const run=more?sequence:++sequence;
    if(!more){page=1;all=[];visible=[];channel=0;selected=null;}
    loading=true;renderCategories();renderChannels();status('Consulta de canales…');
    if(categories[category]&&categories[category].id==='__favorites'){
      all=Object.keys(favorites).map(key=>Object.assign({},favorites[key],{_search:fold(favorites[key].name)}));loading=false;hasMore=false;filter();status('Tus favoritos guardados');return;
    }
    const addon=categories[category];
    if(addon&&addon.url){
      const apply=(error,items)=>{if(!active||run!==sequence)return;loading=false;hasMore=false;if(error){status(error.message||String(error));renderChannels();return;}all=(items||[]).map(item=>Object.assign({},item,{_search:fold(item.name+' '+item.group)}));filter();status('Lista M3U · '+all.length+' canales · busca también por grupo');};
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
  function fullscreen(){
    const target=visible[channel];if(!target)return;selected=target;
    const items=visible.slice();let index=items.indexOf(target);if(index<0){items.push(target);index=items.length-1;}suspended=true;active=false;panel.hidden=true;
    if(window.__xuper){__xuper.channels.splice(0,__xuper.channels.length,...items);__xuper.state.channel=Math.max(0,index);__xuper.show('player');}
  }
  function search(){
    if(keyboard)return;
    keyboard=openKeyboard({title:'Buscar canales',value:query,onChange:value=>{query=value;clearTimeout(filterTimer);filterTimer=setTimeout(filter,100);},onClose:()=>{keyboard=null;filter();}});
  }
  function open(options={}){
    if(active)return;if(panel)close();
    if(window.__xuper)__xuper.show('home');
    query='';action=0;headerAction=0;active=true;panel=document.createElement('section');panel.id='xt-guide';panel.className='xt-panel';
    panel.innerHTML='<header><div><span class="xt-eyebrow">TV EN VIVO</span><h1>Encuentra tu canal</h1><p>XuperTizen by Matias</p></div><div class="xt-guide-header-actions"><button class="xt-guide-query">Buscar canal</button><button class="xt-guide-favorites">★ Mis canales</button><button class="xt-guide-refresh">Actualizar</button><button class="xt-guide-delete" hidden>Eliminar lista</button></div></header><div class="xt-guide-columns"><section><h2>Categorías</h2><div class="xt-guide-categories"></div></section><section><h2>Canales <small class="xt-guide-count"></small></h2><div class="xt-guide-channels"></div></section><section class="xt-guide-preview"><div class="xt-guide-art" aria-hidden="true"><svg viewBox="0 0 100 100" width="96" height="96" fill="currentColor"><path d="M30 16v68l54-34z"/></svg></div><h2 class="xt-guide-title">Selecciona una señal</h2><p class="xt-guide-info">OK abre el canal a pantalla completa. → permite guardar el favorito.</p><div class="xt-guide-actions"></div><p class="xt-guide-status" role="status"></p></section></div><footer>Flechas para navegar · OK para elegir · Volver para salir</footer>';
    document.getElementById('app').appendChild(panel);panel.querySelector('.xt-guide-query').onclick=search;panel.querySelector('.xt-guide-favorites').onclick=showFavorites;panel.querySelector('.xt-guide-refresh').onclick=()=>load(false,true);panel.querySelector('.xt-guide-delete').onclick=deleteList;headerButtons=Array.from(panel.querySelectorAll('.xt-guide-header-actions button'));
    categoryWindow=createButtonWindow(panel.querySelector('.xt-guide-categories'),item=>item.name||'Categoría',index=>{category=index;column=0;load();});
    channelWindow=createButtonWindow(panel.querySelector('.xt-guide-channels'),(item,i)=>(favorites[favoriteKey(item)]?'★ ':'')+(item.index||i+1)+'  '+item.name,index=>{channel=index;column=1;fullscreen();});
    const empty=document.createElement('p');empty.className='xt-guide-empty';panel.querySelector('.xt-guide-channels').appendChild(empty);
    const actions=panel.querySelector('.xt-guide-actions');const save=button('☆ Agregar a favoritos',toggleFavorite);save.className='xt-guide-save';actions.appendChild(save);
    actionButtons=Array.from(actions.children);
    portalCategories=[];column=0;category=0;rebuildCategories();if(options.favorites)category=categories.findIndex(item=>item.id==='__favorites');if(options.addons)category=customAddons.length?categories.findIndex(item=>item.id===customAddons[0].id):categories.findIndex(item=>item.id==='__m3u_add');if(options.addons&&!customAddons.length){renderCategories();renderChannels();addList();}else load();focus();
    core.getLiveCategories((error,result)=>{if(!active||error||!result||!result.length)return;portalCategories=result.filter(item=>String(item.id)!=='76182');rebuildCategories();});
  }
  function resume(){if(!suspended||!panel)return false;suspended=false;active=true;panel.hidden=false;focus();return true;}
  function close(){
    suspended=false;if(deleteDialog){deleteDialog.node.remove();deleteDialog=null;}
    if(keyboard){keyboard.close();keyboard=null;}
    active=false;sequence++;clearTimeout(filterTimer);clearTimeout(switchTimer);if(panel)panel.remove();panel=null;
    // Playback leaves the legacy focus on hidden player controls. Restore a
    // visible home control before releasing remote events to the main screen.
    if(window.__xuper&&__xuper.state.screen==='home')__xuper.focus('.live-focus');
  }
  function handle(event){
    if(!active)return false;
    if([447,448,449].includes(event.keyCode))return false; // System owns volume.
    if(keyboard){keyboard.handle(event);return true;}
    const key=event.keyCode;
    if(deleteDialog){
      if([10009,461,27].includes(key)){deleteDialog.node.remove();deleteDialog=null;return true;}
      if(key===37||key===39)deleteDialog.index=1-deleteDialog.index;
      if(key===13){deleteDialog.buttons[deleteDialog.index].click();return true;}
      deleteDialog.buttons.forEach((b,i)=>b.classList.toggle('selected',i===deleteDialog.index));return true;
    }
    if([10009,461,27].includes(key)){close();return true;}
    if(key===403){
      const cat=categories[category];if(column===0&&cat&&cat.custom){deleteList();return true;}
      toggleFavorite();return true;
    }
    if(key===404){search();return true;}if(key===405){load(false,true);return true;}if(key===406){fullscreen();return true;}
    if(column===3){
      if(key===37||key===39)headerAction=Math.max(0,Math.min(headerButtons.length-1,headerAction+(key===39?1:-1)));
      else if(key===40)column=1;
      else if(key===13)headerButtons[headerAction].click();
      focus();return true;
    }
    if(key===38&&((column===0&&category===0)||(column===1&&channel===0))){column=3;headerAction=0;focus();return true;}
    if(key===37)column=Math.max(0,column-1);else if(key===39){if(column===0)load();column=Math.min(2,column+1);}
    else if(key===38||key===40){
      const delta=key===40?1:-1;
      if(column===0){category=Math.max(0,Math.min(categories.length-1,category+delta));renderCategories();}
      if(column===1){channel=Math.max(0,Math.min(visible.length-1,channel+delta));renderChannels();panel.querySelector('.xt-guide-title').textContent=visible[channel]?visible[channel].name:'Selecciona una señal';if(channel>=visible.length-2&&hasMore&&!query)load(true);}
      if(column===2){if(key===38&&action===0){column=3;headerAction=0;}else action=Math.max(0,Math.min(actionButtons.length-1,action+delta));}
    }else if(key===13){if(column===0){load();column=1;}else if(column===1){fullscreen();}else if(actionButtons[action]&&!actionButtons[action].disabled)actionButtons[action].click();}
    else if(key===427||key===428){channel=(channel+(key===427?1:-1)+visible.length)%Math.max(1,visible.length);renderChannels();clearTimeout(switchTimer);switchTimer=setTimeout(fullscreen,120);}
    focus();return true;
  }
  return {open,openAddons:()=>open({addons:true}),openFavorites:()=>open({favorites:true}),close,resume,handle,get active(){return active;},diagnostics:()=>window.XuperPlayer.diagnostics};
}
